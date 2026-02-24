import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db";
import productRouter from "./routes/product.routes";
import categoryRouter from "./routes/category.routes";
import authRouter from "./routes/auth.routes";
import cartRouter from "./routes/cart.routes";
import orderRouter from "./routes/order.routes";
import adminRouter from "./routes/admin.routes";
import ratingRouter from "./routes/rating.routes";
import testimonialRouter from "./routes/testimonial.routes";
import cors from "cors";

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

app.use(cors());

app.use(express.json());
app.use("/products", productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authRouter);
app.use("/carts", cartRouter);
app.use("/orders", orderRouter);
app.use("/admin", adminRouter);
app.use("/ratings", ratingRouter);
app.use("/testimonials", testimonialRouter);

app.get("/", (req: Request, res: Response) => {
  res.json({
    request: req.url,
    message: "Sanwariya Sweet API is running",
  });
});

export default app;
