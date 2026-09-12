"use client";

import React, { forwardRef } from "react";
import styles from "./InvoicePdfPreview.module.css";

function formatDateGB(dateStr) {
  if (!dateStr) return "";
  if (typeof dateStr === "string" && dateStr.includes("-")) {
    const parts = dateStr.split("T")[0].split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
  }
  return new Date(dateStr).toLocaleDateString("en-GB");
}

const InvoicePdfPreview = forwardRef(({ invoice, showQrCode = true }, ref) => {
  if (!invoice) return null;

  const {
    invoiceNumber = "",
    invoiceDate = "",
    placeOfSupply = "19-West Bengal",
    sellerDetails = {},
    buyerDetails = {},
    lineItems = [],
    subtotal = 0,
    totalTax = 0,
    shippingFee = 0,
    discount = 0,
    grandTotal = 0,
    receivedAmount = 0,
    balanceAmount,
    notes = "",
    showQrCode: invoiceShowQrCode,
  } = invoice;

  const displayQrCode = invoiceShowQrCode !== undefined ? invoiceShowQrCode : showQrCode;

  const calculatedRows = lineItems.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rate = Number(item.taxRate !== undefined ? item.taxRate : item.gstRate) || 0;

    const subTotal = item.amount !== undefined ? Number(item.amount) : qty * price;
    const gstAmt = item.taxAmount !== undefined ? Number(item.taxAmount) : (subTotal * rate) / 100;
    const total = item.totalAmount !== undefined ? Number(item.totalAmount) : subTotal + gstAmt;

    return {
      description: item.description || "",
      hsnCode: item.hsnCode || "7117",
      quantity: qty,
      unitPrice: price,
      gstRate: rate,
      subTotal,
      gstAmt,
      total,
    };
  });

  const totalQty = calculatedRows.reduce((sum, item) => sum + item.quantity, 0);
  const totalSubtotal = calculatedRows.reduce((sum, item) => sum + item.subTotal, 0);
  const totalGstAmt = calculatedRows.reduce((sum, item) => sum + item.gstAmt, 0);
  const totalItemAmount = calculatedRows.reduce((sum, item) => sum + item.total, 0);

  const displaySubtotal = Number(subtotal) || totalSubtotal;
  const displayTotalTax = totalTax !== undefined ? Number(totalTax) : totalGstAmt;
  const displayGrandTotal = Number(grandTotal) || (displaySubtotal + displayTotalTax + Number(shippingFee || 0) - Number(discount || 0));

  // Dynamic balance calculation: Grand Total - Received Amount
  const displayReceived = Number(receivedAmount) || 0;
  const displayBalance =
    balanceAmount !== undefined && balanceAmount !== null && balanceAmount !== 0
      ? Number(balanceAmount)
      : Math.max(0, displayGrandTotal - displayReceived);

  const companyName = sellerDetails.businessName || "CRAZYKUDI";
  const companyAddress = sellerDetails.address || "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal";
  const companyState = sellerDetails.state || "19-West Bengal";
  const companyGst = sellerDetails.gstNo || "19JHWPK2955Q1ZW";
  const bankName = sellerDetails.bankName || "Slice Small Finance Bank";
  const accountNo = sellerDetails.accountNo || "033311501063323";
  const ifscCode = sellerDetails.ifscCode || "NESF0000333";
  const accountHolderName = sellerDetails.accountHolderName || sellerDetails.businessName || "CRAZYKUDI";
  const upiId = sellerDetails.upiId || `${accountNo}@slice`;

  const defaultNotes =
    "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only.";

  return (
    <div className={styles.pdfWrapper}>
      <div ref={ref} className={styles.pdfPreviewCard}>
        {/* Header */}
        <div className={styles.sampleInvoiceHeader}>
          <div>
            <h1 className={styles.sellerCompanyTitle}>{companyName}</h1>
            <div className={styles.sellerCompanyAddress}>
              <div>{companyAddress}</div>
              {companyState && <div>State: {companyState}</div>}
              <div>GSTIN - {companyGst}</div>
            </div>
          </div>

          <div className={styles.invoiceTitleRight}>
            <div className={styles.invoiceWordTitle}>INVOICE</div>
            <table className={styles.metaTableRight}>
              <tbody>
                <tr>
                  <td className={styles.metaLabel}>Invoice No:</td>
                  <td className={styles.metaValue}>{invoiceNumber}</td>
                </tr>
                <tr>
                  <td className={styles.metaLabel}>Date</td>
                  <td>{formatDateGB(invoiceDate)}</td>
                </tr>
                <tr>
                  <td className={styles.metaLabel}>Place of Supply</td>
                  <td>{placeOfSupply}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Customer Section */}
        <div className={styles.issuedToSection}>
          <div className={styles.issuedToTitle}>Issued to:</div>
          <div className={styles.customerName}>
            {buyerDetails.businessName || "Customer Name"}
          </div>
          {buyerDetails.phoneNo && (
            <div style={{ fontSize: "12px", color: "#1f2937", marginBottom: "2px" }}>
              <strong>Contact No:</strong> {buyerDetails.phoneNo}
            </div>
          )}
          {buyerDetails.address && (
            <div className={styles.customerAddress}>{buyerDetails.address}</div>
          )}
          <div className={styles.customerGstState}>
            <div>GSTIN Number: {buyerDetails.gstNo || "NA"}</div>
            <div>State: {buyerDetails.state || "19-West Bengal"}</div>
          </div>
        </div>

        {/* Items Table */}
        <table className={styles.sampleTable}>
          <thead>
            <tr>
              <th style={{ width: "26%" }}>Description</th>
              <th className={styles.alignCenter} style={{ width: "10%" }}>
                HSN/SAC
              </th>
              <th className={styles.alignCenter} style={{ width: "6%" }}>
                Qty
              </th>
              <th className={styles.alignRight} style={{ width: "12%" }}>
                Unit price
              </th>
              <th className={styles.alignRight} style={{ width: "12%" }}>
                Sub Total
              </th>
              <th className={styles.alignCenter} style={{ width: "8%" }}>
                GST
              </th>
              <th className={styles.alignRight} style={{ width: "11%" }}>
                GST
              </th>
              <th className={styles.alignRight} style={{ width: "15%" }}>
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {calculatedRows.map((row, idx) => (
              <tr key={idx} className={idx % 2 === 0 ? styles.rowZebra : ""}>
                <td style={{ fontWeight: "600" }}>{row.description}</td>
                <td className={styles.alignCenter}>{row.hsnCode}</td>
                <td className={styles.alignCenter}>{row.quantity}</td>
                <td className={styles.alignRight}>{row.unitPrice.toFixed(2)}</td>
                <td className={styles.alignRight}>{row.subTotal.toFixed(2)}</td>
                <td className={styles.alignCenter}>{row.gstRate}%</td>
                <td className={styles.alignRight}>{row.gstAmt.toFixed(2)}</td>
                <td className={styles.alignRight}>{row.total.toFixed(2)}</td>
              </tr>
            ))}
            {/* Total Row */}
            <tr className={styles.totalRowTd}>
              <td>Total</td>
              <td></td>
              <td className={styles.alignCenter}>{totalQty}</td>
              <td></td>
              <td className={styles.alignRight}>
                {displaySubtotal.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
              <td></td>
              <td className={styles.alignRight}>{displayTotalTax.toFixed(2)}</td>
              <td className={styles.alignRight}>
                {totalItemAmount.toLocaleString("en-IN", {
                  minimumFractionDigits: 2,
                })}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Bottom Totals & Notes Grid */}
        <div className={styles.sampleTotalsGrid}>
          <div className={styles.leftNotesPaymentCol}>
            <div className={styles.notesBox}>
              <span className={styles.notesTitle}>Notes : </span>
              {notes || defaultNotes}
            </div>

            <div className={styles.paymentInfoBox}>
              <div className={styles.paymentInfoTitle}>Payment Info:</div>
              <div>Bank Name : {bankName}</div>
              <div>Bank Account No. : {accountNo}</div>
              <div>IFSC code : {ifscCode}</div>
              <div>Account Holder's Name : {accountHolderName}</div>
              {upiId && <div>UPI ID : {upiId}</div>}
            </div>
          </div>

          <div className={styles.rightTotalsCol}>
            <div className={styles.totalsList}>
              <div className={styles.totalRowItem}>
                <span>Subtotal</span>
                <span>
                  ₹
                  {displaySubtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={styles.totalRowItem}>
                <span>GST</span>
                <span>₹{displayTotalTax.toFixed(2)}</span>
              </div>

              <div className={styles.totalRowItem}>
                <span>Shipping</span>
                <span>
                  ₹
                  {Number(shippingFee).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={styles.totalRowItem}>
                <span>Discount</span>
                <span>
                  ₹
                  {Number(discount).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={`${styles.totalRowItem} ${styles.grandTotalRowItem}`}>
                <span>Total</span>
                <span>
                  ₹
                  {displayGrandTotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={styles.totalRowItem}>
                <span>Received</span>
                <span>
                  ₹
                  {displayReceived.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className={`${styles.totalRowItem} ${styles.balanceRowItem}`}>
                <span>Balance</span>
                <span>
                  ₹
                  {displayBalance.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scan & Pay QR Card Section (Independent Block) */}
        {displayQrCode && (
          <div className={styles.sampleQrGrid}>
            <div className={styles.qrCard}>
              <div className={styles.qrTitle}>Scan & pay</div>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
                  `upi://pay?pa=${upiId}&pn=${accountHolderName}&am=${displayBalance}`
                )}`}
                alt="Scan & Pay QR"
                className={styles.qrImage}
              />
              <div className={styles.qrPoweredBy}>Powered by slice UPI</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

InvoicePdfPreview.displayName = "InvoicePdfPreview";

export default InvoicePdfPreview;
