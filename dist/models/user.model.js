import mongoose, { Schema } from "mongoose";
const userSchema = new Schema({
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
        sparse: true // Since it's unique and can be null/unset
    },
    password: {
        type: String,
        required: true,
    },
    lastPurchaseDate: {
        type: Number,
        default: null,
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
}, { timestamps: true });
const User = mongoose.model("User", userSchema);
export default User;
