import mongoose from "mongoose";

const listingSchema = new mongoose.Schema({
  skuId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  vertical: {
    type: String,
    required: true,
  },
  marketplace: {
    type: String,
    required: true,
  },
  itemCount: {
    type: Number,
    required: true,
  },
  inventoryItems: [{
    type: String, // Storing inventory IDs (Strings like 'ER-0001')
  }],
  status: {
    type: String,
    enum: ["active", "inactive", "blocked", "archived"],
    default: "active",
  },
  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false, 
  },
}, { timestamps: true });

export default mongoose.models.Listing || mongoose.model("Listing", listingSchema);
