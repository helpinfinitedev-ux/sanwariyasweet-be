import bcrypt from "bcryptjs";
import User, { IUser } from "../models/user.model";

export class AuthServiceError extends Error {
  statusCode: number;

  constructor(message: string, statusCode: number) {
    super(message);
    this.name = "AuthServiceError";
    this.statusCode = statusCode;
  }
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  emailAddress?: string;
  password: string;
  role?: "admin" | "customer" | "deliveryPartner";
}

export interface LoginPayload {
  phoneNumber: string;
  password: string;
}

export const AuthService = {
  async register(payload: RegisterPayload): Promise<IUser> {
    const existingPhone = await User.findOne({ phoneNumber: payload.phoneNumber });
    if (existingPhone) {
      throw new AuthServiceError("User with this phone number already exists", 409);
    }

    if (payload.emailAddress) {
      const existingEmail = await User.findOne({ emailAddress: payload.emailAddress });
      if (existingEmail) {
        throw new AuthServiceError("User with this email address already exists", 409);
      }
    }

    const hashedPassword = await bcrypt.hash(payload.password, 10);

    return User.create({
      firstName: payload.firstName,
      lastName: payload.lastName,
      phoneNumber: payload.phoneNumber,
      address: payload.address,
      emailAddress: payload.emailAddress,
      password: hashedPassword,
      role: payload.role ?? "customer",
    });
  },

  async login(payload: LoginPayload): Promise<IUser> {
    const user = await User.findOne({ phoneNumber: payload.phoneNumber }).select("+password");
    if (!user || !user.password) {
      throw new AuthServiceError("Invalid credentials", 401);
    }

    const isPasswordValid = await bcrypt.compare(payload.password, user.password);
    if (!isPasswordValid) {
      throw new AuthServiceError("Invalid credentials", 401);
    }

    return user;
  },
};
