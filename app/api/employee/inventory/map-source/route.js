import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import Seller from "@/models/Seller";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// GET — Fetch compact lists of Inventory and Sellers for dropdowns
export async function GET() {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Fetch basic inventory data holding their sources
    const inventoryList = await Inventory.find(
      { isArchived: { $ne: true } },
      "inventoryId imageUrl sources"
    ).populate("sources.sellerId", "businessName gstNo").sort({ createdAt: -1 });

    // Fetch active sellers for dropdown mapping
    const sellerList = await Seller.find(
      { isArchived: { $ne: true } }, 
      "businessName contactPerson"
    ).sort({ businessName: 1 });

    return NextResponse.json({ success: true, inventory: inventoryList, sellers: sellerList }, { status: 200 });
  } catch (error) {
    console.error("Map Sources GET Error:", error);
    return NextResponse.json({ error: "Failed to load mapping data" }, { status: 500 });
  }
}

// PATCH — Add or Update a source mapped to an Inventory ID
export async function PATCH(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { inventoryId, sellerId, sellerProductId } = await request.json();
    if (!inventoryId || !sellerId) {
      return NextResponse.json({ error: "Inventory Selection and Seller Selection are required." }, { status: 400 });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });

    // Ensure array exists
    if (!inventory.sources) inventory.sources = [];

    // Find if seller is already mapped
    const existingIndex = inventory.sources.findIndex(s => s.sellerId && s.sellerId.toString() === sellerId);
    if (existingIndex !== -1) {
      // Update existing
      inventory.sources[existingIndex].sellerProductId = sellerProductId;
    } else {
      // Append new
      inventory.sources.push({
        sellerId,
        sellerProductId
      });
    }

    await inventory.save();
    
    // Send back populated inventory object to update UI smoothly
    await inventory.populate("sources.sellerId", "businessName gstNo");

    return NextResponse.json({ success: true, message: "Source mapped successfully.", data: inventory }, { status: 200 });
  } catch (error) {
    console.error("Map Sources PATCH Error:", error);
    return NextResponse.json({ error: "Failed to map source." }, { status: 500 });
  }
}

// DELETE — Remove a specific source mapped to an Inventory ID
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");
    const sellerId = searchParams.get("sellerId");

    if (!inventoryId || !sellerId) {
      return NextResponse.json({ error: "Inventory ID and Seller ID are required." }, { status: 400 });
    }

    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) return NextResponse.json({ error: "Inventory item not found." }, { status: 404 });

    // Remove source from array
    inventory.sources = inventory.sources.filter(s => s.sellerId && s.sellerId.toString() !== sellerId);
    
    await inventory.save();
    await inventory.populate("sources.sellerId", "businessName gstNo");

    return NextResponse.json({ success: true, message: "Source unmapped successfully.", data: inventory }, { status: 200 });
  } catch (error) {
    console.error("Map Sources DELETE Error:", error);
    return NextResponse.json({ error: "Failed to remove mapped source." }, { status: 500 });
  }
}
