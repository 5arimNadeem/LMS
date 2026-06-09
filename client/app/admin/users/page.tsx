"use client";
import AllCourses from "../../components/Admin/course/AllCourses";
import DashBoardHero from "../../components/Admin/DashBoardHero";
import AdminSidebar from "../../components/Admin/sidebar/AdminSidebar";
import AdminProtected from "../../hooks/AdminProtected";
import Heading from "../../utils/Heading";
import React from "react";
import AllUsers from "../../components/Admin/users/AllUsers";

const page = () => {
    return (
        <div>
            <AdminProtected>
                <Heading
                    title={`Elearning-Admin`}
                    description="Elearning is a platform for students to learn and get help from teachers"
                    keywords="Programming , MERN ,REDUX , Machine Learning"
                />
                <div className="flex h-screen">
                    {" "}
                    <div className="1500px:w-[19%] w-1/5">
                        <AdminSidebar />
                    </div>
                    <div></div>
                    <div className="w-[85%]">
                        <DashBoardHero />
                        <AllUsers />
                    </div>
                </div>
            </AdminProtected>
        </div>
    );
};

export default page;