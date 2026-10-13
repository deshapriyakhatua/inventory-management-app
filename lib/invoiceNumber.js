import B2BInvoice from "@/models/B2BInvoice";

export const INVOICE_START_NUMBER = 9735;
export const INVOICE_PREFIX = "CZ-A";

/**
 * Returns the lowest unused / deleted invoice number starting from CZ-A9735.
 * Fills any gap caused by deleted invoices first, and increments beyond the max if no gaps exist.
 */
export async function getNextAvailableInvoiceNumber() {
  const invoices = await B2BInvoice.find({})
    .select("invoiceNumber")
    .lean();

  const usedNumbers = new Set();
  const regex = /^CZ-A?(\d+)$/i;

  for (const inv of invoices) {
    if (!inv.invoiceNumber) continue;
    const match = inv.invoiceNumber.trim().match(regex);
    if (match) {
      usedNumbers.add(parseInt(match[1], 10));
    }
  }

  let num = INVOICE_START_NUMBER;
  while (usedNumbers.has(num)) {
    num++;
  }

  return `${INVOICE_PREFIX}${String(num).padStart(4, "0")}`;
}
