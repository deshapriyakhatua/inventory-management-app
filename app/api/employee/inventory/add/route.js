import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { UploadImage } from "@/lib/cloudinary";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import mongoose from "mongoose";

export async function POST(request) {
  try {
    await connectToDatabase();

    // Verify session again (defense in depth, though proxy.js handles it)
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const inventoryId = formData.get("inventoryId");
    const vertical = formData.get("vertical");
    const image = formData.get("image"); // File object

    // Basic validation
    if (!inventoryId || !vertical || !image) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Upload to Cloudinary
    // Usage: UploadImage(image, folder, url = null)
    const uploadResult = await UploadImage(image, "inventory");

    // Create record
    const newInventory = await Inventory.create({
      inventoryId,
      vertical,
      imageUrl: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      addedBy: session.id, // From JWT payload
      // Other fields will default to 0 as per user's manual edit to model
    });

    return NextResponse.json({ 
      success: true, 
      message: "Inventory item added successfully",
      data: newInventory 
    }, { status: 201 });

  } catch (error) {
    console.error("Add Inventory API Error:", error);
    return NextResponse.json({ 
      error: error.message || "Failed to add inventory item" 
    }, { status: 500 });
  }
}

export async function GET() {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const pipeline = [
      { 
        $match: { 
          addedBy: new mongoose.Types.ObjectId(session.id),
          isArchived: { $ne: true } 
        } 
      },
      {
        $lookup: {
          from: "purchases",
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
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ];

    const items = await Inventory.aggregate(pipeline);

    // Apply FIFO calculation post-aggregation
    const { calculateFIFO } = await import("@/utils/fifoCalculator");
    
    const processedItems = items.map(item => {
      const consumedUnits = Math.max(0, (item.initialStock || 0) - (item.currentStock || 0));

      const fifoData = calculateFIFO(item.purchases, consumedUnits);

      const { purchases, ...rest } = item;
      return {
        ...rest,
        totalBuyingPrice: fifoData.totalPurchaseCost,
        remainingInventoryValue: fifoData.remainingInventoryValue,
        fifoUnitCost: fifoData.fifoUnitCost,
      };
    });

    return NextResponse.json({ 
      status: 200,
      data: processedItems 
    }, { status: 200 });

  } catch (error) {
    console.error("Fetch Inventory API Error:", error);
    return NextResponse.json({ 
      error: "Failed to fetch inventory items" 
    }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Inventory ID is required" }, { status: 400 });
    }

    // Permanent deletion is admin/superadmin only
    if (permanent && session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized to permanently delete items" }, { status: 403 });
    }

    let query = { $or: [{ _id: id }, { inventoryId: id }] };

    // Only employees are restricted to archiving their own items
    if (!permanent && session.role !== "admin" && session.role !== "superadmin") {
      query.addedBy = session.id;
    }

    const item = await Inventory.findOne(query);

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    if (permanent) {
      // Hard delete from DB (and optionally Cloudinary)
      await Inventory.deleteOne({ _id: item._id });
      return NextResponse.json({
        success: true,
        message: "Inventory item permanently deleted"
      }, { status: 200 });
    }

    // Soft delete — archive
    await Inventory.updateOne({ _id: item._id }, { isArchived: true });

    return NextResponse.json({ 
      success: true, 
      message: "Inventory item archived successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Delete Inventory API Error:", error);
    return NextResponse.json({ 
      error: "Failed to delete inventory item" 
    }, { status: 500 });
  }
}


export async function PATCH(request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    // Only Admin and Superadmin can restore
    if (session.role !== "admin" && session.role !== "superadmin") {
      return NextResponse.json({ error: "Unauthorized to restore items" }, { status: 403 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== "restore") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const item = await Inventory.findOne({ $or: [{ _id: id }, { inventoryId: id }] });

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    await Inventory.updateOne({ _id: item._id }, { isArchived: false });

    return NextResponse.json({ 
      success: true, 
      message: "Inventory item restored successfully" 
    }, { status: 200 });

  } catch (error) {
    console.error("Restore Inventory API Error:", error);
    return NextResponse.json({ 
      error: "Failed to restore inventory item" 
    }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    await connectToDatabase();

    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session")?.value;
    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const session = await decrypt(sessionCookie);
    if (!session) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await request.formData();
    const id = formData.get("id");
    const inventoryId = formData.get("inventoryId");
    const vertical = formData.get("vertical");
    const image = formData.get("image"); // File object or null

    if (!id || !inventoryId || !vertical) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingItem = await Inventory.findById(id);
    if (!existingItem) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    const oldInventoryId = existingItem.inventoryId;

    // Check duplicate if inventoryId changed
    if (inventoryId !== oldInventoryId) {
      const duplicate = await Inventory.findOne({ inventoryId, _id: { $ne: id } });
      if (duplicate) {
        return NextResponse.json({ error: `Inventory ID "${inventoryId}" already exists.` }, { status: 400 });
      }
    }

    const updateFields = {
      inventoryId,
      vertical,
    };

    if (image && typeof image !== 'string' && image.name) {
      const uploadResult = await UploadImage(image, "inventory");
      updateFields.imageUrl = uploadResult.secure_url;
      updateFields.publicId = uploadResult.public_id;
    }

    // Optional stock adjustment fields if provided
    if (formData.has("adjust")) updateFields.adjust = Number(formData.get("adjust")) || 0;
    if (formData.has("damaged")) updateFields.damaged = Number(formData.get("damaged")) || 0;
    if (formData.has("dispatched")) updateFields.dispatched = Number(formData.get("dispatched")) || 0;
    if (formData.has("cancelled")) updateFields.cancelled = Number(formData.get("cancelled")) || 0;
    if (formData.has("returned")) updateFields.returned = Number(formData.get("returned")) || 0;

    const updatedItem = await Inventory.findByIdAndUpdate(id, updateFields, { new: true });

    // If inventoryId changed, update references in Listing and Purchase collections
    if (inventoryId !== oldInventoryId) {
      const Listing = (await import("@/models/Listing")).default;
      const Purchase = (await import("@/models/Purchase")).default;

      await Listing.updateMany(
        { inventoryItems: oldInventoryId },
        { $set: { "inventoryItems.$": inventoryId } }
      );

      await Purchase.updateMany(
        { inventoryId: oldInventoryId },
        { $set: { inventoryId: inventoryId } }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Inventory item updated successfully",
      data: updatedItem,
    }, { status: 200 });

  } catch (error) {
    console.error("Update Inventory API Error:", error);
    return NextResponse.json({
      error: error.message || "Failed to update inventory item"
    }, { status: 500 });
  }
}

