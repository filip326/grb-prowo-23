import { Router } from 'express';

import { Db } from 'mongodb';

import { Teacher, Student, User as IUser } from './types/user';

export default function (db: Db): Router {
    const router: Router = Router();

    const Users = db.collection<Teacher | Student | IUser>('users');

    router.post('', (req, res) => {});

    return router;
}
