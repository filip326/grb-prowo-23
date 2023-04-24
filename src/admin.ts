import { Router } from 'express';
import { Db } from 'mongodb';
import { isTeacher, Teacher } from './types/user';

export function admin(db: Db): Router {
    const router = Router();

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

        res.render('admin')

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

        if (!req.body.class_name || !req.body.class_grade  || isNaN(parseInt(req.body.class_grade))) {
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

        res.render('admin');

    })

    return router;
}