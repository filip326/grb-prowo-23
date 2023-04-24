import { Router } from "express";
import { Db } from "mongodb";

import { Project } from "./types/project";
import { isStudent, isTeacher } from "./types/user";

export default (db: Db): Router => {
    const router: Router = Router();
    const Projekte = db.collection<Project>('projekte')

    // all projects
    router.get('/projects/all', async (req, res) => {

        // check for authentication type=teacher or admin
        if (!req.isAuthenticated()) {
            return res.status(401).redirect('/login');
        }

        // check if user is student
        if (!isTeacher(req.user) && !req.user.admin) {
            return res.status(403).send({ message: "Only teachers or admins can access this route." });
        }

        // wrap projets
        const projects = await Projekte.find({}).toArray()

        // respond with projects
        res.status(200).json(projects);
    });

    router.get('/voting', async (req, res) => {
        // check for authentication type=teacher or admin
        if (!req.isAuthenticated()) {
            return res.status(401).redirect('/login');
        }

        if (isStudent(req.user)) {
            res.render('vote', {
                options: (await Projekte.find({
                    minimumGrade: { $lt: req.user.grade },
                    maximumGrade: { $gt: req.user.grade }
                }).toArray()).map((value) => {
                    return `<div class="choice">
                        <div class="title">${value.name}</div>
                        <div class="description">${value.description}</div>
                        <div class="button-wrapper">
                            <input type="radio" name="vote1" value="${value.id}">
                            <input type="radio" name="vote2" value="${value.id}">
                            <input type="radio" name="vote3" value="${value.id}">
                        </div>
                    </div>`
                }).join('\n') || "Zur Zeit sind keine Projekte verfügbar"
            });
        } else {
            res.render('error', {
                error: {
                    code: 403,
                    title: "Diese Funktion ist nur Schüler:innen vorbehalten.",
                    description: "Sie haben auf diese Funktion keinen Zugriff."
                },
                redirect: {
                    link: "Startseite",
                    url: "/home"
                }
            });
        }
    })

    // router.post('/voting', async (req, res) => {

    // })

    return router;
};