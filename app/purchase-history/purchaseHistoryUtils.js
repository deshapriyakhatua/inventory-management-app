// Pure helpers moved verbatim from page.js (no hooks, no state).

// ── Calculate item total cost ────────────────────────────────────
export const calculateTotal = (p) => {
  const qty = Number(p.quantity || 0);
  const price = Number(p.price || 0);
  const subtotal = qty * price;
  const taxAmount = (subtotal * Number(p.taxPercentage || 0)) / 100;
  return subtotal + Number(p.shippingFee || 0) + taxAmount;
};

// ── Calculate final unit price (including Shipping and Tax) ──────
export const calculateFinalUnitPrice = (p) => {
  const qty = Number(p.quantity || 0);
  if (qty <= 0) return 0;
  return calculateTotal(p) / qty;
};

// ── Grouping logic helper ────────────────────────────────────────
export const groupPurchases = (list) => {
  const map = {};

  list.forEach((p) => {
    const sellerIdStr = p.sellerId?._id || p.sellerId?.businessName || "unknown_seller";
    const sellerName = p.sellerId?.businessName || "Unknown Seller";
    const invoiceNo = (p.invoiceNo && p.invoiceNo.trim()) ? p.invoiceNo.trim() : "No Invoice";
    const groupKey = `${sellerIdStr}_${invoiceNo.toLowerCase()}`;

    if (!map[groupKey]) {
      map[groupKey] = {
        groupKey,
        sellerIdStr,
        sellerName,
        invoiceNo,
        items: [],
        totalQuantity: 0,
        totalSubtotal: 0,
        totalShipping: 0,
        totalTax: 0,
        totalAmount: 0,
        orderedOn: p.orderedOn,
        deliveredCount: 0,
      };
    }

    const grp = map[groupKey];
    grp.items.push(p);

    const qty = Number(p.quantity || 0);
    const price = Number(p.price || 0);
    const subtotal = qty * price;
    const shipping = Number(p.shippingFee || 0);
    const tax = (subtotal * Number(p.taxPercentage || 0)) / 100;
    const itemTotal = subtotal + shipping + tax;

    grp.totalQuantity += qty;
    grp.totalSubtotal += subtotal;
    grp.totalShipping += shipping;
    grp.totalTax += tax;
    grp.totalAmount += itemTotal;

    if (p.receivedOn) {
      grp.deliveredCount += 1;
    }

    if (new Date(p.orderedOn || 0) > new Date(grp.orderedOn || 0)) {
      grp.orderedOn = p.orderedOn;
    }
  });

  return Object.values(map).map((grp) => {
    let groupStatus = "In-Transit";
    if (grp.deliveredCount === grp.items.length) {
      groupStatus = "Delivered";
    } else if (grp.deliveredCount > 0) {
      groupStatus = `Partial (${grp.deliveredCount}/${grp.items.length})`;
    }
    return {
      ...grp,
      groupStatus,
      itemCount: grp.items.length
    };
  });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

export const toInputDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
};
