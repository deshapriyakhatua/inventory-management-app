import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Purchase from "@/models/Purchase";
import Seller from "@/models/Seller";
import Inventory from "@/models/Inventory";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// GET — Fetch sellers and/or dynamic mapping
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const sellerId = searchParams.get("sellerId");
    const fetchHistory = searchParams.get("history") === "true";

    // Requesting full purchase history
    if (fetchHistory) {
      const purchases = await Purchase.find({ isArchived: false })
        .populate("sellerId", "businessName")
        .sort({ orderedOn: -1, createdAt: -1 });
        
      return NextResponse.json({ success: true, purchases }, { status: 200 });
    }

    // Give all active sellers on initial page load
    const sellers = await Seller.find({ isArchived: { $ne: true } }, "_id businessName contactPerson").sort({ businessName: 1 });

    let mappings = [];
    if (sellerId && sellerId.length === 24) { // Basic ObjectId check
      // Find all inventory items where this seller is a source
      const inventoryItems = await Inventory.find({ "sources.sellerId": sellerId }, "inventoryId imageUrl sources");

      // Extract the exact mapping pairs for the frontend drop-down
      inventoryItems.forEach(inv => {
        const sourceData = inv.sources.find(s => s.sellerId.toString() === sellerId);
        if (sourceData && sourceData.sellerProductId) {
          mappings.push({
            sellerProductId: sourceData.sellerProductId,
            inventoryId: inv.inventoryId,
            imageUrl: inv.imageUrl || null
          });
        }
      });
    }

    return NextResponse.json({ success: true, sellers, mappings }, { status: 200 });
  } catch (error) {
    console.error("Purchase GET Error:", error);
    return NextResponse.json({ error: "Failed to load purchase configuration" }, { status: 500 });
  }
}

// POST — Create a new purchase record
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      sellerId, sellerProductId, inventoryId, 
      quantity, price, shippingFee, 
      orderedOn, receivedOn, invoiceNo, taxPercentage 
    } = body;

    // Validate Core
    if (!sellerId || !sellerProductId || !inventoryId || !quantity || quantity < 1 || price === undefined || !orderedOn) {
      return NextResponse.json({ error: "Missing required purchase fields" }, { status: 400 });
    }

    const newPurchase = await Purchase.create({
      sellerId,
      sellerProductId,
      inventoryId,
      quantity: Number(quantity),
      price: Number(price),
      shippingFee: Number(shippingFee) || 0,
      orderedOn: new Date(orderedOn),
      receivedOn: receivedOn ? new Date(receivedOn) : null,
      invoiceNo,
      taxPercentage: Number(taxPercentage) || 0,
      addedBy: session.id
    });

    return NextResponse.json({ success: true, message: "Purchase logged successfully", data: newPurchase }, { status: 201 });
  } catch (error) {
    console.error("Purchase POST Error:", error);
    return NextResponse.json({ error: error.message || "Failed to log purchase" }, { status: 500 });
  }
}

// PUT — Update an existing purchase
export async function PUT(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { 
      _id,
      quantity, price, shippingFee, 
      orderedOn, receivedOn, invoiceNo, taxPercentage 
    } = body;

    if (!_id) {
      return NextResponse.json({ error: "Purchase ID is required" }, { status: 400 });
    }

    const updateData = {};
    if (quantity !== undefined) updateData.quantity = Number(quantity);
    if (price !== undefined) updateData.price = Number(price);
    if (shippingFee !== undefined) updateData.shippingFee = Number(shippingFee) || 0;
    if (taxPercentage !== undefined) updateData.taxPercentage = Number(taxPercentage) || 0;
    if (orderedOn !== undefined) updateData.orderedOn = new Date(orderedOn);
    if (invoiceNo !== undefined) updateData.invoiceNo = invoiceNo;
    
    // Explicitly handle receivedOn (can be null/empty string to set back to in-transit)
    if (receivedOn) {
      updateData.receivedOn = new Date(receivedOn);
    } else if (receivedOn === null || receivedOn === "") {
      updateData.receivedOn = null;
    }

    const updatedPurchase = await Purchase.findByIdAndUpdate(
      _id,
      { $set: updateData },
      { new: true }
    ).populate("sellerId", "businessName");

    if (!updatedPurchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Purchase updated successfully", data: updatedPurchase }, { status: 200 });

  } catch (error) {
    console.error("Purchase PUT Error:", error);
    return NextResponse.json({ error: error.message || "Failed to update purchase" }, { status: 500 });
  }
}
