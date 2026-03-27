import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    name: String,
    phone: String,
    pin: String,
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

if (mongoose.models.User) {
    delete mongoose.models.User;
}

export default mongoose.model("User", userSchema);