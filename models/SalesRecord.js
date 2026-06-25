import mongoose from "mongoose";

const salesRecordSchema = new mongoose.Schema(
  {
    skuId: {
      type: String,
      required: true,
      index: true,
    },
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: true,
    },
    salesChannel: {
      type: String,
      default: null,
    },
    grossUnits: {
      type: Number,
      default: 0,
    },
    logisticsReturns: {
      type: Number,
      default: 0,
    },
    customerReturns: {
      type: Number,
      default: 0,
    },
    cancellations: {
      type: Number,
      default: 0,
    },
    netUnits: {
      type: Number,
      default: 0,
    },
    netSales: {
      type: Number,
      default: 0,
    },
    totalExpenses: {
      type: Number,
      default: 0,
    },
    otherBenefits: {
      type: Number,
      default: 0,
    },
    projectedBankSettlement: {
      type: Number,
      default: 0,
    },
    isArchived: {
      type: Boolean,
      default: false,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate monthly entries per SKU
salesRecordSchema.index({ skuId: 1, month: 1, year: 1 }, { unique: true });

export default mongoose.models.SalesRecord ||
  mongoose.model("SalesRecord", salesRecordSchema);
