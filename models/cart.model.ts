import mongoose, { Document, Schema } from "mongoose";
import { IProduct } from "./product.model";
import { IUser } from "./user.model";

export interface ICart extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  items: {
    productId: mongoose.Types.ObjectId | IProduct;
    quantity: number;
    price: number;
    unit: string;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

export const cartSchema = new Schema<ICart>(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
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
  },
  { timestamps: true }
);

cartSchema.pre(/^find/, function () {
  const query = this as mongoose.Query<unknown, ICart>;
  query.populate({ path: "userId" });
  query.populate({
    path: "items.productId",
    populate: { path: "category" },
  });
});

const Cart = mongoose.model<ICart>("Cart", cartSchema);
export default Cart;
