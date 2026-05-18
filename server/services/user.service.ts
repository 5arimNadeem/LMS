import userModel from "../models/user.model";
import { Response } from "express";
import { safeRedis } from "../utils/redis";

export const getUserById = async (res: Response, id: string) => {
    const userJson = await safeRedis.get(id);

    if (userJson) {
        const user = JSON.parse(userJson);
        res.status(201).json({
            success: true,
            user
        });
    }
}