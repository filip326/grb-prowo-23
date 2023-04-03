import { config as dotenv } from 'dotenv';
dotenv();

import express from 'express';

const app = express();

import { MongoClient, Db } from 'mongodb';

import session from 'express-session';

import login from './login';

async function main() {
    if (!process.env.DB) {
        throw (new Error("DB URL is missing"));
    }
    if (!process.env.PORT || isNaN(parseInt(process.env.PORT))) {
        throw (new Error("PORT is missing OR invalid."))
    }
    if (process.env.ENV == null || (process.env.ENV !== "DEBUG" && process.env.ENV !== "PROD")) {
        throw (new Error("ENVIRONMENT is missing OR invalid."))
    }


    console.log('waiting on connection');

    let db: Db | null;
    try {
        console.log(process.env.DB)
        const dbClient = await MongoClient.connect(process.env.DB);
        console.log('connected, opening Database');
        db = dbClient.db('ProWo')
    } catch (e) {
        console.error('could not connect to dabase');
        throw new Error(JSON.stringify(e));
    }

    console.log('connected to db');

    app.use(session())

    app.use(express.urlencoded({ extended: false, }))
    app.use(express.json());
    app.set('view engine', 'ejs');
    app.set('views', './views');
    app.set('view cache', false);
    app.use(express.static('./public'));


    app.use(login(db))
    app.listen(process.env.PORT);
}

main();
