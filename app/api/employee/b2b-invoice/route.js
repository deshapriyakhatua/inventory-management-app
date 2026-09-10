import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import B2BInvoice from "@/models/B2BInvoice";
import User from "@/models/User";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session")?.value;
  if (!sessionCookie) return null;
  return await decrypt(sessionCookie);
}

// GET - Fetch B2B Invoices
export async function GET(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const archived = searchParams.get("archived") === "true";
    const limit = parseInt(searchParams.get("limit") || "100", 10);

    // Single invoice lookup by ID
    if (id) {
      const invoice = await B2BInvoice.findById(id).populate("addedBy", "name email role");
      if (!invoice) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: invoice }, { status: 200 });
    }

    let query = { isArchived: archived ? true : { $ne: true } };

    if (status && status !== "All") {
      query.paymentStatus = status;
    }

    if (search) {
      const searchRegex = new RegExp(search, "i");
      query.$or = [
        { invoiceNumber: searchRegex },
        { "buyerDetails.businessName": searchRegex },
        { "buyerDetails.contactPerson": searchRegex },
        { "buyerDetails.phoneNo": searchRegex },
        { "lineItems.inventoryId": searchRegex },
        { "lineItems.description": searchRegex },
      ];
    }

    const invoices = await B2BInvoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("addedBy", "name email role");

    return NextResponse.json({ success: true, data: invoices }, { status: 200 });
  } catch (error) {
    console.error("Error fetching B2B invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// POST - Create B2B Invoice
export async function POST(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      invoiceNumber,
      invoiceDate,
      dueDate,
      placeOfSupply,
      sellerDetails,
      buyerDetails,
      lineItems,
      subtotal,
      flatTaxRate,
      totalTax,
      shippingFee,
      discount,
      grandTotal,
      receivedAmount,
      balanceAmount,
      amountInWords,
      paymentStatus,
      notes,
    } = body;

    // Validation
    if (!invoiceNumber || !buyerDetails?.businessName || !lineItems || lineItems.length === 0) {
      return NextResponse.json(
        { error: "Invoice number, buyer name, and at least one item are required" },
        { status: 400 }
      );
    }

    // Check if invoice number exists
    const existing = await B2BInvoice.findOne({ invoiceNumber });
    if (existing) {
      return NextResponse.json(
        { error: `Invoice number ${invoiceNumber} already exists` },
        { status: 400 }
      );
    }

    const newInvoice = new B2BInvoice({
      invoiceNumber,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : undefined,
      placeOfSupply: placeOfSupply || "19-West Bengal",
      sellerDetails: sellerDetails || {},
      buyerDetails: buyerDetails || {},
      lineItems: lineItems.map((item) => ({
        inventoryId: item.inventoryId || "",
        description: item.description || "Item",
        hsnCode: item.hsnCode || "7117",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 0,
        amount: Number(item.amount) || 0,
        taxAmount: Number(item.taxAmount) || 0,
        totalAmount: Number(item.totalAmount) || 0,
      })),
      subtotal: Number(subtotal) || 0,
      flatTaxRate: Number(flatTaxRate) || 0,
      totalTax: Number(totalTax) || 0,
      shippingFee: Number(shippingFee) || 0,
      discount: Number(discount) || 0,
      grandTotal: Number(grandTotal) || 0,
      receivedAmount: Number(receivedAmount) || 0,
      balanceAmount: Number(balanceAmount) || 0,
      amountInWords: amountInWords || "",
      paymentStatus: paymentStatus || "Pending",
      notes: notes || "",
      addedBy: session.id,
    });

    await newInvoice.save();

    return NextResponse.json(
      { success: true, message: "Invoice created successfully", invoice: newInvoice },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating B2B invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create invoice" },
      { status: 500 }
    );
  }
}

// PUT - Update / Edit B2B Invoice
export async function PUT(request) {
  try {
    await connectToDatabase();
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { _id, id, ...updateFields } = body;
    const targetId = _id || id;

    if (!targetId) {
      return NextResponse.json(
        { error: "Invoice ID (_id) is required for updates" },
        { status: 400 }
      );
    }

    const invoice = await B2BInvoice.findById(targetId);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Process line items formatting if updated
    if (updateFields.lineItems) {
      updateFields.lineItems = updateFields.lineItems.map((item) => ({
        inventoryId: item.inventoryId || "",
        description: item.description || "Item",
        hsnCode: item.hsnCode || "7117",
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
        taxRate: Number(item.taxRate) || 0,
        amount: Number(item.amount) || 0,
        taxAmount: Number(item.taxAmount) || 0,
        totalAmount: Number(item.totalAmount) || 0,
      }));
    }

    // Update object fields
    Object.assign(invoice, updateFields);
    await invoice.save();

    return NextResponse.json(
      { success: true, message: "Invoice updated successfully", invoice },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating B2B invoice:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update invoice" },
      { status: 500 }
    );
  }
}

// DELETE - Archive Invoice
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
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    const invoice = await B2BInvoice.findById(id);
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    invoice.isArchived = true;
    await invoice.save();

    return NextResponse.json(
      { success: true, message: "Invoice archived successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error archiving B2B invoice:", error);
    return NextResponse.json(
      { error: "Failed to archive invoice" },
      { status: 500 }
    );
  }
}
