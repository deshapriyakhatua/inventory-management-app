"use client";
import { useState, useEffect } from "react";

import { calculatePaymentStatus } from "@/lib/paymentStatus";

// Invoice form state, derived totals, PDF payload and simple field handlers
export default function useInvoiceForm() {
  const [activeTab, setActiveTab] = useState("form"); // "form" | "preview"

  // Form State
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(
    new Date().toISOString().split("T")[0] // YYYY-MM-DD format for HTML <input type="date">
  );
  const [placeOfSupply, setPlaceOfSupply] = useState("19-West Bengal");
  const [paymentStatus, setPaymentStatus] = useState("Pending");

  // Seller Details (Pre-filled matching sample invoice)
  const [sellerDetails, setSellerDetails] = useState({
    businessName: "CRAZYKUDI",
    address: "75/2 Ground Floor, B.T. Road, Kolkata - 90, West Bengal",
    state: "19-West Bengal",
    gstNo: "19JHWPK2955Q1ZW",
    bankName: "Slice Small Finance Bank",
    accountNo: "033311501063323",
    ifscCode: "NESF0000333",
    accountHolderName: "CRAZYKUDI",
    upiId: "s6037472980259754@slc",
  });

  // Buyer Details
  const [buyerDetails, setBuyerDetails] = useState({
    businessName: "",
    phoneNo: "",
    address: "",
    gstNo: "NA",
    state: "",
  });

  // Line Items
  const [lineItems, setLineItems] = useState([
    {
      inventoryId: "",
      description: "",
      hsnCode: "7117",
      quantity: 0,
      unitPrice: 0,
      gstRate: 3,
    },
  ]);

  // Overall Financials
  const [shippingFee, setShippingFee] = useState(150);
  const [discount, setDiscount] = useState(0);
  const [receivedAmount, setReceivedAmount] = useState(0);
  const [showQrCode, setShowQrCode] = useState(false);
  const [notes, setNotes] = useState(
    "All goods checked before dispatch.\nGoods once sold will not taken back.\nOpening video is must for any claims. We are not responsible for any damages once goods leave our premises. Any dispute will be subject to Barrackpore jurisdiction only."
  );

  // Detailed Row & Summary Calculations
  const calculatedRows = lineItems.map((item) => {
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const rate = Number(item.gstRate !== undefined ? item.gstRate : item.taxRate) || 0;

    const subTotal = qty * price;
    const gstAmt = (subTotal * rate) / 100;
    const total = subTotal + gstAmt;

    return {
      ...item,
      subTotal,
      gstAmt,
      total,
    };
  });

  const subtotal = calculatedRows.reduce((sum, item) => sum + item.subTotal, 0);
  const totalGst = calculatedRows.reduce((sum, item) => sum + item.gstAmt, 0);
  const grandTotal =
    subtotal + totalGst + Number(shippingFee || 0) - Number(discount || 0);
  const balanceAmount = grandTotal - Number(receivedAmount || 0);
  const autoPaymentStatus = calculatePaymentStatus(grandTotal, receivedAmount);

  // Synchronize payment status with balance changes automatically (unless manually Cancelled)
  useEffect(() => {
    if (paymentStatus !== "Cancelled") {
      const autoSt = calculatePaymentStatus(grandTotal, receivedAmount);
      if (paymentStatus !== autoSt) {
        // Moved verbatim from page.js (T-6.6); original sync logic kept as-is
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setPaymentStatus(autoSt);
      }
    }
  }, [grandTotal, receivedAmount, paymentStatus]);

  // Payload for PDF Component
  const invoiceDataForPdf = {
    invoiceNumber,
    invoiceDate,
    placeOfSupply,
    sellerDetails,
    buyerDetails,
    lineItems: calculatedRows.map((r) => ({
      ...r,
      taxRate: r.gstRate,
      amount: r.subTotal,
      taxAmount: r.gstAmt,
      totalAmount: r.total,
    })),
    subtotal,
    totalTax: totalGst,
    shippingFee,
    discount,
    grandTotal,
    receivedAmount,
    balanceAmount,
    notes,
    showQrCode,
  };

  // Inline JSX handlers moved out of the markup (bodies unchanged)
  const handleShowFormTab = () => setActiveTab("form");
  const handleShowPreviewTab = () => setActiveTab("preview");
  const handleShowQrCodeChange = (e) => setShowQrCode(e.target.checked);
  const handleInvoiceNumberChange = (e) => setInvoiceNumber(e.target.value.toUpperCase());
  const handleInvoiceDateChange = (e) => setInvoiceDate(e.target.value);
  const handlePlaceOfSupplyChange = (e) => {
    const selectedState = e.target.value;
    setPlaceOfSupply(selectedState);
    setBuyerDetails((prev) => ({
      ...prev,
      state: selectedState,
    }));
  };
  const handlePaymentStatusChange = (e) => {
    const val = e.target.value;
    if (val === "Cancelled") {
      setPaymentStatus("Cancelled");
    } else {
      setPaymentStatus(calculatePaymentStatus(grandTotal, receivedAmount));
    }
  };
  const handleBuyerFieldChange = (field, value) =>
    setBuyerDetails({ ...buyerDetails, [field]: value });
  const handleSellerFieldChange = (field, value) =>
    setSellerDetails({ ...sellerDetails, [field]: value });
  const handleShippingFeeChange = (e) => setShippingFee(e.target.value);
  const handleDiscountChange = (e) => setDiscount(e.target.value);
  const handleReceivedAmountChange = (e) => setReceivedAmount(e.target.value);
  const handleNotesChange = (e) => setNotes(e.target.value);

  return {
    activeTab,
    setActiveTab,
    invoiceNumber,
    setInvoiceNumber,
    invoiceDate,
    placeOfSupply,
    paymentStatus,
    sellerDetails,
    setSellerDetails,
    buyerDetails,
    lineItems,
    setLineItems,
    shippingFee,
    discount,
    receivedAmount,
    showQrCode,
    notes,
    setNotes,
    calculatedRows,
    subtotal,
    totalGst,
    grandTotal,
    balanceAmount,
    autoPaymentStatus,
    invoiceDataForPdf,
    handleShowFormTab,
    handleShowPreviewTab,
    handleShowQrCodeChange,
    handleInvoiceNumberChange,
    handleInvoiceDateChange,
    handlePlaceOfSupplyChange,
    handlePaymentStatusChange,
    handleBuyerFieldChange,
    handleSellerFieldChange,
    handleShippingFeeChange,
    handleDiscountChange,
    handleReceivedAmountChange,
    handleNotesChange,
  };
}
