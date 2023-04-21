import { config as dotenv } from 'dotenv';
dotenv();

import express from 'express';

const app = express();

import { MongoClient,  Db } from 'mongodb';

import session from 'express-session';

import login from './login';
import LogManager from './logger/logger';
import wahltool from './wahltool';


async function main() {
    const logManager: LogManager = LogManager.getInstance();
    const dblogger = logManager.logger('Init-MongoDB');

    if (!process.env.DB) {
        throw (new Error("DB URL is missing"));
    }
    if (!process.env.PORT || isNaN(parseInt(process.env.PORT))) {
        throw (new Error("PORT is missing OR invalid."))
    }
    if (process.env.ENV == null || (process.env.ENV !== "DEBUG" && process.env.ENV !== "PROD")) {
        throw (new Error("ENVIRONMENT is missing OR invalid."))
    }

    dblogger.log("DEBUG", 'waiting on connection');

    let db: Db | null;
    try {
        const dbClient = await MongoClient.connect(process.env.DB, {});
        dblogger.log("INFO", "Successful db connection");
        db = dbClient.db('ProWo')
    } catch (e) {
        dblogger.log("ERROR", "Could not connect do db.");
        throw new Error(JSON.stringify(e));
    }

    app.use(session({
        secret: 'keyboard cat',
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }
    }));

    app.use(express.urlencoded({ extended: false, }))
    app.use(express.json());
    app.set('view engine', 'ejs');
    app.set('views', './views');
    app.set('view cache', false);


    app.use(login(db));
    app.use(wahltool(db));

    app.get('/home', (req, res) => {
        if (!req.isAuthenticated()) {
            res.redirect('/login.html')
        }
        
    })

    app.use(express.static('./public'));

    app.listen(process.env.PORT, () => {
        logManager.logger('Express-Server').logSync('INFO', `Server listens on Port localhost:${process.env.PORT}`);
    });
}

main();
