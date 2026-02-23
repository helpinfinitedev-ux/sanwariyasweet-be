import mongoose, { Document, Schema } from "mongoose";
import { ICategory } from "./category.model";

export interface IProduct extends Document {
  name: string;
  description: string;
  images: string[];
  price: number;
  category: mongoose.Types.ObjectId | ICategory;
  createdAt: Date;
  updatedAt: Date;
}

export const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    images: {
      type: [String],
      trim: true,
      required: true,
      min: 1,
      default: [],
      validate: {
        validator: function (v: any) {
          return v.length > 0;
        },
        message: "At least one image is required",
      },
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
  },
  { timestamps: true }
);

productSchema.index({ category: 1 });
productSchema.pre(/^find/, function () {
  const query = this as mongoose.Query<unknown, IProduct>;
  query.populate({ path: "category" });
});

const Product = mongoose.model<IProduct>("Product", productSchema);
export default Product;
