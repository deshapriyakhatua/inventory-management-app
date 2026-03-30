import mongoose from "mongoose";

const purchaseSchema = new mongoose.Schema({
  sellerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Seller",
    required: true,
  },
  sellerProductId: {
    type: String,
    required: true,
  },
  inventoryId: {
    type: String, // String instead of ObjectId since our Inventory model uses `inventoryId` as a unique primary String identifier
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  shippingFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  orderedOn: {
    type: Date,
    required: true,
  },
  receivedOn: {
    type: Date,
  },
  invoiceNo: {
    type: String,
  },
  taxPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  isArchived: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

export default mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);
