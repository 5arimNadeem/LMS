import { Request, Response, NextFunction } from "express";
import { CatchAsyncError } from "../middleware/catchAsyncError";
import ErrorHandler from "../utils/ErrorHandler";
import cloudinary from "cloudinary";
import mongoose from "mongoose";
import { createCourse, getAllCourseServices } from "../services/course.service";
import CourseModel from "../models/course.model";
// import NotificationModel from "../models/notification.model";
import path from "path";
import ejs from "ejs";
import sendMail from "../utils/sendMail";
import NotificationModel from "../models/notification.model";

//upload course
export const uploadCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = req.body;
            const thumbnail = data.thumbnail;

            if (thumbnail) {
                const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                    folder: "courses",
                });

                data.thumbnail = {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url,
                };
            }
            createCourse(data, res, next);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

// edit course 

export const editCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {
        const data = req.body
        const thumbnail = data.thumbnail;

        if (thumbnail) {
            await cloudinary.v2.uploader.destroy(data.thumbnail.public_id);

            const myCloud = await cloudinary.v2.uploader.upload(thumbnail, {
                folder: "courses",
            });

            data.thumbnail = {
                public_id: myCloud.public_id,
                url: myCloud.secure_url,
            };
        }

        const courseId = req.params.id;

        const course = await CourseModel.findByIdAndUpdate(courseId, { $set: data }, { new: true });

        res.status(200).json({
            success: true,
            course
        })

    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


// e4idt single coruse - without purchasing 

export const getSingleCourse = CatchAsyncError(async (req: Request, res: Response, next: NextFunction) => {
    try {

        const course = await CourseModel.findById(req.params.id).select("-courseData.videoUrl -courseData.suggestion -courseData.questions -courseData.links");

        res.status(200).json({
            success: true,
            course
        })



    } catch (error: any) {
        return next(new ErrorHandler(error.message, 500));
    }
})


//get all courses without purchase
export const getAllCourses = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            // const isCachedExist = await safeRedis.get("allcourses");

            // if (isCachedExist) {
            //   const courses = JSON.parse(isCachedExist);
            //   res.status(200).json({ success: true, courses });
            // } else {
            const courses = await CourseModel.find().select(
                "-courseData.videoUrl -courseData.suggestion -courseData.question -courseData.links"
            );

            res.status(200).json({ success: true, courses });

            //   await safeRedis.set("allcourses", JSON.stringify(courses), "EX", 604800);
            // }
        } catch (error: any) {
            return new ErrorHandler(error.message, 500);
        }
    }
);


// get course contnet = only for valid user 

//get course content - only for valid user
export const getCourseByUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCourseList = req.user?.courses;
            const courseId = req.params.id;

            //if course is exist in user course list
            const courseExists = userCourseList?.find(
                (course: any) => course._id.toString() === courseId
            );

            if (!courseExists) {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 400)
                );
            }

            const course = await CourseModel.findById(courseId);

            const content = course?.courseData;

            res.status(200).json({ success: true, content });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

interface IAddQuestionData {
    question: string;
    courseId: string;
    contentId: string;
}

export const addQuestion = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { question, courseId, contentId }: IAddQuestionData = req.body;

            const course = await CourseModel.findById(courseId);

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid content id", 400));
            }

            const courseContent = course?.courseData?.find((item: any) =>
                item._id.equals(contentId)
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid content id", 400));
            }

            const newQuestion: any = {
                user: req.user,
                question,
                questionReplies: [],
            };

            //add this question to our course

            courseContent.questions.push(newQuestion);

            //notification
            await NotificationModel.create({
                userId: req.user?._id,
                title: "New Question Received",
                message: `You have a new question in ${courseContent.title}`,
            });

            //save the updated course

            await course?.save();

            res.status(200).json({ success: true, course });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


interface IAddAnswerData {
    answer: string;
    courseId: string;
    contentId: string;
    questionId: string;
}

