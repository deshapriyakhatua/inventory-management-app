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
  //total quantity of the product purchased
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  //price per unit excluding shipping and tax
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  //total shipping fee for all units of the product
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
  //tax percentage on total purchase amount
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
