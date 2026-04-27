import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Listing from "@/models/Listing";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await decrypt(token);

    if (!session || !session.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const inventoryId = searchParams.get("inventoryId");

    if (!inventoryId) {
      return NextResponse.json({ error: "inventoryId is required" }, { status: 400 });
    }

    const listings = await Listing.aggregate([
      { $match: { inventoryItems: inventoryId } },
      {
        $lookup: {
          from: "salesrecords", // Model name is SalesRecord
          let: { skuId: "$skuId" },
          pipeline: [
            { 
              $match: { 
                $expr: { 
                  $and: [
                    { $eq: ["$skuId", "$$skuId"] },
                    { $in: ["$status", ["ORDERED", "DISPATCHED", "DELIVERED"]] }
                  ]
                }
              }
            },
            { $group: { _id: null, netSold: { $sum: "$quantity" } } }
          ],
          as: "sales"
        }
      },
      {
        $addFields: {
          netSold: { $ifNull: [{ $arrayElemAt: ["$sales.netSold", 0] }, 0] }
        }
      },
      {
        $lookup: {
          from: "inventories", // Model name is Inventory
          localField: "inventoryItems",
          foreignField: "inventoryId",
          pipeline: [
            {
              $lookup: {
                from: "purchases", // Model name is Purchase
                let: { invId: "$inventoryId" },
                pipeline: [
                  { 
                    $match: { 
                      $expr: { 
                        $and: [
                          { $eq: ["$inventoryId", "$$invId"] },
                          { $ne: ["$receivedOn", null] },
                          { $eq: [{ $ifNull: ["$isArchived", false] }, false] }
                        ]
                      }
                    }
                  }
                ],
                as: "purchases"
              }
            },
            {
              $addFields: {
                initialStock: { $sum: "$purchases.quantity" }
              }
            },
            {
              $addFields: {
                currentStock: {
                  $add: [
                    "$initialStock",
                    { $ifNull: ["$adjust", 0] },
                    { $ifNull: ["$returned", 0] },
                    { $multiply: [{ $ifNull: ["$netSold", 0] }, -1] },
                    { $multiply: [{ $ifNull: ["$damaged", 0] }, -1] },
                    { $multiply: [{ $ifNull: ["$dispatched", 0] }, -1] },
                    { $multiply: [{ $ifNull: ["$cancelled", 0] }, -1] }
                  ]
                }
              }
            },
            { $project: { inventoryId: 1, imageUrl: 1, currentStock: 1 } }
          ],
          as: "comboItems"
        }
      },
      { $project: { sales: 0 } }
    ]);

    return NextResponse.json({ success: true, skus: listings }, { status: 200 });

  } catch (error) {
    console.error("SKUs GET API Error:", error);
    return NextResponse.json({ error: "Failed to fetch SKUs" }, { status: 500 });
  }
}
