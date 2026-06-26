import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import SalesRecord from "@/models/SalesRecord";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// ─── Auth helper ─────────────────────────────────────────────────────────────
async function getUser() {
  const session = (await cookies()).get("session")?.value;
  return decrypt(session);
}

// ─── POST — Create/upsert monthly sales records ───────────────────────────────
// Body:
//   items: [{ skuId, month, year, salesChannel?, grossUnits, logisticsReturns,
//             customerReturns, cancellations, netUnits, netSales, totalExpenses,
//             otherBenefits, projectedBankSettlement }]
//   forceOverrides: ["skuId_month_year", ...]  — keys to force-upsert even if duplicate
//
// Response:
//   { success, inserted, updated, conflicts: [{ key, existing, incoming }] }
export async function POST(request) {
  try {
    await connectToDatabase();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { items, forceOverrides = [], forceKeepBoth = [] } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "items must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate required fields on each item
    const invalid = items.filter(
      (item) => !item.skuId || item.month == null || item.year == null
    );
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `${invalid.length} item(s) missing required fields (skuId, month, year)` },
        { status: 400 }
      );
    }

    let inserted = 0;
    let updated = 0;
    const conflicts = [];

    for (const item of items) {
      const key = `${item.skuId}_${item.salesChannel ?? ''}_${item.month}_${item.year}`;
      const isForced = forceOverrides.includes(key);
      const isKeepBoth = forceKeepBoth.includes(key);

      // Check for existing record
      const existing = await SalesRecord.findOne({
        skuId: item.skuId,
        month: item.month,
        year: item.year,
        salesChannel: item.salesChannel ?? null,
      }).lean();

      if (existing && !isForced && !isKeepBoth) {
        // Conflict: return existing data alongside incoming for comparison
        conflicts.push({ key, existing, incoming: item });
        continue;
      }

      // Prepare payload
      const payload = {
        skuId: item.skuId,
        month: item.month,
        year: item.year,
        salesChannel: item.salesChannel ?? null,
        grossUnits: item.grossUnits ?? 0,
        logisticsReturns: item.logisticsReturns ?? 0,
        customerReturns: item.customerReturns ?? 0,
        cancellations: item.cancellations ?? 0,
        netUnits: item.netUnits ?? 0,
        netSales: item.netSales ?? 0,
        totalExpenses: item.totalExpenses ?? 0,
        otherBenefits: item.otherBenefits ?? 0,
        projectedBankSettlement: item.projectedBankSettlement ?? 0,
        uploadedBy: user.id || null,
      };

      if (isKeepBoth) {
        // Keep both: insert a brand new record
        await SalesRecord.create(payload);
        inserted++;
      } else {
        // Override or first time insert: upsert
        await SalesRecord.findOneAndUpdate(
          { skuId: item.skuId, month: item.month, year: item.year, salesChannel: item.salesChannel ?? null },
          payload,
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        if (existing) {
          updated++;
        } else {
          inserted++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      conflicts,
    });
  } catch (error) {
    console.error("Sales Records POST error:", error);
    return NextResponse.json(
      { error: "Failed to save sales records" },
      { status: 500 }
    );
  }
}

// ─── GET — Fetch monthly records with server-side pagination ──────────────────
// Query params: page, pageSize, search (skuId), month, year, salesChannel, sortBy, sortOrder
export async function GET(request) {
  try {
    await connectToDatabase();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(
      5000,
      Math.max(1, parseInt(searchParams.get("pageSize") || "500", 10))
    );
    const search = searchParams.get("search") || "";
    const month = searchParams.get("month") || "";
    const year = searchParams.get("year") || "";
    const salesChannel = searchParams.get("salesChannel") || "";
    const isArchived = searchParams.get("isArchived") === "true";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;

    // Build filter
    const filter = { isArchived };
    if (month) filter.month = parseInt(month, 10);
    if (year) filter.year = parseInt(year, 10);
    if (salesChannel) filter.salesChannel = salesChannel;
    if (search) {
      filter.skuId = { $regex: search, $options: "i" };
    }

    // Sort field map
    const sortFieldMap = {
      skuId: "skuId",
      month: "month",
      year: "year",
      salesChannel: "salesChannel",
      grossUnits: "grossUnits",
      netUnits: "netUnits",
      netSales: "netSales",
      projectedBankSettlement: "projectedBankSettlement",
      timestamp: "createdAt",
    };
    const mongoSortField = sortFieldMap[sortBy] || "createdAt";

    const [records, totalItems] = await Promise.all([
      SalesRecord.find(filter)
        .sort({ [mongoSortField]: sortOrder })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .lean(),
      SalesRecord.countDocuments(filter),
    ]);

    const mapped = records.map((r) => ({ ...r, timestamp: r.createdAt }));

    return NextResponse.json({
      success: true,
      data: mapped,
      totalItems,
      totalPages: Math.ceil(totalItems / pageSize) || 1,
      page,
      pageSize,
    });
  } catch (error) {
    console.error("Sales Records GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales records" },
      { status: 500 }
    );
  }
}

// ─── PUT — Bulk actions (Archive, Restore, Delete) ───────────────────────────
export async function PUT(request) {
  try {
    await connectToDatabase();
    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, recordIds } = body;

    if (!["archive", "restore", "delete"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
    if (!Array.isArray(recordIds) || recordIds.length === 0) {
      return NextResponse.json({ error: "recordIds array is required" }, { status: 400 });
    }

    let result;
    if (action === "archive") {
      result = await SalesRecord.updateMany(
        { _id: { $in: recordIds } },
        { $set: { isArchived: true } }
      );
    } else if (action === "restore") {
      result = await SalesRecord.updateMany(
        { _id: { $in: recordIds } },
        { $set: { isArchived: false } }
      );
    } else if (action === "delete") {
      result = await SalesRecord.deleteMany({ _id: { $in: recordIds } });
    }

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount || result.deletedCount || 0,
    });
  } catch (error) {
    console.error("Sales Records PUT error:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
