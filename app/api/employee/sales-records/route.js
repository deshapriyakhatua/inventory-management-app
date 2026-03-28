import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import SalesRecord from "@/models/SalesRecord";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

// ─── Auth helper ────────────────────────────────────────────────────────────
async function getUser() {
  const session = (await cookies()).get("session")?.value;
  return decrypt(session);
}

// ─── POST — Bulk upsert sales records ────────────────────────────────────────
// Body: { marketplace: string, salesItems: [{ orderId, lineId, skuId, quantity, status?, orderedOn? }] }
export async function POST(request) {
  try {
    await connectToDatabase();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { marketplace = "Flipkart", salesItems } = body;

    if (!Array.isArray(salesItems) || salesItems.length === 0) {
      return NextResponse.json(
        { error: "salesItems must be a non-empty array" },
        { status: 400 }
      );
    }

    // Validate required fields
    const invalid = salesItems.filter(
      (item) => !item.orderId || !item.skuId || item.quantity == null
    );
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: `${invalid.length} item(s) missing required fields (orderId, skuId, quantity)` },
        { status: 400 }
      );
    }

    // Build bulk operations
    // - If record exists: only update status when new status is non-null
    // - If record doesn't exist: insert with all fields
    const ops = salesItems.map((item) => {
      const filter = {
        orderId: item.orderId,
        lineId: item.lineId || "",
      };

      const setOnInsert = {
        skuId: item.skuId,
        marketplace,
        quantity: item.quantity,
        orderedOn: item.orderedOn || null,
        uploadedBy: user.id || null,
      };

      // Status update: only set if the incoming status is non-null
      const setFields = {};
      if (item.status != null) {
        setFields.status = item.status;
      }

      return {
        updateOne: {
          filter,
          update: {
            ...(Object.keys(setFields).length > 0 ? { $set: setFields } : {}),
            $setOnInsert: setOnInsert,
          },
          upsert: true,
        },
      };
    });

    const result = await SalesRecord.bulkWrite(ops, { ordered: false });

    return NextResponse.json({
      success: true,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
      total: salesItems.length,
    });
  } catch (error) {
    console.error("Sales Records POST error:", error);
    return NextResponse.json(
      { error: "Failed to upload sales records" },
      { status: 500 }
    );
  }
}

// ─── GET — Fetch records with server-side pagination ─────────────────────────
// Query params: page, pageSize, search, status (comma-sep), sortBy, sortOrder, marketplace
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
    const statusParam = searchParams.get("status") || "";
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1;
    const marketplace = searchParams.get("marketplace") || "";

    // Build filter
    const filter = {};

    if (marketplace) {
      filter.marketplace = marketplace;
    }

    if (statusParam) {
      const statuses = statusParam.split(",").filter(Boolean);
      if (statuses.length > 0) filter.status = { $in: statuses };
    }

    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { lineId: { $regex: search, $options: "i" } },
        { skuId: { $regex: search, $options: "i" } },
      ];
    }

    // Map sortBy aliases
    const sortFieldMap = {
      timestamp: "createdAt",
      orderId: "orderId",
      lineId: "lineId",
      skuId: "skuId",
      quantity: "quantity",
      status: "status",
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

    // Remap createdAt → timestamp for front-end compatibility
    const mapped = records.map((r) => ({
      ...r,
      timestamp: r.createdAt,
    }));

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

// ─── PUT — Bulk update status of existing records ────────────────────────────
// Body: { updates: [{ orderId, lineId, status }] }
export async function PUT(request) {
  try {
    await connectToDatabase();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: "updates must be a non-empty array" },
        { status: 400 }
      );
    }

    const ops = updates
      .filter((u) => u.orderId && u.status)
      .map((u) => ({
        updateOne: {
          filter: { orderId: u.orderId, lineId: u.lineId || "" },
          update: { $set: { status: u.status } },
        },
      }));

    if (ops.length === 0) {
      return NextResponse.json(
        { error: "No valid updates provided" },
        { status: 400 }
      );
    }

    const result = await SalesRecord.bulkWrite(ops, { ordered: false });

    return NextResponse.json({
      success: true,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Sales Records PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update sales records" },
      { status: 500 }
    );
  }
}
