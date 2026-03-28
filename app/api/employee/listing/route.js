import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Listing from "@/models/Listing";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    await connectToDatabase();
    
    // Auth Protection
    const session = (await cookies()).get('session')?.value;
    const user = await decrypt(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { skuId, vertical, marketplace, inventoryItems, status } = body;

    if (!skuId || !vertical || !marketplace || !inventoryItems) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if SKU already exists for the same marketplace
    const existingListing = await Listing.findOne({ skuId, marketplace });
    if (existingListing) {
      return NextResponse.json({ error: "SKU ID already exists for this marketplace" }, { status: 409 });
    }

    const newListing = await Listing.create({
      skuId,
      vertical,
      marketplace,
      itemCount: inventoryItems.length,
      inventoryItems,
      status: status || "active",
      addedBy: user.id,
    });

    return NextResponse.json({ 
      success: true, 
      data: newListing 
    }, { status: 201 });

  } catch (error) {
    console.error("Add Listing API Error:", error);
    return NextResponse.json({ 
      error: "Failed to create listing locally" 
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    await connectToDatabase();
    // Default GET returns all or limited for recent
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "0", 10);
    
    let query = Listing.find({}).sort({ createdAt: -1 });
    if (limit > 0) {
      query = query.limit(limit);
    }
    
    const listings = await query.lean();

    // Fetch images for inventory items
    const inventoryIds = Array.from(new Set(listings.flatMap(l => l.inventoryItems)));
    const Inventory = (await import("@/models/Inventory")).default;
    const inventoryMap = {};
    
    if (inventoryIds.length > 0) {
        const inventoryItems = await Inventory.find({ inventoryId: { $in: inventoryIds } }).select("inventoryId imageUrl").lean();
        inventoryItems.forEach(item => {
            inventoryMap[item.inventoryId] = item.imageUrl;
        });
    }

    const enhancedListings = listings.map(l => ({
        ...l,
        inventoryItems: l.inventoryItems.map(id => ({
            inventoryId: id,
            imageUrl: inventoryMap[id] || null
        }))
    }));

    return NextResponse.json({ success: true, data: enhancedListings });
  } catch (error) {
    console.error("Listings GET error:", error);
    return NextResponse.json({ error: "Failed to fetch listings" }, { status: 500 });
  }
}

export async function DELETE(request) {
    try {
        await connectToDatabase();
        
        // Auth Protection
        const session = (await cookies()).get('session')?.value;
        const user = await decrypt(session);
        if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
            return NextResponse.json({ error: "Unauthorized: Admin access required" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const skuId = searchParams.get("skuId");

        if (!skuId) {
            return NextResponse.json({ error: "SKU ID is required" }, { status: 400 });
        }

        const deleted = await Listing.findOneAndDelete({ skuId });
        if (!deleted) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: "Listing deleted successfully" });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete listing" }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        await connectToDatabase();

        // Auth Protection
        const session = (await cookies()).get('session')?.value;
        const user = await decrypt(session);
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { skuId, vertical, marketplace, status, inventoryItems } = body;

        if (!skuId) {
            return NextResponse.json({ error: "SKU ID is required" }, { status: 400 });
        }

        const updateData = {};
        if (vertical !== undefined)        updateData.vertical = vertical;
        if (marketplace !== undefined)     updateData.marketplace = marketplace;
        if (status !== undefined)          updateData.status = status;
        if (inventoryItems !== undefined) {
            updateData.inventoryItems = inventoryItems;
            updateData.itemCount = inventoryItems.length;
        }

        const updated = await Listing.findOneAndUpdate(
            { skuId },
            { $set: updateData },
            { new: true, runValidators: true }
        );

        if (!updated) {
            return NextResponse.json({ error: "Listing not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: updated });
    } catch (error) {
        console.error("Update Listing API Error:", error);
        return NextResponse.json({ error: "Failed to update listing" }, { status: 500 });
    }
}
