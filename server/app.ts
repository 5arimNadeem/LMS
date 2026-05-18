require('dotenv').config();

import express, { NextFunction, Request, Response } from 'express';

export const app = express();
import cors from "cors"
import cookieParser from "cookie-parser"
import UserRouter from './routes/user.route';

// bodyparser 

app.use(express.json({ limit: "50mb" }))

app.use(cookieParser());

// cors

app.use(cors({
    origin: process.env.ORIGIN,
    // credentials: true
}))

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("Hello World");
})

// routes 
app.use('/api/v1', UserRouter);

// test api 
app.get(/test/, (req: Request, res: Response, next: NextFunction) => {
    // res.send("Hello World");
    res.status(200).json({
        success: true,
        message: "Test pass "
    })
})

app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});