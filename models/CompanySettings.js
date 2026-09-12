import mongoose from "mongoose";

const companySettingsSchema = new mongoose.Schema(
  {
    businessName: { type: String, default: "CRAZYKUDI" },
    address: {
      type: String,
      default: "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal",
    },
    state: { type: String, default: "19-West Bengal" },
    gstNo: { type: String, default: "19JHWPK2955Q1ZW" },
    bankName: { type: String, default: "Slice Small Finance Bank" },
    accountNo: { type: String, default: "033311501063323" },
    ifscCode: { type: String, default: "NESF0000333" },
    accountHolderName: { type: String, default: "CRAZYKUDI" },
    upiId: { type: String, default: "s6037472980259754@slc" },
    notes: {
      type: String,
      default:
        "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only.",
    },
  },
  { timestamps: true }
);

export default mongoose.models.CompanySettings ||
  mongoose.model("CompanySettings", companySettingsSchema);
