import express from "express";
import { authorizeRoles, isAuthenticated } from "../middleware/auth";
import { createOrder, getAllOrders } from "../controllers/order.controller";
import { getAllOrderServices } from "../services/order.service";

const orderRouter = express.Router();

orderRouter.post("/create-order", isAuthenticated, createOrder)
orderRouter.get("/get-all-orders", isAuthenticated, authorizeRoles('admin'), getAllOrders)

export default orderRouter;