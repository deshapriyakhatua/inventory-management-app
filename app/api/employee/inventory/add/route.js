import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { UploadImage } from "@/lib/cloudinary";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

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

    const items = await Inventory.find({ 
      addedBy: session.id,
      isArchived: { $ne: true } 
    })
      .sort({ createdAt: -1 })
      .limit(5);

    return NextResponse.json({ 
      status: 200,
      data: items 
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
    const id = searchParams.get("id"); // This could be _id or inventoryId

    if (!id) {
      return NextResponse.json({ error: "Inventory ID is required" }, { status: 400 });
    }

    let query = { $or: [{ _id: id }, { inventoryId: id }] };
    
    // Only employees are restricted to archiving their own items
    if (session.role !== "admin" && session.role !== "superadmin") {
      query.addedBy = session.id;
    }

    // Find the item first to get the publicId for Cloudinary deletion
    const item = await Inventory.findOne(query);

    if (!item) {
      return NextResponse.json({ error: "Inventory item not found" }, { status: 404 });
    }

    // Delete from Cloudinary if publicId exists
    // Normally we should KEEP the image if it's just archived, 
    // unless the user specifically wants to save storage.
    // Given the request "mark it archived", I'll KEEP the image.
    
    // await DeleteImage(item.imageUrl); // Commenting out Cloudinary deletion

    await Inventory.updateOne({ _id: item._id }, { isArchived: true });

    return NextResponse.json({ 
      success: true, 
      message: "Inventory item deleted successfully" 
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
