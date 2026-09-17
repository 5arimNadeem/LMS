"use client";

import CourseContent from "@/app/components/Course/CourseContent";
import Loader from "@/app/components/Loader/Loader";
import { useLoadUserQuery } from "@/redux/features/api/apiSlice";
import { redirect } from "next/navigation";
import React, { useEffect, use } from "react";

type Props = {
    params: Promise<{ id: string }>;
};

const Page = ({ params }: Props) => {
    const { id } = use(params);
    const { isLoading, error, data, refetch } = useLoadUserQuery(undefined, {});

    useEffect(() => {
        if (data) {
            const isPurchased = data.user.courses.find(
                (item: any) => item._id === id
            );
            // console.log(data);
            // console.log(isPurchased);
            if (!isPurchased) {
                redirect("/");
            }
        }
        if (error) {
            redirect("/");
        }
    }, [data, error, id]);

    return (
        <>
            {isLoading ? (
                <Loader />
            ) : (
                <div>
                    <CourseContent id={id} user={data.user} />
                </div>
            )}
        </>
    );
};

export default Page;
