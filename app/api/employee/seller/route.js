import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Seller from "@/models/Seller";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// POST — Create a new seller
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      businessName, gstNo, contactPerson, email,
      phoneNo, whatsAppNo, altPhoneNo, altWhatsAppNo,
      address, country, pinCode, state, shippingProvider,
      bankName, accountNo, ifscCode, branch, accountType, upiId,
      altBankName, altAccountNo, altIfscCode, altBranch, altAccountType, altUpiId,
    } = body;

    if (!businessName) {
      return NextResponse.json({ error: "Business Name is required" }, { status: 400 });
    }

    const seller = await Seller.create({
      businessName, gstNo, contactPerson, email,
      phoneNo, whatsAppNo, altPhoneNo, altWhatsAppNo,
      address, country, pinCode, state, shippingProvider,
      bankName, accountNo, ifscCode, branch, accountType, upiId,
      altBankName, altAccountNo, altIfscCode, altBranch, altAccountType, altUpiId,
      addedBy: session.id,
    });

    return NextResponse.json(
      { success: true, message: "Seller added successfully", data: seller },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add Seller API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add seller" },
      { status: 500 }
    );
  }
}

// GET — Fetch all sellers
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const showArchived = searchParams.get("showArchived") === "true";

    let query = { isArchived: { $ne: true } };
    if (showArchived && (session.role === "admin" || session.role === "superadmin")) {
      delete query.isArchived;
    }

    const sellers = await Seller.find(query).sort({ createdAt: -1 });

    return NextResponse.json({ success: true, data: sellers }, { status: 200 });
  } catch (error) {
    console.error("Get Sellers API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sellers" },
      { status: 500 }
    );
  }
}

// DELETE — Delete a seller by id
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Seller ID is required" }, { status: 400 });
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    seller.isArchived = true;
    await seller.save();

    return NextResponse.json(
      { success: true, message: "Seller archived successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Seller API Error:", error);
    return NextResponse.json(
      { error: "Failed to delete seller" },
      { status: 500 }
    );
  }
}

// PATCH — Restore a seller by id
export async function PATCH(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || action !== "restore") {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    const seller = await Seller.findById(id);
    if (!seller) {
      return NextResponse.json({ error: "Seller not found" }, { status: 404 });
    }

    seller.isArchived = false;
    await seller.save();

    return NextResponse.json(
      { success: true, message: "Seller restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restore Seller API Error:", error);
    return NextResponse.json(
      { error: "Failed to restore seller" },
      { status: 500 }
    );
  }
}
