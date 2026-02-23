import { Router } from "express";
import {
  createOrder,
  deleteOrder,
  getOrderById,
  listOrders,
  replaceOrder,
  updateOrder,
} from "../controllers/order.controllers";

const orderRouter = Router();

orderRouter.get("/", listOrders);
orderRouter.get("/:orderId", getOrderById);
orderRouter.post("/", createOrder);
orderRouter.put("/:orderId", replaceOrder);
orderRouter.patch("/:orderId", updateOrder);
orderRouter.delete("/:orderId", deleteOrder);

export default orderRouter;
