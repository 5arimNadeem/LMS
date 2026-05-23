import React from "react";
import "./Loader.css";

const Loader = () => {
    return (
        <div className="flex items-center justify-center h-screen">
            <div suppressHydrationWarning className="loader"></div>
        </div>
    );
};

export default Loader;