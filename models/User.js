import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    username: String,
    email: String,
    password: String,
    verified: { 
        type: Boolean,
        default: false,
    },
    role: {
        type: String,
        enum: ['employee', 'admin', 'superadmin'],
        default: 'employee',
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
});

export default mongoose.models.User || mongoose.model("User", userSchema);