import { Router } from 'express';
import { Db } from 'mongodb';
import { isTeacher, Student, Teacher, User as IUser } from './types/user';
import { Project } from './types/project';

export function admin(db: Db): Router {
    const router = Router();

    const Users = db.collection<Teacher | Student | IUser>('users');
    const Projekte = db.collection<Project>('projekte')

    router.get('/admin', async (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login.html');
            return;
        }

        if (req.user.admin != true) {
            res.status(200).render('error', {
                error: {
                    code: 403,
                    title: 'Forbidden',
                    description: 'Sie sind nicht berechtigt, diese Seite zu öffnen'
                },
                redirect: {
                    link: '/home',
                    name: 'Startseite'
                }
            })
        }

        res.render('admin', {
            projects: (await Projekte.find({}).toArray()).map(async (value) => {
                let teacher = await Users.findOne({ id: "${value.teacherId}" })
                return `<div class="choice" id="${value.id}">
                        <input type="text" placeholder="title" name="title" required value="${value.name}">
                        <textarea placeholder="description" name="description" required>${value.description}</textarea>
                        <input type="text" placeholder="minGrade" name="minGrade" value="${value.minimumGrade}">
                        <input type="text" placeholder="maxGrade" name="maxGrade" value="${value.maximumGrade}">
                        <input type="text" placeholder="asignedTeacherUsername" name="asignedTeacher" value="${teacher?.username ?? 'Error'}">
                        <div class="button-wrapper">
                            <button onclick="deleteProject('${value.id}')">Löschen</button>
                        </div>
                    </div>`;
            }).join('\n') || "Zur Zeit sind keine Projekte eingetragen"
        });

    });

    router.get('/my-class', async (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(403).send("Forbidden");
            return;
        }

        if (!isTeacher(req.user)) {
            res.status(200).send({
                exists: false,
                allowedToCreate: false,
            })
            return;
        }

        if (!req.user.managedClass || !req.user.managedGrade) {
            res.status(200).send({
                exists: false,
                allowedToCreate: true,
            })
            return;
        }

        res.status(200).send({
            exists: true,
            allowedToCreate: false,
            class: req.user.managedClass,
            grade: req.user.managedGrade,
        })

    });

    router.post('/my-class', async (req, res) => {
        if (!req.isAuthenticated()) {
            res.status(403).send("Forbidden");
            return;
        }

        if (!isTeacher(req.user)) {
            res.status(403).send("Forbidden");
            return;
        }

        if (!req.body.class_name || !req.body.class_grade || isNaN(parseInt(req.body.class_grade))) {
            res.status(400).render('error', {
                error: {
                    code: 400,
                    title: 'Bad Request',
                    description: 'Bitte geben Sie die Daten vollständig ein.'
                },
                redirect: {
                    link: '/admin',
                    name: 'Admin-Seite'
                }
            })
            return;
        }

        if (req.user.managedClass || req.user.managedGrade) {
            res.status(400).render('error', {
                error: {
                    code: 400,
                    title: 'Bad Request',
                    description: 'Sie verwalten bereits eine Klasse.'
                },
                redirect: {
                    link: '/admin',
                    name: 'Admin-Seite'
                }
            })
            return;
        }

        await db.collection<Teacher>('users').updateMany({ id: req.user.id }, { $set: { managedClass: req.body.class_name, managedGrade: parseInt(req.body.class_grade) } });

        res.render('admin', {
            projects: (await Projekte.find({}).toArray()).map(async (value) => {
                let teacher = await Users.findOne({ id: "${value.teacherId}" })
                return `<div class="choice" id="${value.id}">
                        <input type="text" placeholder="title" name="title" required value="${value.name}">
                        <textarea placeholder="description" name="description" required>${value.description}</textarea>
                        <input type="text" placeholder="minGrade" name="minGrade" value="${value.minimumGrade}">
                        <input type="text" placeholder="maxGrade" name="maxGrade" value="${value.maximumGrade}">
                        <input type="text" placeholder="asignedTeacherUsername" name="asignedTeacher" value="${teacher?.username ?? 'Error'}">
                        <div class="button-wrapper">
                            <button onclick="deleteProject('${value.id}')">Löschen</button>
                        </div>
                    </div>`;
            }).join('\n') || "Zur Zeit sind keine Projekte eingetragen"
        });

    })

    return router;
}