import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import productRouter from "./routes/product.routes";
import categoryRouter from "./routes/category.routes";
import authRouter from "./routes/auth.routes";

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

app.use(express.json());
app.use("/products", productRouter);
app.use("/categories", categoryRouter);
app.use("/auth", authRouter);

app.listen(PORT, async () => {
  await connectDB();
  console.log(`Server is running on port ${PORT}`);
});
