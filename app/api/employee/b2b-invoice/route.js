import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import B2BInvoice from "@/models/B2BInvoice";
import Buyer from "@/models/Buyer";
import User from "@/models/User";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";
import { calculatePaymentStatus } from "@/lib/paymentStatus";

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
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const limitParam = searchParams.get("limit");
    const limit = limitParam === "all" || limitParam === "0" ? 0 : parseInt(limitParam || "100", 10);

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

    if (startDate && endDate) {
      query.invoiceDate = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (month) {
      let start, end;
      if (month.includes("-")) {
        const [y, m] = month.split("-").map(Number);
        start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      } else {
        const y = parseInt(year || new Date().getFullYear(), 10);
        const m = parseInt(month, 10);
        start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0));
        end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
      }
      query.invoiceDate = { $gte: start, $lte: end };
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

    let queryExec = B2BInvoice.find(query).populate("addedBy", "name email role");
    if (month || startDate) {
      queryExec = queryExec.sort({ invoiceDate: 1, invoiceNumber: 1 });
    } else {
      queryExec = queryExec.sort({ createdAt: -1 });
    }

    if (limit > 0) {
      queryExec = queryExec.limit(limit);
    }

    const invoices = await queryExec;

    return NextResponse.json({ success: true, data: invoices }, { status: 200 });
  } catch (error) {
    console.error("Error fetching B2B invoices:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoices" },
      { status: 500 }
    );
  }
}

// Helper: Ensure buyer is saved / updated in Buyer collection
async function syncBuyerHelper(buyerDetails, userId) {
  if (!buyerDetails || !buyerDetails.businessName) return;
  const trimmedName = buyerDetails.businessName.trim();
  if (!trimmedName) return;

  try {
    const existing = await Buyer.findOne({
      businessName: { $regex: new RegExp(`^${trimmedName}$`, "i") },
    });

    if (existing) {
      if (buyerDetails.gstNo && buyerDetails.gstNo !== "NA") existing.gstNo = buyerDetails.gstNo;
      if (buyerDetails.contactPerson) existing.contactPerson = buyerDetails.contactPerson;
      if (buyerDetails.phoneNo) existing.phoneNo = buyerDetails.phoneNo;
      if (buyerDetails.email) existing.email = buyerDetails.email;
      if (buyerDetails.address) existing.address = buyerDetails.address;
      if (buyerDetails.state) existing.state = buyerDetails.state;
      if (buyerDetails.pinCode) existing.pinCode = buyerDetails.pinCode;
      existing.isArchived = false;
      await existing.save();
    } else {
      await Buyer.create({
        businessName: trimmedName,
        gstNo: buyerDetails.gstNo || "NA",
        contactPerson: buyerDetails.contactPerson || "",
        phoneNo: buyerDetails.phoneNo || "",
        email: buyerDetails.email || "",
        address: buyerDetails.address || "",
        state: buyerDetails.state || "19-West Bengal",
        pinCode: buyerDetails.pinCode || "",
        addedBy: userId,
      });
    }
  } catch (err) {
    console.error("Error syncing Buyer on invoice generation:", err);
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

    const computedGrandTotal = Number(grandTotal) || 0;
    const computedReceived = Number(receivedAmount) || 0;
    const computedBalance = computedGrandTotal - computedReceived;
    const computedStatus =
      paymentStatus === "Cancelled"
        ? "Cancelled"
        : calculatePaymentStatus(computedGrandTotal, computedReceived);

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
      grandTotal: computedGrandTotal,
      receivedAmount: computedReceived,
      balanceAmount: computedBalance,
      amountInWords: amountInWords || "",
      paymentStatus: computedStatus,
      notes: notes || "",
      addedBy: session.id,
    });

    await newInvoice.save();

    // Auto-sync buyer to individual Buyer model for future selection
    await syncBuyerHelper(buyerDetails, session.id);

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

    // Auto-calculate balance and payment status before saving updates
    const finalGrandTotal =
      updateFields.grandTotal !== undefined
        ? Number(updateFields.grandTotal)
        : invoice.grandTotal;
    const finalReceived =
      updateFields.receivedAmount !== undefined
        ? Number(updateFields.receivedAmount)
        : invoice.receivedAmount;
    const requestedStatus =
      updateFields.paymentStatus !== undefined
        ? updateFields.paymentStatus
        : invoice.paymentStatus;

    updateFields.balanceAmount = finalGrandTotal - finalReceived;
    updateFields.paymentStatus =
      requestedStatus === "Cancelled"
        ? "Cancelled"
        : calculatePaymentStatus(finalGrandTotal, finalReceived);

    // Update object fields
    Object.assign(invoice, updateFields);
    await invoice.save();

    if (updateFields.buyerDetails) {
      await syncBuyerHelper(updateFields.buyerDetails, session.id);
    }

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
    const permanent = searchParams.get("permanent") === "true";

    if (!id) {
      return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 });
    }

    if (permanent) {
      const deleted = await B2BInvoice.findByIdAndDelete(id);
      if (!deleted) {
        return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
      }
      return NextResponse.json(
        { success: true, message: "Invoice permanently deleted successfully" },
        { status: 200 }
      );
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
