import express from "express";
import { Db } from "mongodb";

export default (db: Db): express.Router => {
    const router: express.Router = express();
    const Wahltool = db.collection('wahltool')

    router.get('/wahltool/vote/:id', async (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login.html')
            return;
        }

        const voting = await Wahltool.findOne({ id: parseInt(req.params.id) })
        if (!voting || !voting.choices || !voting.title) {
            return res.status(500).render('error', {
                error: {
                    code: 500,
                    title: "Server Error",
                    description: "Serverseitiger Datenbankfehler"
                },
                redirect: {
                    link: "/wahltool/start",
                    name: "Wahltool Startseite"
                }
            })
        }

        return res.render('wahltool/wish-vote.ejs', {
            voting: {
                name: voting.title,
                id: voting.id
            },
            choices: voting.choices.map((value: any) => {
                return `<div class="choice">
                    <div class="title">${value.title}</div>
                    <div class="description">${value.description}</div>
                    <button>Bearbeiten</button>
                </div>`
            }).join('\n') || "- keine Optionen eingetragen -"
        })
    });

    return router;
};