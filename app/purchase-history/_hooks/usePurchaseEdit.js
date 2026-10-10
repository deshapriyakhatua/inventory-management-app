"use client";
import { toast } from "sonner";
import { useState } from "react";
import { toInputDate } from "@/app/purchase-history/purchaseHistoryUtils";

// Edit purchase modal: open/close, field changes and save.
export default function usePurchaseEdit({ setPurchases }) {
  // Edit Modal State
  const [isEditing, setIsEditing] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // ── Edit modal controls ──────────────────────────────────────────
  const openEditModal = (p) => {
    setEditingData({
      _id: p._id,
      quantity: p.quantity,
      price: p.price,
      shippingFee: p.shippingFee || 0,
      taxPercentage: p.taxPercentage || 0,
      invoiceNo: p.invoiceNo || "",
      orderedOn: toInputDate(p.orderedOn),
      receivedOn: toInputDate(p.receivedOn),
    });
    setIsEditing(true);
  };

  const closeEditModal = () => { setIsEditing(false); setEditingData(null); };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditingData(prev => ({ ...prev, [name]: value }));
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const payload = { ...editingData };
      if (!payload.receivedOn) payload.receivedOn = null;
      const res = await fetch("/api/employee/purchase", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(prev => prev.map(p => p._id === result.data._id ? result.data : p));
        toast.success("Purchase updated successfully!", { id: "app-feedback", duration: 3000 });
        closeEditModal();
      } else {
        toast.error(result.error || "Failed to update purchase", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error saving purchase", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsSaving(false);
    }
  };

  return { isEditing, editingData, isSaving, openEditModal, closeEditModal, handleEditChange, saveEdit };
}
