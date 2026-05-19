require("dotenv").config();
import { Request, Response, NextFunction } from "express";
import userModel, { Iuser } from "../models/user.model";
import ErrorHanlder from "../utils/ErrorHandler";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import jwt, { JwtPayload, Secret } from "jsonwebtoken";
import ejs from "ejs";
import path from "path";
import sendMail from "../utils/sendMail";
import ErrorHandler from "../utils/ErrorHandler";
import { accessTokenOptions, refreshTokenOptions, sendToken } from "../utils/jwt";
import { safeRedis } from "../utils/redis";
import { getUserById } from "../services/user.service";
import cloudinary from "cloudinary"
// import { get } from "http";

// register user 
interface IRegistrationBody {
    name: string,
    email: string,
    password: string,
    avatar?: string
}

export const registrationUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, password }: IRegistrationBody = req.body;

        // if (!name || !email || !password) {
        //     return next(new ErrorHanlder("Please enter all fields", 400));
        // }

        const isEmailExist = await userModel.findOne({ email });

        if (isEmailExist) {
            return next(new ErrorHanlder("User already exist", 400));
        }

        const user: IRegistrationBody = {
            name,
            email,
            password
        }

        const activationToken = createActivationToken(user);
        const activationCode = activationToken.activationCode;
        const data = { user: { name: user.name }, activationCode }
        // const html = await ejs.renderFile(path.join(__dirname, "../mails/activation-mail.ejs"), data);

        try {
            await sendMail({
                email: user.email,
                subject: "Activate your account",
                template: "activation-mails.ejs",
                data
            });
            res.status(201).json({
                success: true,
                message: `Please check your email ${user.email} to activate your account`,
                activationToken: activationToken.token,
            })
        } catch (error) {
            return next(new ErrorHanlder("Error occurred while sending activation email", 400));
        }

    } catch (error) {
        return next(new ErrorHanlder("Error occurred while registering user", 400));
    }

    // const user = await userModel.create({
    //     name,
    //     email,
    //     password,
    //     avatar: {
    //         public_id: "sample_id",
    //         url: avatar || "https://res.cloudinary.com/dzcmadjlq/image/upload/v1690794417/avatar/default_avatar_oqh8l9.png"
    //     }
    // });

    // res.status(201).json({
    //     success: true,
    //     message: "User registered successfully",
    //     user
    // })
})

interface IActivationToken {
    token: string,
    activationCode: string
}

export const createActivationToken = (user: any): IActivationToken => {
    let activationCode = Math.floor(10000 + Math.random() * 90000).toString();
    const token = jwt.sign({ user, activationCode }, process.env.ACTIVATION_SECRET as Secret, {
        expiresIn: "5m",
    });
    return {
        token,
        activationCode
    }
}

// activate user account
interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { activation_token, activation_code } = req.body as IActivationRequest;

        const newUser: { user: Iuser; activationCode: string } = jwt.verify(activation_token, process.env.ACTIVATION_SECRET as string) as { user: Iuser; activationCode: string };

        if (newUser.activationCode !== activation_code) {
            return next(new ErrorHanlder("Invalid activation code", 400));
        }

        const { name, email, password } = newUser.user;

        const existUser = await userModel.findOne({ email })

        if (existUser) {
            return next(new ErrorHanlder("User already exist", 400));
        }

        const user = await userModel.create({
            name,
            email,
            password,
        });
        res.status(201).json({
            success: true,
            message: "User registered successfully",
            user
        })
    } catch (error: any) {
        return next(new ErrorHanlder(error.message, 400));

    }
})

