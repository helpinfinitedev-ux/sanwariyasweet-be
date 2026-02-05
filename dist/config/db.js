import mongoose from "mongoose";
const connectDB = async () => {
    try {
        const mongoUrl = process.env.MONGODB_URL;
        if (!mongoUrl) {
            throw new Error("MONGODB_URL is not defined in environment variables");
        }
        await mongoose.connect(mongoUrl);
        console.log("db connected");
    }
    catch (error) {
        console.error("db error:", error);
        process.exit(1);
    }
};
export default connectDB;
