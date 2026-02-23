import { Router } from "express";
import {
  createProduct,
  deleteProduct,
  getProductById,
  listProducts,
  replaceProduct,
  updateProduct,
} from "../controllers/product.controllers";

const productRouter = Router();

productRouter.get("/", listProducts);
productRouter.get("/:productId", getProductById);
productRouter.post("/", createProduct);
productRouter.put("/:productId", replaceProduct);
productRouter.patch("/:productId", updateProduct);
productRouter.delete("/:productId", deleteProduct);

export default productRouter;
