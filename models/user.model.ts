import mongoose, { Document, Schema } from "mongoose";

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  emailAddress?: string | null;
  password?: string;
  lastPurchaseDate?: number | null;
  totalPurchaseAmount: number;
  orders: mongoose.Types.ObjectId[];
  role: "admin" | "customer" | "deliveryPartner";
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    address: {
      type: String,
      required: true,
    },
    emailAddress: {
      type: String,
      default: null,
      lowercase: true,
      trim: true,
      unique: true,
      sparse: true, // Since it's unique and can be null/unset
    },
    password: {
      type: String,
      required: true,
    },
    lastPurchaseDate: {
      type: Number,
      default: null,
    },
    orders: {
      type: [mongoose.Types.ObjectId],
      ref: "Order",
      default: [],
    },
    totalPurchaseAmount: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["admin", "customer", "deliveryPartner"],
      default: "customer",
    },
  },
  { timestamps: true }
);

const User = mongoose.model<IUser>("User", userSchema);
export default User;
