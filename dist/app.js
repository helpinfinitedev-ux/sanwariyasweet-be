"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const product_routes_1 = __importDefault(require("./routes/product.routes"));
const category_routes_1 = __importDefault(require("./routes/category.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const cart_routes_1 = __importDefault(require("./routes/cart.routes"));
const order_routes_1 = __importDefault(require("./routes/order.routes"));
const admin_routes_1 = __importDefault(require("./routes/admin.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use(express_1.default.json());
app.use("/products", product_routes_1.default);
app.use("/categories", category_routes_1.default);
app.use("/auth", auth_routes_1.default);
app.use("/carts", cart_routes_1.default);
app.use("/orders", order_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.get("/", (req, res) => {
    res.json({
        request: req.url,
        message: "Sanwariya Sweet API is running",
    });
});
exports.default = app;
