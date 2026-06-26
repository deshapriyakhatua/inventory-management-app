import { NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongoose";
import SalesRecord from "@/models/SalesRecord";
import Listing from "@/models/Listing";
import Purchase from "@/models/Purchase";
import { calculateFIFOCostForUnits } from "@/utils/fifoCalculator";
import { decrypt } from "@/lib/session";
import { cookies } from "next/headers";

async function getUser() {
  const session = (await cookies()).get("session")?.value;
  return decrypt(session);
}

function isBeforeMonthYear(recordMonth, recordYear, targetMonth, targetYear) {
  if (recordYear < targetYear) return true;
  if (recordYear > targetYear) return false;
  return recordMonth < targetMonth;
}

/** Units sold for COGS: net units plus customer returns (excludes logistics returns & cancellations). */
function unitsForCogs(record) {
  return (Number(record.netUnits) || 0) + (Number(record.customerReturns) || 0);
}

function resolveListing(listingsBySku, skuId, salesChannel) {
  const candidates = listingsBySku.get(skuId) || [];
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];

  const channelMatch = candidates.find(
    (l) => l.marketplace?.toLowerCase() === salesChannel?.toLowerCase()
  );
  return channelMatch || candidates[0];
}

function accumulateInventoryConsumption(records, listingsBySku, salesChannel, inventoryMap) {
  const warnings = [];

  for (const record of records) {
    const units = unitsForCogs(record);
    if (units <= 0) continue;

    const listing = resolveListing(listingsBySku, record.skuId, salesChannel || record.salesChannel);
    if (!listing?.inventoryItems?.length) {
      warnings.push(`No listing found for SKU ${record.skuId}`);
      continue;
    }

    for (const inventoryId of listing.inventoryItems) {
      inventoryMap.set(inventoryId, (inventoryMap.get(inventoryId) || 0) + units);
    }
  }

  return warnings;
}

export async function GET(request) {
  try {
    await connectToDatabase();

    const user = await getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get("month") || "", 10);
    const year = parseInt(searchParams.get("year") || "", 10);
    const salesChannel = searchParams.get("salesChannel") || "";

    if (!month || month < 1 || month > 12 || !year) {
      return NextResponse.json(
        { error: "Valid month (1–12) and year are required" },
        { status: 400 }
      );
    }

    if (!salesChannel) {
      return NextResponse.json(
        { error: "salesChannel is required" },
        { status: 400 }
      );
    }

    const channelFilter = salesChannel === "All" ? {} : { salesChannel };

    const [periodRecords, priorRecords, listings, purchases] = await Promise.all([
      SalesRecord.find({
        month,
        year,
        isArchived: false,
        ...channelFilter,
      }).lean(),
      SalesRecord.find({
        isArchived: false,
        $or: [
          { year: { $lt: year } },
          { year, month: { $lt: month } },
        ],
      }).lean(),
      Listing.find({}).lean(),
      Purchase.find({
        receivedOn: { $ne: null },
        isArchived: { $ne: true },
      }).lean(),
    ]);

    const listingsBySku = new Map();
    for (const listing of listings) {
      const existing = listingsBySku.get(listing.skuId) || [];
      existing.push(listing);
      listingsBySku.set(listing.skuId, existing);
    }

    const purchasesByInventory = new Map();
    for (const purchase of purchases) {
      const existing = purchasesByInventory.get(purchase.inventoryId) || [];
      existing.push(purchase);
      purchasesByInventory.set(purchase.inventoryId, existing);
    }

    const totalSales = periodRecords.reduce(
      (sum, r) => sum + (Number(r.projectedBankSettlement) || 0),
      0
    );

    const monthlyInventoryUnits = new Map();
    const priorInventoryUnits = new Map();
    const warnings = new Set();

    accumulateInventoryConsumption(
      periodRecords,
      listingsBySku,
      salesChannel,
      monthlyInventoryUnits
    ).forEach((w) => warnings.add(w));

    accumulateInventoryConsumption(
      priorRecords,
      listingsBySku,
      null,
      priorInventoryUnits
    ).forEach((w) => warnings.add(w));

    let totalBuyingPrice = 0;
    const inventoryBreakdown = [];

    for (const [inventoryId, monthUnits] of monthlyInventoryUnits) {
      const priorUnits = priorInventoryUnits.get(inventoryId) || 0;
      const invPurchases = purchasesByInventory.get(inventoryId) || [];
      const { cost, unitsCosted } = calculateFIFOCostForUnits(
        invPurchases,
        priorUnits,
        monthUnits
      );

      totalBuyingPrice += cost;

      if (unitsCosted < monthUnits) {
        warnings.add(
          `Insufficient purchase history for inventory ${inventoryId} (${unitsCosted}/${monthUnits} units costed)`
        );
      }

      inventoryBreakdown.push({
        inventoryId,
        units: monthUnits,
        priorUnits,
        buyingPrice: cost,
        unitsCosted,
      });
    }

    const skuBreakdown = periodRecords.map((record) => ({
      skuId: record.skuId,
      salesChannel: record.salesChannel,
      unitsSold: unitsForCogs(record),
      projectedBankSettlement: Number(record.projectedBankSettlement) || 0,
      netUnits: Number(record.netUnits) || 0,
      customerReturns: Number(record.customerReturns) || 0,
    }));

    totalBuyingPrice = Math.round(totalBuyingPrice * 100) / 100;
    const grossProfit = Math.round((totalSales - totalBuyingPrice) * 100) / 100;

    return NextResponse.json({
      success: true,
      filters: { month, year, salesChannel },
      totalSales: Math.round(totalSales * 100) / 100,
      totalBuyingPrice,
      grossProfit,
      skuCount: periodRecords.length,
      inventoryBreakdown,
      skuBreakdown,
      warnings: Array.from(warnings),
    });
  } catch (error) {
    console.error("P&L Summary GET error:", error);
    return NextResponse.json(
      { error: "Failed to calculate P&L summary" },
      { status: 500 }
    );
  }
}
