import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

export async function GET(request) {
  try {
    await connectToDatabase();

    // Check session
    const cookieStore = await cookies();
    const token = cookieStore.get("session")?.value;
    const session = await decrypt(token);

    if (!session || !session.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Role check: Employee, Admin, and Superadmin can see all (non-archived) inventory
    // Employees should only see non-archived ones.
    // If they are admin, maybe they want to see archived? 
    // But the request says "When showing inventory data to 'employee' filter out archived inventory"
    
    let query = { isArchived: { $ne: true } };

    // If we want to allow admins to see archived, we could add a query param.
    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get("showArchived") === "true";
    
    if (showArchived && (session.role === "admin" || session.role === "superadmin")) {
        delete query.isArchived;
    }

    const pipeline = [
      { $match: query },
      {
        $lookup: {
          from: "purchases", // Note: collection name is lowercase plural
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
          initialStock: { $sum: "$purchases.quantity" },
          totalBuyingPrice: {
            $sum: {
              $map: {
                input: "$purchases",
                as: "p",
                in: { $multiply: ["$$p.quantity", "$$p.price"] }
              }
            }
          }
        }
      },
      // --- Dynamic netSold Calculation ---
      {
        $lookup: {
          from: "listings",
          localField: "inventoryId",
          foreignField: "inventoryItems",
          as: "matchedListings"
        }
      },
      {
        $addFields: {
          relatedSkuIds: {
            $reduce: {
              input: "$matchedListings.skuId",
              initialValue: [],
              in: { $setUnion: ["$$value", ["$$this"]] }
            }
          }
        }
      },
      {
        $lookup: {
          from: "salesrecords",
          localField: "relatedSkuIds",
          foreignField: "skuId",
          as: "matchedSales"
        }
      },
      {
        $addFields: {
          dynamicNetSold: { $sum: "$matchedSales.netUnits" }
        }
      },
      // -----------------------------------
      {
        $addFields: {
          currentStock: {
            $add: [
              "$initialStock",
              { $ifNull: ["$adjust", 0] },
              { $ifNull: ["$returned", 0] },
              { $multiply: [{ $ifNull: ["$dynamicNetSold", 0] }, -1] },
              { $multiply: [{ $ifNull: ["$damaged", 0] }, -1] },
              { $multiply: [{ $ifNull: ["$dispatched", 0] }, -1] },
              { $multiply: [{ $ifNull: ["$cancelled", 0] }, -1] }
            ]
          },
          netSold: "$dynamicNetSold" // Ensure the frontend sees the dynamic value
        }
      },
      {
        $project: {
          matchedListings: 0,
          relatedSkuIds: 0,
          matchedSales: 0,
          dynamicNetSold: 0
        }
      },
      { $sort: { createdAt: -1 } }
    ];
    const items = await Inventory.aggregate(pipeline);

    // Apply FIFO calculation post-aggregation
    const { calculateFIFO } = await import("@/utils/fifoCalculator");
    
    const processedItems = items.map(item => {
      // Calculate consumed units based on how many left the stock vs initial stock
      const consumedUnits = Math.max(0, (item.initialStock || 0) - (item.currentStock || 0));

      // Run FIFO calculator on purchases
      const fifoData = calculateFIFO(item.purchases, consumedUnits);

      // Return item with updated pricing, omit purchases
      const { purchases, ...rest } = item;
      return {
        ...rest,
        totalBuyingPrice: fifoData.totalPurchaseCost,
        remainingInventoryValue: fifoData.remainingInventoryValue,
        fifoUnitCost: fifoData.fifoUnitCost,
      };
    });

    return NextResponse.json({ 
      success: true, 
      data: processedItems 
    }, { status: 200 });

  } catch (error) {
    console.error("All Inventory GET API Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch inventory data" 
    }, { status: 500 });
  }
}
