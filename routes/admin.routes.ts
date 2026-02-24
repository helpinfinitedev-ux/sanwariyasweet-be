import { Router } from "express";
import { adminListOrders, adminListProducts, adminListUsers } from "../controllers/admin.controllers";
import { requireAdmin, requireAuth } from "../middleware/auth.middleware";
import testimonialRouter from "./testimonial.routes";

const adminRouter = Router();

adminRouter.get("/orders", requireAuth, requireAdmin, adminListOrders);
adminRouter.get("/products", adminListProducts);
adminRouter.get("/users", requireAuth, requireAdmin, adminListUsers);
adminRouter.use("/testimonials", testimonialRouter);

export default adminRouter;
