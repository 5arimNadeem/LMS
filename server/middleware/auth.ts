import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "./catchAsyncError";
import ErrorHanlder from "../utils/ErrorHandler";
import jwt, { JwtPayload } from "jsonwebtoken";
import { safeRedis } from "../utils/redis";
import ErrorHandler from "../utils/ErrorHandler";

// authenticated user 
export const isAuthenticated = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    const access_token = req.cookies.access_token;

    if (!access_token) {
        return next(new ErrorHanlder("please lgooin to acc4ess thsi resource", 400))
    }

    const decoded = jwt.verify(access_token, process.env.ACCESS_TOKEN as string) as JwtPayload;

    if (!decoded) {
        return next(new ErrorHanlder("Invalid token, please login again", 401))
    }

    const user = await safeRedis.get(decoded.id);

    if (!user) {
        return next(new ErrorHanlder("User not found, please login again", 404))
    }

    req.user = JSON.parse(user);
    next();

    // req.user = decoded as any;
    // next();

});

// validate user role 

export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!roles.includes(req.user?.role || "")) {
            return next(
                new ErrorHandler(
                    `Role: ${req.user?.role} is not allowed to access this resource`,
                    403
                )
            );
        }
        next();
    };
};