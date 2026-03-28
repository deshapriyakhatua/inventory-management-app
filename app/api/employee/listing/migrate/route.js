import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Listing from "@/models/Listing";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function POST(request) {
  try {
    // 1. Verify Session
    const session = (await cookies()).get('session')?.value;
    const user = await decrypt(session);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pin } = await request.json();

    if (!pin) {
      return NextResponse.json({ error: "PIN is required to fetch data from legacy backend" }, { status: 400 });
    }

    // 2. Fetch all listings from Google Apps Script
    const payload = {
      pin: pin,
      action: "getListing",
      page: 1,
      pageSize: 50000,
      sort: "newest_first"
    };

    const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });

    const result = await response.json();

    if (result.status !== 200) {
      return NextResponse.json({ error: "Failed to fetch data from source: " + (result.message || "Unknown error") }, { status: 502 });
    }

    let fetchedListings = [];
    if (result.data && Array.isArray(result.data.listings)) {
      fetchedListings = result.data.listings;
    } else if (result.message && Array.isArray(result.message.listings)) {
      fetchedListings = result.message.listings;
    } else if (Array.isArray(result.data)) {
      fetchedListings = result.data;
    } else if (Array.isArray(result.message)) {
      fetchedListings = result.message;
    }

    if (!fetchedListings.length) {
      return NextResponse.json({ success: true, message: "No listings found to migrate." });
    }

    await connectToDatabase();

    // 3. Transformation and Bulk Upsert
    // (We use upsert by skuId to prevent duplicates)
    const operations = fetchedListings.map(item => {
      // Ensure vertical name is handled correctly (sometimes it's a code, sometimes a name)
      const vertical = item.vertical || "Unknown";
      
      // inventoryItems analysis
      let inventoryItems = [];
      if (Array.isArray(item.inventoryItems)) {
        inventoryItems = item.inventoryItems.map(inv => inv.inventoryId || inv);
      } else if (typeof item.inventoryItems === 'string') {
        inventoryItems = item.inventoryItems.split(',').map(s => s.trim());
      } else if (item.inventoryId) {
        inventoryItems = [item.inventoryId];
      }

      return {
        updateOne: {
          filter: { skuId: item.skuId },
          update: {
            $set: {
              skuId: item.skuId,
              vertical: vertical,
              marketplace: item.marketplace || "Direct",
              itemCount: inventoryItems.length,
              inventoryItems: inventoryItems,
              status: item.status || "active",
              // Optionally preserve original createdAt
            },
            $setOnInsert: {
                createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
                addedBy: user.id
            }
          },
          upsert: true
        }
      };
    });

    const bulkResult = await Listing.bulkWrite(operations);

    return NextResponse.json({ 
      success: true, 
      message: `${bulkResult.upsertedCount} listings created, ${bulkResult.modifiedCount} updated.`,
      summary: bulkResult
    });

  } catch (error) {
    console.error("Migration Error:", error);
    return NextResponse.json({ error: "Migration failed" }, { status: 500 });
  }
}
