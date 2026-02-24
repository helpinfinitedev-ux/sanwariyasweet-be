import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./user.model";
import { IProduct } from "./product.model";

export interface IRating extends Document {
  userId: mongoose.Types.ObjectId | IUser;
  productId: mongoose.Types.ObjectId | IProduct;
  rating: number;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
}

export const ratingSchema = new Schema<IRating>(
  {
    userId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      required: false,
      default: null,
    },
  },
  { timestamps: true }
);

ratingSchema.pre(/^find/, function () {
  const query = this as mongoose.Query<unknown, IRating>;
  query.populate({ path: "userId" });
  query.populate({
    path: "productId",
    populate: { path: "category" },
  });
});

const Rating = mongoose.model<IRating>("Rating", ratingSchema);
export default Rating;
