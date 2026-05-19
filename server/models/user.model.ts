require("dotenv").config();
import mongoose, { Document, Model, Schema } from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
// import { NextFunction } from "express";

const emailRegexPattern: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const hashSaltValue: number = 10;

export interface Iuser extends Document {
    name: string;
    email: string;
    password: string;
    avatar: {
        public_id: string;
        url: string;
    }
    role: string;
    isverified: boolean;
    courses: Array<{ courseId: string }>;
    comparepassword: (password: string) => Promise<boolean>;
    SignAccessToken: () => string;
    SignRefreshToken: () => string;
}

const userSchema: Schema<Iuser> = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Please Enter your name"],
        },
        email: {
            type: String,
            required: [true, "Please enter your email"],
            validate: {
                validator: function (value: string) {
                    return emailRegexPattern.test(value);
                },
                message: "Please enter a valid email",
            },
            unique: true,
        },

        password: {
            type: String,

            minlength: [6, "Password must be at least 6 characters long"],
            select: false,
        },

        avatar: {
            public_id: String,
            // public_id: String,
            url: String,
        },
        role: {
            type: String,
            default: "user",
        },

        isverified: {
            type: Boolean,
            default: false,
        },
        courses: [
            {
                courseId: String,
            },
        ],
    },
    { timestamps: true }
);

// Hash Password before saving

userSchema.pre<Iuser>("save", async function () {
    if (!this.isModified("password")) {
        return;
    }
    this.password = await bcrypt.hash(this.password, hashSaltValue);
});

//compare password

userSchema.methods.comparepassword = async function (
    enteredPassword: string
): Promise<boolean> {
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.SignAccessToken = function () {
    return jwt.sign({ id: this._id }, process.env.ACCESS_TOKEN || "", {
        expiresIn: "5m",
    });
};
userSchema.methods.SignRefreshToken = function () {
    return jwt.sign({ id: this._id }, process.env.REFRESH_TOKEN || "", {
        expiresIn: "3d",
    });
};
const userModel: Model<Iuser> = mongoose.model("user", userSchema);

export default userModel;