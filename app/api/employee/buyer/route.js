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

// GET — Fetch all buyers (with search, archive filter, and auto-seeding from past invoices if empty)
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim() || "";
    const showArchived = searchParams.get("showArchived") === "true";

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
              whatsAppNo: bd.whatsAppNo || "",
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

    let filter = {};
    if (showArchived) {
      filter.isArchived = true;
    } else {
      filter.isArchived = { $ne: true };
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      filter.$and = [
        ...(filter.isArchived !== undefined ? [{ isArchived: filter.isArchived }] : []),
        {
          $or: [
            { businessName: searchRegex },
            { phoneNo: searchRegex },
            { whatsAppNo: searchRegex },
            { contactPerson: searchRegex },
            { gstNo: searchRegex },
            { email: searchRegex },
            { address: searchRegex },
            { state: searchRegex },
          ],
        },
      ];
      delete filter.isArchived;
    }

    const buyers = await Buyer.find(filter).sort({ businessName: 1 }).lean();

    // Aggregate invoice stats for each buyer by business name
    let invoiceStatsMap = {};
    try {
      const stats = await B2BInvoice.aggregate([
        {
          $match: {
            "buyerDetails.businessName": { $exists: true, $ne: "" },
          },
        },
        {
          $group: {
            _id: { $toLower: { $trim: { input: "$buyerDetails.businessName" } } },
            invoiceCount: { $sum: 1 },
            totalSpent: { $sum: { $ifNull: ["$grandTotal", 0] } },
            lastInvoiceDate: { $max: "$invoiceDate" },
          },
        },
      ]);

      stats.forEach((s) => {
        if (s._id) {
          invoiceStatsMap[s._id] = {
            invoiceCount: s.invoiceCount || 0,
            totalSpent: s.totalSpent || 0,
            lastInvoiceDate: s.lastInvoiceDate || null,
          };
        }
      });
    } catch (aggErr) {
      console.error("Buyer invoice stats error:", aggErr);
    }

    // Attach statistics to each buyer
    const buyersWithStats = buyers.map((b) => {
      const key = (b.businessName || "").trim().toLowerCase();
      const st = invoiceStatsMap[key] || {
        invoiceCount: 0,
        totalSpent: 0,
        lastInvoiceDate: null,
      };
      return {
        ...b,
        invoiceCount: st.invoiceCount,
        totalSpent: st.totalSpent,
        lastInvoiceDate: st.lastInvoiceDate,
      };
    });

    return NextResponse.json(
      { success: true, data: buyersWithStats },
      { status: 200 }
    );
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
      whatsAppNo,
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
      if (gstNo !== undefined) buyer.gstNo = gstNo;
      if (contactPerson !== undefined) buyer.contactPerson = contactPerson;
      if (phoneNo !== undefined) buyer.phoneNo = phoneNo;
      if (whatsAppNo !== undefined) buyer.whatsAppNo = whatsAppNo;
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
      whatsAppNo: whatsAppNo || "",
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

// PUT — Update an existing buyer
export async function PUT(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _id, ...updateFields } = body;

    if (!_id) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    if (updateFields.businessName !== undefined && !updateFields.businessName.trim()) {
      return NextResponse.json({ error: "Buyer Name cannot be empty" }, { status: 400 });
    }

    const updatedBuyer = await Buyer.findByIdAndUpdate(
      _id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!updatedBuyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, message: "Buyer updated successfully", data: updatedBuyer },
      { status: 200 }
    );
  } catch (error) {
    console.error("Update Buyer API Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update buyer" },
      { status: 500 }
    );
  }
}

// DELETE — Archive / Delete a buyer
export async function DELETE(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Buyer ID is required" }, { status: 400 });
    }

    if (permanent) {
      const deleted = await Buyer.findByIdAndDelete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
      }
      return NextResponse.json(
        { success: true, message: "Buyer deleted permanently" },
        { status: 200 }
      );
    }

    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    buyer.isArchived = true;
    await buyer.save();

    return NextResponse.json(
      { success: true, message: "Buyer archived successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Delete Buyer API Error:", error);
    return NextResponse.json(
      { error: "Failed to archive buyer" },
      { status: 500 }
    );
  }
}

// PATCH — Restore an archived buyer
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

    const buyer = await Buyer.findById(id);
    if (!buyer) {
      return NextResponse.json({ error: "Buyer not found" }, { status: 404 });
    }

    buyer.isArchived = false;
    await buyer.save();

    return NextResponse.json(
      { success: true, message: "Buyer restored successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Restore Buyer API Error:", error);
    return NextResponse.json(
      { error: "Failed to restore buyer" },
      { status: 500 }
    );
  }
}