// login user 
interface IloginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body as IloginRequest;

            if (!email || !password) {
                return next(
                    new ErrorHandler("Please enter your email and password", 400)
                );
            }

            const user = await userModel.findOne({ email }).select("+password");

            if (!user) {
                return next(new ErrorHandler("Invalid email or password", 400));
            }

            const isPasswordMatch = await user.comparepassword(password);

            if (!isPasswordMatch) {
                return next(new ErrorHandler("Invalid email and password", 400));
            }
            sendToken(user, 201, res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// logout user
export const logoutUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });
            res.cookie("refresh_token", "", { maxAge: 1 });
            const userId = req.user?._id || "";

            safeRedis.del(userId.toString());
            res.status(200).json({
                success: true,
                message: "Logged out successfully",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

// udpate access token 

export const updateAccessToken = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_token = req.cookies.refresh_token as string;

            const decoded = jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN as string
            ) as JwtPayload;

            const message = "Could not refresh token";
            if (!decoded) {
                return next(new ErrorHandler(message, 400));
            }
            const session = await safeRedis.get(decoded.id as string);
            if (!session) {
                return next(
                    new ErrorHandler("Please Login to access this resource", 400)
                );
            }

            const user = JSON.parse(session);

            const accessToken = jwt.sign(
                { id: user._id },
                process.env.ACCESS_TOKEN as string,
                { expiresIn: "5m" }
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN as string,
                { expiresIn: "3d" }
            );

            req.user = user;
            res.cookie("access_token", accessToken, accessTokenOptions);
            res.cookie("refresh_token", refreshToken, refreshTokenOptions);

            await safeRedis.set(user._id, JSON.stringify(user), "EX", 604800);

            res.status(200).json({
                success: true,

                accessToken,
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);


// get user info 

export const getUserInfo = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            if (!userId) {
                return next(new ErrorHandler("User not found", 404));
            }
            await getUserById(res, userId.toString());
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface ISocialAuthBody {
    name: string;
    email: string;
    avatar: string;
}

// social auth 

export const socialAuth = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email, avatar } = req.body as ISocialAuthBody;
        const user = await userModel.findOne({ email });
        if (!user) {
            const newUser = await userModel.create({ name, email, avatar: { public_id: "", url: avatar } });
            sendToken(newUser, 201, res);
        }
        else {
            sendToken(user, 200, res);
        }
    } catch (error: any) {
        return next(new ErrorHandler("Error occurred while processing social authentication", 400));

    }
})

interface IUpdateUserInfo {
    name?: string;
    email?: string;
}

export const updateUserInfo = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, email } = req.body as IUpdateUserInfo;
        const userId = req.user?._id;
        if (!userId) {
            return next(new ErrorHandler("User not found", 404));
        }

        const user = await userModel.findById(userId)

        if (email && user) {
            const isEmailExist = await userModel.findOne({ email });
            if (isEmailExist) {
                return next(new ErrorHandler("Email already in use", 400));
            }
            user.email = email;
        }

        if (name && user) {
            user.name = name;
        }
        await user?.save();

        await safeRedis.set(userId.toString(), JSON.stringify(user));

        res.status(200).json({
            success: true,
            // message: "User information updated successfully",
            user
        })


    } catch (error) {
        return next(new ErrorHandler("Error occurred while updating user information", 400));
    }
})

// udpate user password 

interface IupdatePassword {
    oldPassword: string;
    newPassword: string;
}
//change password
export const updateUserPassword = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { oldPassword, newPassword } = req.body as IupdatePassword;
            if (!oldPassword || !newPassword) {
                return next(new ErrorHandler("Please enter old and new password", 400));
            }
            const user = await userModel.findById(req.user?._id).select("+password");

            if (user?.password === undefined) {
                return next(new ErrorHandler("Invalid User", 400));
            }

            const isPasswordMatch = await user?.comparepassword(oldPassword);

            if (!isPasswordMatch) {
                return next(new ErrorHandler("Invalid old Password", 400));
            }

            user.password = newPassword;

            await user.save();
            const userId = req.user?._id;
            if (!userId) {
                return next(new ErrorHandler("User not found", 404));
            }
            await safeRedis.set(userId.toString(), JSON.stringify(user));

            res.status(201).json({
                user,
                success: true,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IUpdateProfilePicture {
    avatar: string

}
// update profile picture / avatar 

export const updateProfilePicture = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { avatar } = req.body as IUpdateProfilePicture;

            const userId = req.user?._id;

            const user = await userModel.findById(userId);

            if (avatar && user) {
                // if user have on avaatar then call this 
                if (user?.avatar?.public_id) {
                    // delete the old image 
                    await cloudinary.v2.uploader.destroy(user?.avatar?.public_id);

                    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                        folder: "avatars",
                        width: 150,
                    });
                    user.avatar = {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    };
                } else {
                    const myCloud = await cloudinary.v2.uploader.upload(avatar, {
                        folder: "avatars",
                        width: 150,
                    });

                    user.avatar = {
                        public_id: myCloud.public_id,
                        url: myCloud.secure_url,
                    };
                }
            }

            await user?.save();

            if (!userId) {
                return next(new ErrorHandler("User not found", 404));
            }

            await safeRedis.set(userId.toString(), JSON.stringify(user));

            res.status(200).json({
                success: true,
                user,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);