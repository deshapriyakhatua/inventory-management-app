/**
 * FIFO Inventory Price Calculator
 *
 * Calculates the true cost of each purchase (including shippingFee & tax),
 * then applies First-In-First-Out logic to determine the remaining
 * inventory value after units have been consumed (sold, dispatched, damaged).
 *
 * @param {Array<Object>} purchases - Purchase documents (must include:
 *   quantity, price, shippingFee, taxPercentage, receivedOn)
 * @param {number} consumedUnits - Total units consumed (netSold + dispatched + damaged)
 * @returns {{ totalPurchaseCost: number, remainingInventoryValue: number, consumedCost: number, fifoUnitCost: number, currentStock: number }}
 */
export function calculateFIFO(purchases, consumedUnits) {
  if (!purchases || purchases.length === 0) {
    return {
      totalPurchaseCost: 0,
      remainingInventoryValue: 0,
      consumedCost: 0,
      fifoUnitCost: 0,
      currentStock: 0,
    };
  }

  // 1. Compute the full cost for each purchase and sort by receivedOn (oldest first)
  const enriched = purchases
    .map((p) => {
      const qty = p.quantity || 0;
      const unitPrice = p.price || 0;
      const shipping = p.shippingFee || 0;
      const taxPct = p.taxPercentage || 0;

      const baseCost = qty * unitPrice;
      const tax = (taxPct / 100) * baseCost;
      const totalCost = baseCost + tax + shipping;
      const costPerUnit = qty > 0 ? totalCost / qty : 0;

      return {
        quantity: qty,
        costPerUnit,
        totalCost,
        receivedOn: p.receivedOn ? new Date(p.receivedOn) : new Date(0),
      };
    })
    .sort((a, b) => a.receivedOn - b.receivedOn); // oldest first

  // 2. Calculate total purchase cost (all purchases)
  const totalPurchaseCost = enriched.reduce((sum, p) => sum + p.totalCost, 0);
  const totalUnits = enriched.reduce((sum, p) => sum + p.quantity, 0);

  // 3. FIFO: consume units from oldest purchases first
  let remaining = Math.max(0, consumedUnits);
  let consumedCost = 0;

  for (const p of enriched) {
    if (remaining <= 0) break;

    const take = Math.min(remaining, p.quantity);
    consumedCost += take * p.costPerUnit;
    remaining -= take;
  }

  // 4. Remaining inventory value
  const remainingInventoryValue = totalPurchaseCost - consumedCost;
  const currentStock = Math.max(0, totalUnits - consumedUnits);
  const fifoUnitCost = currentStock > 0
    ? Math.ceil(remainingInventoryValue / currentStock)
    : 0;

  return {
    totalPurchaseCost: Math.round(totalPurchaseCost * 100) / 100,
    remainingInventoryValue: Math.round(remainingInventoryValue * 100) / 100,
    consumedCost: Math.round(consumedCost * 100) / 100,
    fifoUnitCost,
    currentStock,
  };
}

function enrichPurchases(purchases) {
  return purchases
    .map((p) => {
      const qty = p.quantity || 0;
      const unitPrice = p.price || 0;
      const shipping = p.shippingFee || 0;
      const taxPct = p.taxPercentage || 0;

      const baseCost = qty * unitPrice;
      const tax = (taxPct / 100) * baseCost;
      const totalCost = baseCost + tax + shipping;
      const costPerUnit = qty > 0 ? totalCost / qty : 0;

      return {
        quantity: qty,
        costPerUnit,
        totalCost,
        receivedOn: p.receivedOn ? new Date(p.receivedOn) : new Date(0),
      };
    })
    .sort((a, b) => a.receivedOn - b.receivedOn);
}

/**
 * FIFO cost for a specific number of units, after skipping units already consumed earlier.
 *
 * @param {Array<Object>} purchases
 * @param {number} priorConsumedUnits - Units already consumed before this period
 * @param {number} unitsToCost - Units to assign cost in this period
 * @returns {{ cost: number, unitsCosted: number }}
 */
export function calculateFIFOCostForUnits(purchases, priorConsumedUnits, unitsToCost) {
  if (!purchases?.length || unitsToCost <= 0) {
    return { cost: 0, unitsCosted: 0 };
  }

  const enriched = enrichPurchases(purchases);
  let skip = Math.max(0, priorConsumedUnits);
  let remaining = unitsToCost;
  let cost = 0;

  for (const batch of enriched) {
    if (remaining <= 0) break;

    let available = batch.quantity;

    if (skip > 0) {
      const skipped = Math.min(skip, available);
      skip -= skipped;
      available -= skipped;
    }

    if (available <= 0) continue;

    const take = Math.min(remaining, available);
    cost += take * batch.costPerUnit;
    remaining -= take;
  }

  return {
    cost: Math.round(cost * 100) / 100,
    unitsCosted: unitsToCost - remaining,
  };
}
