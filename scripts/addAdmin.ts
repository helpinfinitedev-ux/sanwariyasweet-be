import connectDB from "../config/db";
import User from "../models/user.model";
import { AuthService, RegisterPayload } from "../services/auth.service";

const addAdmin = async () => {
  await connectDB();
  const payload: RegisterPayload = {
    firstName: "Sanwariya",
    lastName: "Admin",
    phoneNumber: "8960565915",
    emailAddress: "admin@sanwariya.com",
    password: "admin123",
    address: "Jaunpur",
    role: "admin",
  };

  await AuthService.register(payload);
};

addAdmin();
