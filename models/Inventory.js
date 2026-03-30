import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  // Core Fields
  inventoryId: {
    type: String,
    required: true,
    unique: true,
  },
  vertical: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  publicId: {
    type: String, // Cloudinary public ID
    required: true,
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  entryDate: {
    type: Date,
    default: Date.now,
  },

  // Stock Tracking
  initialStock: { type: Number, default: 0 },
  currentStock: { type: Number, default: 0 },
  grossOrdered: { type: Number, default: 0 },
  netSold: { type: Number, default: 0 },
  cancelled: { type: Number, default: 0 },
  dispatched: { type: Number, default: 0 },
  returned: { type: Number, default: 0 },
  adjust: { type: Number, default: 0 },
  damaged: { type: Number, default: 0 },

  // Financials
  totalBuyingPrice: { type: Number, default: 0 },

  // Status
  isArchived: { type: Boolean, default: false },

  // Sources Mapping
  sources: [{
    sellerId: { type: mongoose.Schema.Types.ObjectId, ref: "Seller", required: true },
    sellerProductId: { type: String, default: "" }
  }],

}, { timestamps: true });

// Check if the model already exists before defining it
export default mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
