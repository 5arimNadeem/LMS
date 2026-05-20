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

//get All users --->only for admin

export const getAllUsersServices = async (res: Response) => {
    const users = await userModel.find().sort({ createdAt: -1 });
    res.status(201).json({ success: true, users });
};

// update user role 

export const updateUserRoleService = async (res: Response, id: string, role:string) => {
    const user = await userModel.findByIdAndUpdate(id,{role}, {new:true});

    res.status(201).json({
        success:true,
        user
    })
}