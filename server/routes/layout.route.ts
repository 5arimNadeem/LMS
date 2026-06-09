import express from "express";
import { isAuthenticated, authorizeRoles } from "../middleware/auth";
import { createLayout } from "../controllers/layout.controller";
const layoutRouter = express.Router();
import { editLayout, getLayoutByType } from "../controllers/layout.controller";
import { updateAccessToken } from "../controllers/user.controller";

layoutRouter.post(
    "/create-layout",
    updateAccessToken,
    isAuthenticated,
    authorizeRoles("admin"),
    createLayout
);
layoutRouter.put(
    "/edit-layout",
    updateAccessToken,
    isAuthenticated,
    authorizeRoles("admin"),
    editLayout
);

layoutRouter.get("/get-layout/:type", updateAccessToken, getLayoutByType);

export default layoutRouter;