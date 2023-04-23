import { Router } from 'express';

import { Db } from 'mongodb';

import { hash } from 'bcrypt';

import { Teacher, Student, User as IUser, AccountType, isTeacher } from './types/user';

import PDFDocument from 'pdfkit';

import id from './id';

export default function (db: Db): Router {
    const router: Router = Router();

    const Users = db.collection<Teacher | Student | IUser>('users');

    router.post('/create-account', async (req, res) => {

        // check if user is logged in
        if (!req.isAuthenticated()) {
            res.status(401).json({ error: 'You must be logged in to create an account.' });
            return
        }

        // check if user is teacher or admin
        if (req.user.type !== "teacher" && req.user.admin === false) {
            res.status(401).json({ error: 'You must be a teacher or admin to create an account.' });
            return
        }

        const userlist = req.body.userlist;

        // check if userlist is not empty
        if (!userlist) {
            res.status(400).json({ error: 'Userlist is null or undefined.' });
            return
        }

        // check if userlist is an array
        if (!Array.isArray(userlist)) {
            res.status(400).json({ error: 'Userlist is not an array.' });
            return
        }

        // chek if userlist is not length = 0
        if (userlist.length === 0) {
            res.status(400).json({ error: 'Userlist is empty.' });
            return
        }

        // create array with successfully created users
        const successfullyCreatedUsers: CreatedUser[] = [];
        // list with failed users
        const failedUsers: string[] = [];

        for await (const user of userlist) {

            // check if user is not null
            if (!user) {
                continue;
            }

            // check if user includes
            // - username and type
            if (!user.username || !user.type) {
                failedUsers.push(user.username ?? 'unknown');
                continue;
            }

            // - fullName
            if (!user.fullName || !/[A-Za-z ]+/.test(user.fullName)) {
                failedUsers.push(user.username);
                continue;
            }

            const userId = id();

            const password = genPassword(12);

            // check if user type=teacher
            if (user.type === 'teacher') {

                if (!req.user.admin) {
                    failedUsers.push(user.username);
                    continue;
                }

                const teacher: Teacher = {
                    id: userId,
                    username: user.username,
                    fullName: user.fullName,
                    password: await hash(password, 12),
                    type: 'teacher',
                    changePasswordRequired: true,
                    admin: false,
                }

                const createdTeacher = await Users.insertOne(teacher);

                if (createdTeacher.acknowledged == true) {
                    successfullyCreatedUsers.push({
                        username: user.username,
                        fullName: user.fullName,
                        password: password,
                        type: 'teacher',
                    })
                } else {
                    failedUsers.push(user.username);
                }

            }

            if (user.type == 'student') {
                // check if all properties are set
                const teacher = req.user as Teacher;
                if (!teacher.managedClass || !teacher.managedGrade || isNaN(parseInt(teacher.managedClass)) || !teacher.managedGrade || teacher.managedGrade < 5 || teacher.managedGrade > 12) {
                    failedUsers.push(user.username);
                    continue;
                }
                if (!(isTeacher(req.user)) && !req.user.admin) {
                    failedUsers.push(user.username);
                }

                const student: Student = {
                    id: userId,
                    username: user.username,
                    fullName: user.fullName,
                    password: await hash(password, 12),
                    type: 'student',
                    admin: false,
                    grade: teacher.managedGrade,
                    class: teacher.managedClass,
                    changePasswordRequired: true,
                }

                const createdStudent = await Users.insertOne(student);

                if (createdStudent.acknowledged == true) {
                    successfullyCreatedUsers.push({
                        username: user.username,
                        fullName: user.fullName,
                        password: password,
                        type: 'student',
                    });
                }
            }

        }

        const pdf = new PDFDocument({size: 'A4'});

        pdf.registerFont('Ubuntu', './src/font/UbuntuMono-Regular.ttf');
        pdf.font('Ubuntu');

        let list: string[] = [];
        list.push(`Benutzername | fullName | Passwort`);

        successfullyCreatedUsers.forEach((user: CreatedUser) => {
            list.push(`${user.username} | ${user.fullName} | ${user.password}`);
        });

        pdf.end();
        const buffers: any[] = [];
        pdf.on('data', buffer => buffers.push(buffer));
        pdf.on('end', () => {
            const pdfBuffer = Buffer.concat(buffers);
            const dataUri = 'data:application/pdf;base64,' + pdfBuffer.toString('base64');
            res.send({
                successfullyCreatedUsers,
                failedUsers,
                pdf: dataUri
            });
        });
    });

    return router;
}

interface CreatedUser {
    username: string;
    fullName: string;
    type: AccountType;
    password: string;
}

function genPassword(length: number): string {
    let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,:_-;/\\()';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}