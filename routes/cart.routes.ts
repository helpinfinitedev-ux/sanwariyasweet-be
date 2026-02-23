import { Router } from "express";
import {
  createCart,
  deleteCart,
  getCartById,
  listCarts,
  replaceCart,
  updateCart,
} from "../controllers/cart.controllers";

const cartRouter = Router();

cartRouter.get("/", listCarts);
cartRouter.get("/:cartId", getCartById);
cartRouter.post("/", createCart);
cartRouter.put("/:cartId", replaceCart);
cartRouter.patch("/:cartId", updateCart);
cartRouter.delete("/:cartId", deleteCart);

export default cartRouter;
