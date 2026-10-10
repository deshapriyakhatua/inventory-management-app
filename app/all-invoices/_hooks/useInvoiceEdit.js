"use client";

import { useState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

import { calculatePaymentStatus } from "@/lib/paymentStatus";

// Edit invoice modal: open, line items, field handlers, auto totals/status, save.
export default function useInvoiceEdit({ fetchInvoices }) {
  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Open Edit Modal
  const handleOpenEdit = (inv) => {
    const copy = JSON.parse(JSON.stringify(inv));
    if (copy.invoiceDate) {
      copy.invoiceDate = new Date(copy.invoiceDate).toISOString().split("T")[0];
    }
    setEditingInvoice(copy);
    setShowEditModal(true);
  };

  // Edit Modal Item Handlers
  const handleEditLineItemChange = (index, field, value) => {
    if (!editingInvoice) return;
    const updatedItems = [...editingInvoice.lineItems];
    const item = { ...updatedItems[index], [field]: value };

    // Recalculate row amounts
    const qty = Number(item.quantity) || 0;
    const price = Number(item.unitPrice) || 0;
    const gstRate = Number(item.taxRate) || 0;

    const amount = qty * price;
    const taxAmount = (amount * gstRate) / 100;
    const totalAmount = amount + taxAmount;

    updatedItems[index] = { ...item, amount, taxAmount, totalAmount };

    setEditingInvoice({
      ...editingInvoice,
      lineItems: updatedItems,
    });
  };

  const addEditLineItem = () => {
    if (!editingInvoice) return;
    setEditingInvoice({
      ...editingInvoice,
      lineItems: [
        ...editingInvoice.lineItems,
        {
          inventoryId: "",
          description: "New Item",
          hsnCode: "7117",
          quantity: 1,
          unitPrice: 0,
          taxRate: 3,
          amount: 0,
          taxAmount: 0,
          totalAmount: 0,
        },
      ],
    });
  };

  const removeEditLineItem = (index) => {
    if (!editingInvoice || editingInvoice.lineItems.length === 1) {
      toast.error("Invoice must have at least one line item");
      return;
    }
    const updated = editingInvoice.lineItems.filter((_, i) => i !== index);
    setEditingInvoice({
      ...editingInvoice,
      lineItems: updated,
    });
  };

  // Save Edit Submission
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingInvoice) return;

    setIsSavingEdit(true);

    // Recalculate totals
    const subtotal = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    );
    const totalTax = editingInvoice.lineItems.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    );
    const grandTotal =
      subtotal +
      totalTax +
      Number(editingInvoice.shippingFee || 0) -
      Number(editingInvoice.discount || 0);
    const balanceAmount =
      grandTotal - Number(editingInvoice.receivedAmount || 0);

    const paymentStatus =
      editingInvoice.paymentStatus === "Cancelled"
        ? "Cancelled"
        : calculatePaymentStatus(grandTotal, editingInvoice.receivedAmount);

    const payload = {
      ...editingInvoice,
      subtotal,
      totalTax,
      grandTotal,
      balanceAmount,
      paymentStatus,
    };

    try {
      const res = await fetch("/api/employee/b2b-invoice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Invoice updated successfully!");
        setShowEditModal(false);
        setEditingInvoice(null);
        fetchInvoices();
      } else {
        toast.error(data.error || "Failed to update invoice");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while updating invoice");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Edit Modal Auto Calculations
  const modalSubtotal =
    editingInvoice?.lineItems?.reduce(
      (sum, item) => sum + (Number(item.amount) || 0),
      0
    ) || 0;

  const modalTotalTax =
    editingInvoice?.lineItems?.reduce(
      (sum, item) => sum + (Number(item.taxAmount) || 0),
      0
    ) || 0;

  const modalGrandTotal =
    modalSubtotal +
    modalTotalTax +
    Number(editingInvoice?.shippingFee || 0) -
    Number(editingInvoice?.discount || 0);

  const modalReceived = Number(editingInvoice?.receivedAmount || 0);

  const modalAutoStatus = calculatePaymentStatus(modalGrandTotal, modalReceived);

  // Effect event reads the latest editingInvoice while keeping the original trigger deps.
  const onModalTotalsChange = useEffectEvent(() => {
    if (editingInvoice && editingInvoice.paymentStatus !== "Cancelled") {
      const autoSt = calculatePaymentStatus(modalGrandTotal, modalReceived);
      if (editingInvoice.paymentStatus !== autoSt) {
        setEditingInvoice((prev) => (prev ? { ...prev, paymentStatus: autoSt } : null));
      }
    }
  });
  useEffect(() => { onModalTotalsChange(); }, [modalGrandTotal, modalReceived, editingInvoice?.paymentStatus]);

  const handleCloseEditModal = () => setShowEditModal(false);

  // Edit modal field handlers
  const handleEditInvoiceNumberChange = (e) =>
    setEditingInvoice({ ...editingInvoice, invoiceNumber: e.target.value.toUpperCase() });
  const handleEditInvoiceDateChange = (e) =>
    setEditingInvoice({ ...editingInvoice, invoiceDate: e.target.value });
  const handleEditPlaceOfSupplyChange = (e) =>
    setEditingInvoice({ ...editingInvoice, placeOfSupply: e.target.value });
  const handleEditPaymentStatusChange = (e) => {
    const val = e.target.value;
    if (val === "Cancelled") {
      setEditingInvoice({
        ...editingInvoice,
        paymentStatus: "Cancelled",
      });
    } else {
      setEditingInvoice({
        ...editingInvoice,
        paymentStatus: calculatePaymentStatus(modalGrandTotal, modalReceived),
      });
    }
  };
  // Shared by the five buyer inputs (businessName, phoneNo, gstNo, address, state)
  const handleEditBuyerFieldChange = (field, value) =>
    setEditingInvoice({
      ...editingInvoice,
      buyerDetails: {
        ...editingInvoice.buyerDetails,
        [field]: value,
      },
    });
  const handleEditUpiIdChange = (e) =>
    setEditingInvoice({
      ...editingInvoice,
      sellerDetails: {
        ...editingInvoice.sellerDetails,
        upiId: e.target.value,
      },
    });
  const handleEditShippingFeeChange = (e) =>
    setEditingInvoice({ ...editingInvoice, shippingFee: Number(e.target.value) });
  const handleEditDiscountChange = (e) =>
    setEditingInvoice({ ...editingInvoice, discount: Number(e.target.value) });
  const handleEditReceivedAmountChange = (e) =>
    setEditingInvoice({ ...editingInvoice, receivedAmount: Number(e.target.value) });

  return {
    showEditModal,
    editingInvoice,
    isSavingEdit,
    modalAutoStatus,
    handleOpenEdit,
    handleEditLineItemChange,
    addEditLineItem,
    removeEditLineItem,
    handleSaveEdit,
    handleCloseEditModal,
    fieldHandlers: {
      onInvoiceNumberChange: handleEditInvoiceNumberChange,
      onInvoiceDateChange: handleEditInvoiceDateChange,
      onPlaceOfSupplyChange: handleEditPlaceOfSupplyChange,
      onPaymentStatusChange: handleEditPaymentStatusChange,
      onBuyerFieldChange: handleEditBuyerFieldChange,
      onUpiIdChange: handleEditUpiIdChange,
      onShippingFeeChange: handleEditShippingFeeChange,
      onDiscountChange: handleEditDiscountChange,
      onReceivedAmountChange: handleEditReceivedAmountChange,
    },
  };
}
