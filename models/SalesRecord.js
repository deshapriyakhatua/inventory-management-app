import mongoose from "mongoose";

const salesRecordSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    lineId: {
      type: String,
      required: true,
      index: true,
    },
    skuId: {
      type: String,
      required: true,
      index: true,
    },
    marketplace: {
      type: String,
      required: true,
      default: "Flipkart",
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: [
        "ORDERED",
        "DISPATCHED",
        "CANCELLED",
        "CANCELLED_BEFORE_PICKUP",
        "RETURNED",
        "DELIVERED",
      ],
      default: null,
    },
    orderedOn: {
      type: String, // keep as string to preserve original CSV date format
      default: null,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  { timestamps: true }
);

// Prevent duplicate order line entries
salesRecordSchema.index({ orderId: 1, lineId: 1 }, { unique: true });

export default mongoose.models.SalesRecord ||
  mongoose.model("SalesRecord", salesRecordSchema);
