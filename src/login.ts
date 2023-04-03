import { Router } from 'express';

import { Db } from 'mongodb';

import passport from 'passport';

import { Strategy as LocalStrategy } from 'passport-local';

import { compare, hash } from 'bcrypt';

import { User as IUser } from './types/user';

declare global {
    namespace Express {
        interface User extends IUser { }
    }
}

export default function (db: Db): Router {

    const router: Router = Router();

    const Users = db.collection('user');

    passport.serializeUser((user, done) => {
        done(null, user.id)
    })

    passport.deserializeUser(async (id: string, done) => {
        try {
            const user = await Users.findOne({ id: { $eq: id } }) as IUser | null;
            if (user === null) {
                done("User not found", null);
                return;
            }
            done(null, user)
        } catch {
            done("User not found", null)
        }

    })

    router.use(passport.initialize())
    router.use(passport.session())

    passport.use(new LocalStrategy(async (username, password, done) => {
        let user = await Users.findOne({ $or: [{ username: username }, { fullName: username }] }) as IUser | null;

        if (user == null) {
            return done("Nutzername konnte nicht zugeordnet werden.", false);
        }

        if (!user.password) {
            return done({ messages: "Kein Passwort in DB" }, false)
        }

        if (await compare(password, user.password)) {
            return done(null, user)
        }

        return done("Falsches Passwort", false)
    }))

    router.post('/login', passport.authenticate('local', {
        successRedirect: '/home',
        failureRedirect: '/login.html?error_msg=Login%20fehlgeschlagen',
    }))

    router.get('/chpwd', async (req, res) => {
        if (req.isAuthenticated() && req.user?.username) {
            res.render('change-password', { username: req.user.username, error_msg: '' })
            return;
        } else {
            res.redirect('/login.html')
            return;
        }
    })

    router.get('/logout', async (req, res) => {
        req.session.destroy((err) => {
            if (err) {
                res.status(500).render('error', {
                    error: {
                        code: 500,
                        title: "Server error",
                        description: "Session not destroyed"
                    },
                    redirect: {
                        link: "Dashboard",
                        url: "/home"
                    }
                })
            }
            else {
                res.redirect('/home')
            }
        })
    })

    router.post('/chpwd', async (req, res) => {
        if (!req.isAuthenticated() || !req.user?.username) {
            res.status(400).render('error', {
                error: {
                    code: 400,
                    title: 'Bad Request',
                    description: 'Der Nutzer konnte nicht authentifiziert werden.'
                },
                redirect: {
                    link: '/login.html',
                    name: 'Einloggen'
                }
            })
            return;
        }

        if (!req.body.username || !req.body.oldPassword ||
            !req.body.newPassword || !req.body.repeatPassword) {
            res.render('change-password', { username: req.user.username, error_msg: 'Daten fehlen.' })
            return;
        }

        // check if data are complete
        if (req.body.username !== req.user.username) {
            res.render('change-password', { username: req.user.username, error_msg: 'Benutzername stimmt nicht mit angemeldetem Benutzer überein.' })
            return;
        }


        if (req.body.newPassword !== req.body.repeatPassword) {
            res.render('change-password', { username: req.user.username, error_msg: 'Passwörter stimmen nicht überein.' })
            return;
        }

        const user = await Users.findOne({ $or: [{ username: req.body.username }, { fullName: req.body.username }] }) as IUser | null;

        if (user == null) {
            res.status(500).render('error', {
                error: {
                    code: 500,
                    title: 'Server Error',
                    description: 'Datenbankfehler.'
                }, redirect: {
                    link: '/chpwd',
                    name: 'Erneut versuchen'
                }
            });
            return;
        }

        if (!user.password) {
            res.status(500).render('error', {
                error: {
                    code: 500,
                    title: 'Server Error',
                    description: 'Datenbankfehler.'
                }
            })
        }

        try {
            if (!await compare(req.body.oldPassword, user.password)) {
                res.render('change-password', { username: req.user.username, error_msg: 'Altes Passwort falsch' })
                return;
            }

            if ((await Users.updateOne(
                { username: req.body.username },
                { $set: { password: await hash(req.body.newPassword, 20), passwordChangeRequired: false } })).acknowledged) {
                res.status(200).render('error', {
                    error: {
                        code: 200,
                        title: 'Erfolgreich',
                        description: 'Das Passwort wurde geändert.'
                    },
                    redirect: {
                        link: '/home',
                        name: 'Dashboard'
                    }
                })
            }
            else {
                throw new Error();
            }
        }
        catch (e) {
            res.status(500).render('error', {
                error: {
                    code: 500,
                    title: 'Server Error',
                    description: 'Datenbankfehler.'
                }, redirect: {
                    link: '/chpwd',
                    name: 'Erneut versuchen'
                }
            })
        }

    })


    return router;

}