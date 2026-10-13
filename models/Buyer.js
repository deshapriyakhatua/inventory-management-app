import mongoose from "mongoose";

const buyerSchema = new mongoose.Schema(
  {
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    gstNo: {
      type: String,
      default: "NA",
      trim: true,
    },
    contactPerson: {
      type: String,
      default: "",
      trim: true,
    },
    phoneNo: {
      type: String,
      default: "",
      trim: true,
    },
    whatsAppNo: {
      type: String,
      default: "",
      trim: true,
    },
    email: {
      type: String,
      default: "",
      trim: true,
    },
    address: {
      type: String,
      default: "",
      trim: true,
    },
    state: {
      type: String,
      default: "19-West Bengal",
      trim: true,
    },
    pinCode: {
      type: String,
      default: "",
      trim: true,
    },
    notes: {
      type: String,
      default: "",
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Buyer || mongoose.model("Buyer", buyerSchema);
