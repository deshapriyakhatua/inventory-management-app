import mongoose from "mongoose";

const verticalSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    shortName: {
        type: String,
        required: true,
        unique: true
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
}, { timestamps: true });

export default mongoose.models.Vertical || mongoose.model("Vertical", verticalSchema);
