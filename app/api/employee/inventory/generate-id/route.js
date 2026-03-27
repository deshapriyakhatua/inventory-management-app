import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const verticalShort = searchParams.get("verticalShort");

    if (!verticalShort) {
      return NextResponse.json({ error: "Vertical short name is required" }, { status: 400 });
    }

    // Find the latest inventory item with this vertical prefix
    // Prefix format: VER-NNNN
    const latestItem = await Inventory.findOne({
      inventoryId: new RegExp(`^${verticalShort}-`, "i")
    }).sort({ inventoryId: -1 });

    let nextNumber = 1;

    if (latestItem) {
      // Extract the numeric part (everything after the hyphen)
      const parts = latestItem.inventoryId.split("-");
      if (parts.length >= 2) {
        const lastNum = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastNum)) {
          nextNumber = lastNum + 1;
        }
      }
    }

    // Pad with leading zeros to at least 4 digits
    const paddedNumber = nextNumber.toString().padStart(4, "0");
    const nextId = `${verticalShort.toUpperCase()}-${paddedNumber}`;

    return NextResponse.json({ 
      success: true, 
      nextId 
    }, { status: 200 });

  } catch (error) {
    console.error("Generate ID API Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate inventory ID" 
    }, { status: 500 });
  }
}
