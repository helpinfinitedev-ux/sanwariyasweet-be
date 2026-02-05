import express, { Application } from "express";
import dotenv from "dotenv";
import connectDB from "./config/db.js";

dotenv.config();

const app: Application = express();
const PORT: string | number = process.env.PORT || 5000;

app.use(express.json());

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Server is running on port ${PORT}`);
});
