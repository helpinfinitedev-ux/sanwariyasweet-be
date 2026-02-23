import { Router } from "express";
import {
  adminListOrders,
  adminListProducts,
  adminListUsers,
} from "../controllers/admin.controllers";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";

const adminRouter = Router();

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/orders", adminListOrders);
adminRouter.get("/products", adminListProducts);
adminRouter.get("/users", adminListUsers);

export default adminRouter;
