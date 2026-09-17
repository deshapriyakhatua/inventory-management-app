/**
 * Calculates payment status automatically based on grand total and received amount.
 * If status is manually set to "Cancelled", it remains "Cancelled".
 * 
 * @param {number} grandTotal 
 * @param {number} receivedAmount 
 * @param {string} [currentStatus] 
 * @returns {string} "Pending" | "Paid" | "Partially Paid" | "Cancelled"
 */
export function calculatePaymentStatus(grandTotal, receivedAmount, currentStatus) {
  if (currentStatus === "Cancelled") {
    return "Cancelled";
  }

  const total = Math.round((Number(grandTotal) || 0) * 100) / 100;
  const received = Math.round((Number(receivedAmount) || 0) * 100) / 100;

  if (total <= 0 && received <= 0) {
    return "Pending";
  }

  if (received >= total) {
    return "Paid";
  }

  if (received > 0) {
    return "Partially Paid";
  }

  return "Pending";
}
