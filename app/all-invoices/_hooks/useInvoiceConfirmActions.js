"use client";

import { useState } from "react";
import { toast } from "sonner";

// Archive / restore / permanent-delete via the shared confirm modal.
export default function useInvoiceConfirmActions({ fetchInvoices }) {
  // Custom Confirm Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: null,
    isLoading: false,
  });

  // Archive invoice (soft delete)
  const handleArchive = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Archive Invoice",
      message: `Archive invoice ${invNum || ""}? You can view or restore it anytime from Archived Invoices.`,
      confirmLabel: "Archive Invoice",
      variant: "warning",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice?id=${id}`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice archived successfully");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to archive invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error archiving invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Restore invoice (unarchive)
  const handleRestore = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Restore Invoice",
      message: `Restore invoice ${invNum || ""} back to Active Invoices?`,
      confirmLabel: "Restore Invoice",
      variant: "info",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ _id: id, isArchived: false }),
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice restored to active invoices!");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to restore invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error restoring invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  // Delete invoice permanently
  const handlePermanentDelete = (id, invNum) => {
    setConfirmModal({
      isOpen: true,
      title: "Permanently Delete Invoice",
      message: `Are you sure you want to PERMANENTLY delete invoice ${invNum || ""}? This action CANNOT be undone.`,
      confirmLabel: "Delete Permanently",
      variant: "danger",
      isLoading: false,
      onConfirm: async () => {
        setConfirmModal((prev) => ({ ...prev, isLoading: true }));
        try {
          const res = await fetch(`/api/employee/b2b-invoice?id=${id}&permanent=true`, {
            method: "DELETE",
          });
          const data = await res.json();
          if (res.ok) {
            toast.success("Invoice permanently deleted");
            fetchInvoices();
            setConfirmModal((prev) => ({ ...prev, isOpen: false }));
          } else {
            toast.error(data.error || "Failed to delete invoice");
          }
        } catch (err) {
          console.error(err);
          toast.error("Error deleting invoice");
        } finally {
          setConfirmModal((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  return { confirmModal, setConfirmModal, handleArchive, handleRestore, handlePermanentDelete };
}
