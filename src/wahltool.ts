import express from "express";
import { Db } from "mongodb";

import { Project } from "./types/project";
import { isStudent, isTeacher } from "./types/user";

export default (db: Db): express.Router => {
    const router: express.Router = express();
    const Projekte = db.collection<Project>('projekte')

    router.get('/projects/avaible', async (req, res) => {

        // check if user is authenticated
        if (!req.isAuthenticated()) {
            return res.status(401).redirect('/login');
        }

        // check if user is student
        if (!isStudent(req.user)) {
            return res.status(403).send({ message: "Only students can access this route." });
        }

        req.user

        // wrap projects, where minimum grade <= user's grade and maximum grade >= user's grade
        const projects = await Projekte.find({
            minimumGrade: { $lt: req.user.grade },
            maximumGrade: { $gt: req.user.grade }
        }).toArray()

        // respond with projects
        res.status(200).json(projects);

    });

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
        const projects = await Projekte.find({ }).toArray()

        // respond with projects
        res.status(200).json(projects);

    });

    return router;
};