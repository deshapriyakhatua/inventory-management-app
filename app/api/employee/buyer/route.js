import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import Buyer from "@/models/Buyer";
import B2BInvoice from "@/models/B2BInvoice";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// GET — Fetch all buyers (with optional search and auto-seeding from past invoices if empty)
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";

    // If Buyer collection has 0 documents, migrate/seed unique buyers from existing B2BInvoice records
    const count = await Buyer.countDocuments();
    if (count === 0) {
      try {
        const invoices = await B2BInvoice.find({
          "buyerDetails.businessName": { $exists: true, $ne: "" },
        }).lean();

        const seenNames = new Set();
        const buyersToSeed = [];

        for (const inv of invoices) {
          const bd = inv.buyerDetails;
          if (bd && bd.businessName && !seenNames.has(bd.businessName.trim().toLowerCase())) {
            seenNames.add(bd.businessName.trim().toLowerCase());
            buyersToSeed.push({
              businessName: bd.businessName.trim(),
              gstNo: bd.gstNo || "NA",
              contactPerson: bd.contactPerson || "",
              phoneNo: bd.phoneNo || "",
              email: bd.email || "",
              address: bd.address || "",
              state: bd.state || "19-West Bengal",
              pinCode: bd.pinCode || "",
              addedBy: inv.addedBy || session.id,
            });
          }
        }

        if (buyersToSeed.length > 0) {
          await Buyer.insertMany(buyersToSeed, { ordered: false });
        }
      } catch (seedErr) {
        console.error("Auto-seed buyers warning:", seedErr);
      }
    }

    let filter = { isArchived: { $ne: true } };

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$or = [
        { businessName: searchRegex },
        { phoneNo: searchRegex },
        { contactPerson: searchRegex },
        { gstNo: searchRegex },
      ];
    }

    const buyers = await Buyer.find(filter).sort({ businessName: 1 }).lean();

    return NextResponse.json({ success: true, data: buyers }, { status: 200 });
  } catch (error) {
    console.error("Get Buyers API Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch buyers" },
      { status: 500 }
    );
  }
}

// POST — Create or upsert a buyer
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      businessName,
      gstNo,
      contactPerson,
      phoneNo,
      email,
      address,
      state,
      pinCode,
      notes,
    } = body;

    if (!businessName || !businessName.trim()) {
      return NextResponse.json(
        { error: "Buyer / Customer name is required" },
        { status: 400 }
      );
    }

    const trimmedName = businessName.trim();

    // Check if buyer already exists with same business name (case-insensitive)
    let buyer = await Buyer.findOne({
      businessName: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (buyer) {
      // Update existing buyer's details
      if (gstNo !== undefined) buyer.gstNo = gstNo;
      if (contactPerson !== undefined) buyer.contactPerson = contactPerson;
      if (phoneNo !== undefined) buyer.phoneNo = phoneNo;
      if (email !== undefined) buyer.email = email;
      if (address !== undefined) buyer.address = address;
      if (state !== undefined) buyer.state = state;
      if (pinCode !== undefined) buyer.pinCode = pinCode;
      if (notes !== undefined) buyer.notes = notes;
      buyer.isArchived = false;

      await buyer.save();
      return NextResponse.json(
        { success: true, message: "Buyer updated successfully", data: buyer },
        { status: 200 }
      );
    }

    // Create new buyer
    buyer = await Buyer.create({
      businessName: trimmedName,
      gstNo: gstNo || "NA",
      contactPerson: contactPerson || "",
      phoneNo: phoneNo || "",
      email: email || "",
      address: address || "",
      state: state || "19-West Bengal",
      pinCode: pinCode || "",
      notes: notes || "",
      addedBy: session.id,
    });

    return NextResponse.json(
      { success: true, message: "Buyer created successfully", data: buyer },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create Buyer API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save buyer" },
      { status: 500 }
    );
  }
}
