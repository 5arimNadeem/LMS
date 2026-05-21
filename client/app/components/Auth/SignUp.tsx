import React, { FC, useEffect, useState } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import {
    AiOutlineEye,
    AiOutlineEyeInvisible,
    AiFillGithub,
} from "react-icons/ai";
import { FcGoogle } from "react-icons/fc";
import { styles } from "../../../app/styles/style";
import { useRegisterMutation, useSocialAuthMutation } from "../../../redux/features/auth/authApi";
import toast from "react-hot-toast"
import { signIn, getSession } from "next-auth/react";
// import { signIn, getSession } from "next-auth/client";

interface Props {
    setRoute: (route: string) => void;
}
//Validation for email and password input
const schema = Yup.object().shape({
    name: Yup.string().required("Please enter your name"),
    email: Yup.string()
        .email("Invalid email")
        .required("Please enter your email"),
    password: Yup.string().required("Please enter your password").min(6),
});
const SignUp: FC<Props> = ({ setRoute }) => {
    const [show, setShow] = useState(false);
    const [register, { error, data, isSuccess }] = useRegisterMutation();
    const [socialAuth, { isSuccess: isSuccessGoogle, error: errorGoogle }] = useSocialAuthMutation();

    useEffect(() => {
        if (isSuccess && data) {
            const message = data.message || "Registration successful";
            toast.success(message);
            setRoute("Verification");
        }

        if (error && "data" in error) {
            const errorMessage = (error as any).data.message || "Something went wrong";
            toast.error(errorMessage);
        }
    }, [isSuccess, error, data, setRoute]);

    useEffect(() => {
        if (isSuccessGoogle) {
            const message = "Social login successful";
            toast.success(message);
            setRoute("Login");
        }
        if (errorGoogle) {
            if ("data" in errorGoogle) {
                const errorData = errorGoogle as any;
                toast.error(errorData.data.message);
            }
        }
    }, [isSuccessGoogle, errorGoogle, setRoute]);

    const googleSignIn = async () => {
        try {
            const result = await signIn("google", {
                redirect: false,
            });

            if (result?.error) {
                toast.error("Google sign in failed");
                return;
            }

            const session = await getSession();
            if (session?.user) {
                await socialAuth({
                    email: session.user.email,
                    name: session.user.name,
                    avatar: session.user.image,
                });
            }
        } catch (error) {
            toast.error("Google sign in failed");
            console.error("Google sign in error:", error);
        }
    };

    const githubSignIn = async () => {
        try {
            const result = await signIn("github", {
                redirect: false,
            });

            if (result?.error) {
                toast.error("GitHub sign in failed");
                return;
            }

            const session = await getSession();
            if (session?.user) {
                await socialAuth({
                    email: session.user.email,
                    name: session.user.name,
                    avatar: session.user.image,
                });
            }
        } catch (error) {
            toast.error("GitHub sign in failed");
            console.error("GitHub sign in error:", error);
        }
    };





    const formik = useFormik({
        initialValues: { name: "", email: "", password: "" },
        validationSchema: schema,
        onSubmit: async ({ name, email, password }) => {
            const data = { name, email, password };

            await register(data);
        },
    });

    const { errors, touched, values, handleChange, handleSubmit } = formik;
    return (
        <div className="w-full">
            <h1 className={styles.title}>Join to ELearning</h1>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className={`${styles.label}`} htmlFor="email">
                        Enter your Name
                    </label>
                    <input
                        type="text"
                        name="name"
                        value={values.name}
                        onChange={handleChange}
                        id="name"
                        placeholder="Sarim Nadeem"
                        className={`${errors.name && touched.name && "border-red-500"} ${styles.input
                            }`}
                    />
                    {errors.name && touched.name && (
                        <span className="text-red-500 pt-2 block">{errors.name}</span>
                    )}
                </div>
                <div className="w-full mt-5 relative mb-1">
                    <label className={styles.label} htmlFor="email">
                        Enter Your Email
                    </label>
                    <input
                        type="email"
                        name="email"
                        value={values.email}
                        onChange={handleChange}
                        id="email"
                        placeholder="loginmail@gmail.com"
                        className={`${errors.email && touched.email && "border-red-500"} ${styles.input
                            }`}
                    ></input>
                    {errors.email && touched.email && (
                        <span className="text-red-500 pt-2 block">{errors.email}</span>
                    )}
                </div>
                <div className="w-full mt-5 relative mb-1">
                    <label className={styles.label} htmlFor="password">
                        Enter Your Password
                    </label>
                    <input
                        type={!show ? "password" : "text"}
                        name="password"
                        value={values.password}
                        onChange={handleChange}
                        id="password"
                        placeholder="password!@%"
                        className={`${errors.password && touched.password && "border-red-500"
                            } ${styles.input}`}
                    ></input>
                    {!show ? (
                        <AiOutlineEyeInvisible
                            className="absolute bottom-3 right-2 z-1 cursor-pointer"
                            size={20}
                            onClick={() => setShow(true)}
                        />
                    ) : (
                        <AiOutlineEye
                            className="absolute bottom-3 right-2 z-1 cursor-pointer"
                            size={20}
                            onClick={() => setShow(false)}
                        />
                    )}
                </div>
                {errors.password && touched.password && (
                    <span className="text-red-500 pt-2 block">{errors.password}</span>
                )}
                <div className="w-full mt-6">
                    <input
                        type="submit"
                        value="Sign Up"
                        className={`${styles.button} hover:bg-[#0b4b8b]`}
                    />
                </div>
                <br />
                <h5 className="text-center pt-4 font-Poppins text-[14px] text-black dark:text-white">
                    Or join with
                </h5>
                <div className="flex items-center justify-center my-3">
                    <FcGoogle size={30} className="cursor-pointer mr-2" onClick={googleSignIn} />
                    {/* <AiFillGithub size={30} className="cursor-pointer ml-2" onClick={githubSignIn} /> */}
                </div>
                <h5 className="text-center pt-4 font-Poppins text-[14px] text-black dark:text-white">
                    Already have an account?{" "}
                    <span
                        className="text-[#2190ff] pl-1 cursor-pointer"
                        onClick={() => setRoute("Login")}
                    >
                        Sign in
                    </span>
                </h5>
            </form>
        </div>
    );
};

export default SignUp;