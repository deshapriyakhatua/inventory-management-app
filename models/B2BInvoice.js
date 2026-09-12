import mongoose from "mongoose";

const b2bInvoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    invoiceDate: {
      type: Date,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    placeOfSupply: {
      type: String,
      default: "19-West Bengal",
    },
    sellerDetails: {
      businessName: { type: String, default: "CRAZYKUDI" },
      address: {
        type: String,
        default: "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal",
      },
      state: { type: String, default: "19-West Bengal" },
      gstNo: { type: String, default: "19JHWPK2955Q1ZW" },
      contactPerson: { type: String, default: "" },
      phoneNo: { type: String, default: "" },
      email: { type: String, default: "" },
      bankName: { type: String, default: "Slice Small Finance Bank" },
      accountNo: { type: String, default: "033311501063323" },
      ifscCode: { type: String, default: "NESF0000333" },
      accountHolderName: { type: String, default: "CRAZYKUDI" },
      branch: { type: String, default: "" },
      upiId: { type: String, default: "" },
    },
    buyerDetails: {
      businessName: { type: String, required: true },
      gstNo: { type: String, default: "NA" },
      contactPerson: { type: String, default: "" },
      phoneNo: { type: String, default: "" },
      email: { type: String, default: "" },
      address: { type: String, default: "" },
      state: { type: String, default: "19-West Bengal" },
      pinCode: { type: String, default: "" },
    },
    lineItems: [
      {
        inventoryId: { type: String, default: "" },
        description: { type: String, required: true },
        hsnCode: { type: String, default: "7117" },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, min: 0 },
        taxRate: { type: Number, default: 3 }, // Default 3% GST like in sample
        amount: { type: Number, required: true }, // Sub total
        taxAmount: { type: Number, default: 0 }, // GST amount
        totalAmount: { type: Number, required: true }, // Item total with tax
      },
    ],
    subtotal: { type: Number, required: true, min: 0 },
    flatTaxRate: { type: Number, default: 3, min: 0 },
    totalTax: { type: Number, default: 0, min: 0 },
    shippingFee: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    grandTotal: { type: Number, required: true, min: 0 },
    receivedAmount: { type: Number, default: 0, min: 0 },
    balanceAmount: { type: Number, default: 0 },
    amountInWords: { type: String, default: "" },
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid", "Partially Paid", "Cancelled"],
      default: "Pending",
    },
    notes: {
      type: String,
      default:
        "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only.",
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

export default mongoose.models.B2BInvoice ||
  mongoose.model("B2BInvoice", b2bInvoiceSchema);
