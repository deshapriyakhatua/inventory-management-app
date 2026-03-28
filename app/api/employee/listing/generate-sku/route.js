import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Listing from "@/models/Listing";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    // Auth Protection
    const session = (await cookies()).get('session')?.value;
    const user = await decrypt(session);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const verticalShort = searchParams.get("verticalShort");
    const itemCount = searchParams.get("itemCount") || "01";

    if (!verticalShort) {
      return NextResponse.json({ error: "Vertical short name is required" }, { status: 400 });
    }

    // Find the latest listing with this vertical prefix: VERTICALSHORT-XX-NNNN
    const latestListing = await Listing.findOne({
      skuId: new RegExp(`^${verticalShort.toUpperCase()}-`, "i")
    }).sort({ skuId: -1 });

    let nextSerial = 1;

    if (latestListing) {
      const parts = latestListing.skuId.split("-");
      if (parts.length >= 3) {
        const lastSerial = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastSerial)) {
          nextSerial = lastSerial + 1;
        }
      } else if (parts.length === 2) {
        const lastSerial = parseInt(parts[1], 10);
         if (!isNaN(lastSerial)) {
          nextSerial = lastSerial + 1;
        }
      }
    }

    const paddedItemCount = itemCount.toString().padStart(2, "0");
    const paddedSerial = nextSerial.toString().padStart(4, "0");
    const nextSkuId = `${verticalShort.toUpperCase()}-${paddedItemCount}-${paddedSerial}`;

    return NextResponse.json({ 
      success: true, 
      nextId: nextSkuId 
    }, { status: 200 });

  } catch (error) {
    console.error("Generate SKU API Error:", error);
    return NextResponse.json({ 
      error: "Failed to generate SKU ID" 
    }, { status: 500 });
  }
}
