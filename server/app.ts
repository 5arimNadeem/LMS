require('dotenv').config();

import express, { NextFunction, Request, Response } from 'express';

export const app = express();
import cors from "cors"
import cookieParser from "cookie-parser"
import UserRouter from './routes/user.route';
import courseRouter from './routes/course.route';
import orderRouter from './routes/order.route';
import notificationRouter from './routes/notification.route';
import analyticsRouter from './routes/analytics.route';
import layoutRouter from './routes/layout.route';

// bodyparser 

app.use(express.json({ limit: "50mb" }))

app.use(cookieParser());

// cors

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}))

app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send("Hello World");
})

// routes 
app.use('/api/v1', UserRouter, orderRouter, courseRouter, notificationRouter, analyticsRouter, layoutRouter);


app.all(/(.*)/, (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`Route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});