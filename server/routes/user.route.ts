import express from "express";
import { activateUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateProfilePicture, updateUserInfo, updateUserPassword, updateUserRole } from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const UserRouter = express.Router();

UserRouter.post("/registration", registrationUser);
UserRouter.post("/activate-user", activateUser);
UserRouter.post("/login-user", loginUser);
UserRouter.get("/logout-user", isAuthenticated, logoutUser);
UserRouter.get("/refresh-token", updateAccessToken);
UserRouter.get("/me", isAuthenticated, getUserInfo);
UserRouter.post("/social-auth", socialAuth);
UserRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
UserRouter.put("/update-user-password", isAuthenticated, updateUserPassword);
UserRouter.put("/update-user-avatar", isAuthenticated, updateProfilePicture);
UserRouter.get("/get-all-users", isAuthenticated, authorizeRoles('admin'), getAllUsers);
UserRouter.put("/update-user-role", isAuthenticated, authorizeRoles('admin'), updateUserRole);


export default UserRouter;  