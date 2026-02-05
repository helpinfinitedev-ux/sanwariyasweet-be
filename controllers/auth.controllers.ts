import { Request, Response } from "express";
import User from "../models/user.model.js"; // In NodeNext/ESM, we keep the .js extension or use .ts with some configs, but usually .js is preferred by Node.

export const signup = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { fullName, phoneNumber, address, emailAddress, password, role } = req.body;

        // Split fullName into firstName and lastName if necessary, or adjust based on model
        // For now, I'll stick to what the model expects to avoid runtime errors
        // If fullName is provided, let's split it
        const nameParts = fullName ? fullName.split(" ") : ["", ""];
        const firstName = nameParts[0];
        const lastName = nameParts.slice(1).join(" ") || " ";

        const user = await User.findOne({ phoneNumber });
        if (user) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = await User.create({
            firstName,
            lastName,
            phoneNumber,
            address,
            emailAddress,
            password,
            role
        });

        return res.status(201).json({ message: "User created successfully", user: newUser });
    } catch (error) {
        console.error("Signup error:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
};
