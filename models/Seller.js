import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    // Core
    businessName: { type: String, required: true },
    gstNo: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    email: { type: String, default: "" },

    // Phone
    phoneNo: { type: String, default: "" },
    whatsAppNo: { type: String, default: "" },
    altPhoneNo: { type: String, default: "" },
    altWhatsAppNo: { type: String, default: "" },

    // Address
    address: { type: String, default: "" },
    country: { type: String, default: "" },
    pinCode: { type: String, default: "" },
    state: { type: String, default: "" },

    // Shipping
    shippingProvider: { type: String, default: "" },

    // Primary Bank
    bankName: { type: String, default: "" },
    accountNo: { type: String, default: "" },
    ifscCode: { type: String, default: "" },
    branch: { type: String, default: "" },
    accountType: { type: String, default: "" },
    upiId: { type: String, default: "" },

    // Alternate Bank
    altBankName: { type: String, default: "" },
    altAccountNo: { type: String, default: "" },
    altIfscCode: { type: String, default: "" },
    altBranch: { type: String, default: "" },
    altAccountType: { type: String, default: "" },
    altUpiId: { type: String, default: "" },

    // Meta
    addedOn: { type: Date, default: Date.now },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.Seller || mongoose.model("Seller", sellerSchema);