export const addAnswer = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { answer, courseId, contentId, questionId }: IAddAnswerData =
                req.body;

            const course = await CourseModel.findById(courseId);

            if (!mongoose.Types.ObjectId.isValid(contentId)) {
                return next(new ErrorHandler("Invalid content id", 400));
            }

            const courseContent = course?.courseData?.find((item: any) =>
                item._id.equals(contentId)
            );

            if (!courseContent) {
                return next(new ErrorHandler("Invalid content id", 400));
            }

            const question = courseContent?.questions?.find((item: any) =>
                item._id.equals(questionId)
            );

            if (!question) {
                return next(new ErrorHandler("Invalid question id", 400));
            }

            const newAnswer: any = {
                user: req.user,
                answer,
                // createdAt: new Date().toISOString(),
                // updatedAt: new Date().toISOString(),
            };

            question.questionReplies.push(newAnswer);

            await course?.save();

            if (req.user?._id === question.user._id) {
                // send notification to admin
                await NotificationModel.create({
                    userId: req.user?._id,
                    title: "New Question Reply Received",
                    message: `You have a new question reply in ${courseContent.title}`,
                });
            } else {
                const data = {
                    name: question.user.name,
                    title: courseContent.title,
                };

                const html = await ejs.renderFile(
                    path.join(__dirname, "../mails/question-reply.ejs"),
                    data
                );

                try {
                    await sendMail({
                        email: question.user.email,
                        subject: "Question-Reply",
                        template: "question-reply.ejs",
                        data,
                    });
                } catch (error: any) {
                    return next(new ErrorHandler(error.message, 500));
                }
            }
            res.status(200).json({ success: true, course });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

//add review to course

interface IAddReviewData {
    review: string;
    rating: Number;
    userId: string;
}

export const addReview = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userCoursesList = req.user?.courses;

            const { review, rating }: IAddReviewData = req.body;

            const courseId = req.params.id;

            //check id courseId exist in userCourseList

            const courseExists = userCoursesList?.some(
                (course: any) => course._id.toString() === courseId.toString()
            );

            if (!courseExists) {
                return next(
                    new ErrorHandler("You are not eligible to access this course", 404)
                );
            }

            const course = await CourseModel.findById(courseId);

            const reviewData: any = {
                user: req.user,
                comment: review,
                rating,
                // createdAt: new Date().toISOString(),
                // updatedAt: new Date().toISOString(),
            };

            course?.reviews.push(reviewData);

            let avg = 0;

            course?.reviews.forEach((rev: any) => {
                avg += rev.rating;
            });
            if (course) {
                course.ratings = avg / course?.reviews.length;
            }

            await course?.save();

            // await safeRedis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

            //create noitication
            await NotificationModel.create({
                userId: req.user?._id,
                title: "New Review Received",
                message: `${req.user?.name} has given a review in ${course?.name}`,
            });

            const notification = {
                title: "New Review Received",
                message: `${req.user?.name} has given a review in ${course?.name}`
            }

            res.status(200).json({
                success: true,
                course,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);

//add reply in reviews
interface IAddReviewReplyData {
    comment: string;
    courseId: string;
    reviewId: string;
}

export const addReplyToReview = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { comment, courseId, reviewId }: IAddReviewReplyData = req.body;

            const course = await CourseModel.findById(courseId);

            if (!course) {
                return next(new ErrorHandler("Course not found", 404));
            }

            const review = course?.reviews?.find(
                (rev: any) => rev._id.toString() === reviewId
            );

            if (!review) {
                return next(new ErrorHandler("Review not found", 404));
            }

            const replyData: any = {
                user: req.user,
                comment,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            if (!review.commentReplies) {
                review.commentReplies = [];
            }

            review.commentReplies?.push(replyData);

            await course?.save();
            // await safeRedis.set(courseId, JSON.stringify(course), "EX", 604800); // 7days

            res.status(200).json({ success: true, course });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);


export const getAllCourse = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            getAllCourseServices(res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 500));
        }
    }
);