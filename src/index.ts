import { config as dotenv } from 'dotenv';
dotenv();

import express from 'express';

const app = express();



app.listen(process.env.PORT ?? 8080);