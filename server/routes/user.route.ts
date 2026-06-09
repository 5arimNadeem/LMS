import express from "express";
import { activateUser, deleteUser, getAllUsers, getUserInfo, loginUser, logoutUser, registrationUser, socialAuth, updateAccessToken, updateProfilePicture, updateUserInfo, updateUserPassword, updateUserRole } from "../controllers/user.controller";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
const UserRouter = express.Router();

UserRouter.post("/registration", registrationUser);
UserRouter.post("/activate-user", activateUser);
UserRouter.post("/login", loginUser);
UserRouter.get("/logout-user", isAuthenticated, logoutUser);
UserRouter.get("/refresh", updateAccessToken);
UserRouter.get("/me", updateAccessToken, isAuthenticated, getUserInfo);
UserRouter.post("/social-auth", socialAuth);
UserRouter.put("/update-user-info", isAuthenticated, updateUserInfo);
UserRouter.put("/update-user-password", updateAccessToken, isAuthenticated, updateUserPassword);
UserRouter.put("/update-user-avatar", updateAccessToken, isAuthenticated, updateProfilePicture);
UserRouter.get("/get-all-users", updateAccessToken, isAuthenticated, authorizeRoles('admin'), getAllUsers);
UserRouter.put("/update-user-role", updateAccessToken, isAuthenticated, authorizeRoles('admin'), updateUserRole);
UserRouter.delete("/delete-user/:id", updateAccessToken, isAuthenticated, authorizeRoles('admin'), deleteUser);


export default UserRouter;  