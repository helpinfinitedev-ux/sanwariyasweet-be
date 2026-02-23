import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user.model";
import { IProduct } from "./product.model";

export interface IOrder extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  items: {
    productId: mongoose.Types.ObjectId | IProduct;
    quantity: number;
    price: number;
    unit: string;
  }[];
  address: string;
  phoneNumber: string;
  expectedDeliveryDate: Date;
  totalAmount: number;
  status: "pending" | "shipped" | "in-transit" | "delivered";
  createdAt: Date;
  updatedAt: Date;
}

export const orderSchema = new Schema<IOrder>(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: {
      type: [
        {
          productId: {
            type: mongoose.Types.ObjectId,
            ref: "Product",
            required: true,
          },
          quantity: {
            type: Number,
            required: true,
            min: 1,
            max: 10,
            default: 1,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
            default: 0,
          },
          unit: {
            type: String,
            required: true,
            enum: ["kg", "g", "pcs"],
            default: "kg",
          },
        },
      ],
      required: true,
      min: 1,
      max: 10,
      default: [],
      validate: {
        validator: function (v: any) {
          return v.length > 0;
        },
        message: "At least one item is required",
      },
    },
    address: {
      type: String,
      required: true,
    },
    phoneNumber: {
      type: String,
      required: true,
    },
    expectedDeliveryDate: {
      type: Date,
      required: true,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    status: {
      type: String,
      enum: ["pending", "shipped", "in-transit", "delivered"],
      default: "pending",
    },
  },
  { timestamps: true }
);

orderSchema.pre(/^find/, function () {
  const query = this as mongoose.Query<unknown, IOrder>;
  query.populate({ path: "userId" });
  query.populate({
    path: "items.productId",
    populate: { path: "category" },
  });
});

const Order = mongoose.model<IOrder>("Order", orderSchema);
export default Order;
