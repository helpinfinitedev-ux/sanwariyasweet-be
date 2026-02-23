"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartSchema = void 0;
const mongoose_1 = __importStar(require("mongoose"));
exports.cartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.default.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
    },
    items: {
        type: [
            {
                productId: {
                    type: mongoose_1.default.Types.ObjectId,
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
            validator: function (v) {
                return v.length > 0;
            },
            message: "At least one item is required",
        },
    },
}, { timestamps: true });
exports.cartSchema.pre(/^find/, function () {
    const query = this;
    query.populate({ path: "userId" });
    query.populate({
        path: "items.productId",
        populate: { path: "category" },
    });
});
const Cart = mongoose_1.default.model("Cart", exports.cartSchema);
exports.default = Cart;
