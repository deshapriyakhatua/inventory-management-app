import mongoose from "mongoose";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  const Inventory = (await import("./models/Inventory.js")).default;
  
  const items = await Inventory.find({}).lean();
  console.log("Total items:", items.length);
  if (items.length > 0) {
    for (let i = 0; i < Math.min(3, items.length); i++) {
        console.log("Item", i, ":", {
            inventoryId: items[i].inventoryId,
            netSold: items[i].netSold,
            adjust: items[i].adjust,
            returned: items[i].returned,
            damaged: items[i].damaged,
            dispatched: items[i].dispatched,
            cancelled: items[i].cancelled,
            currentStock: items[i].currentStock,
        });
    }
  }
  
  process.exit(0);
}

check();
