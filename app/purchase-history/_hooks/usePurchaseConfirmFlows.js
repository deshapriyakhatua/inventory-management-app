"use client";
import { toast } from "sonner";
import { useState, useRef } from "react";

// Archive / restore / permanent-delete (PIN) confirm modal flows.
export default function usePurchaseConfirmFlows({
  showArchived,
  setPurchases,
  setArchivedPurchases,
  fetchPurchases,
  fetchArchivedPurchases,
}) {
  // Archive Modal State
  const [archiveTarget, setArchiveTarget] = useState(null); // purchase object
  const [archiveInput, setArchiveInput] = useState("");
  const [isArchiving, setIsArchiving] = useState(false);
  const archiveInputRef = useRef(null);

  // Restore Modal State
  const [restoreTarget, setRestoreTarget] = useState(null); // purchase object
  const [restoreInput, setRestoreInput] = useState("");
  const [isRestoring, setIsRestoring] = useState(false);
  const restoreInputRef = useRef(null);

  // Delete Modal State (PIN)
  const [deleteTarget, setDeleteTarget] = useState(null); // archived purchase object
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const pinInputRef = useRef(null);

  // ── Archive flow ────────────────────────────────────────────────
  const openArchiveModal = (p) => {
    setArchiveTarget(p);
    setArchiveInput("");
    setTimeout(() => archiveInputRef.current?.focus(), 80);
  };

  const closeArchiveModal = () => {
    setArchiveTarget(null);
    setArchiveInput("");
  };

  const confirmArchive = async () => {
    if (archiveInput.trim().toLowerCase() !== "archive") return;
    setIsArchiving(true);
    try {
      const res = await fetch("/api/employee/purchase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: archiveTarget._id, action: "archive" }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(prev => prev.filter(p => p._id !== archiveTarget._id));
        if (showArchived) fetchArchivedPurchases();
        toast.success("Purchase archived successfully.", { id: "app-feedback", duration: 3000 });
        closeArchiveModal();
      } else {
        toast.error(result.error || "Failed to archive", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsArchiving(false);
    }
  };

  // ── Restore flow ────────────────────────────────────────────────
  const openRestoreModal = (p) => {
    setRestoreTarget(p);
    setRestoreInput("");
    setTimeout(() => restoreInputRef.current?.focus(), 80);
  };

  const closeRestoreModal = () => {
    setRestoreTarget(null);
    setRestoreInput("");
  };

  const confirmRestore = async () => {
    if (restoreInput.trim().toLowerCase() !== "restore") return;
    setIsRestoring(true);
    try {
      const res = await fetch("/api/employee/purchase", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _id: restoreTarget._id, action: "restore" }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(prev => prev.filter(p => p._id !== restoreTarget._id));
        fetchPurchases();
        toast.success("Purchase restored successfully.", { id: "app-feedback", duration: 3000 });
        closeRestoreModal();
      } else {
        toast.error(result.error || "Failed to restore", { id: "app-feedback", duration: 3000 });
      }
    } catch {
      toast.error("Network error. Try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setIsRestoring(false);
    }
  };

  // ── Permanent delete flow (PIN) ─────────────────────────────────
  const openDeleteModal = (p) => {
    setDeleteTarget(p);
    setPinInput("");
    setPinError("");
    setTimeout(() => pinInputRef.current?.focus(), 80);
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setPinInput("");
    setPinError("");
  };

  const confirmDelete = async () => {
    if (!pinInput) { setPinError("Please enter your PIN."); return; }
    setIsDeleting(true);
    setPinError("");
    try {
      const res = await fetch(
        `/api/employee/purchase?id=${deleteTarget._id}&pin=${encodeURIComponent(pinInput)}`,
        { method: "DELETE" }
      );
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(prev => prev.filter(p => p._id !== deleteTarget._id));
        toast.success("Purchase permanently deleted.", { id: "app-feedback", duration: 3000 });
        closeDeleteModal();
      } else {
        setPinError(result.error || "Failed to delete.");
      }
    } catch {
      setPinError("Network error. Try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Inline JSX handlers moved to named handlers (identical bodies) ──
  const handleArchiveInputChange = e => setArchiveInput(e.target.value);
  const handleArchiveKeyDown = e => e.key === "Enter" && archiveInput.trim().toLowerCase() === "archive" && confirmArchive();
  const handleRestoreInputChange = e => setRestoreInput(e.target.value);
  const handleRestoreKeyDown = e => e.key === "Enter" && restoreInput.trim().toLowerCase() === "restore" && confirmRestore();
  const handlePinInputChange = e => { setPinInput(e.target.value); setPinError(""); };
  const handlePinKeyDown = e => e.key === "Enter" && confirmDelete();

  return {
    archiveTarget,
    archiveInput,
    isArchiving,
    archiveInputRef,
    restoreTarget,
    restoreInput,
    isRestoring,
    restoreInputRef,
    deleteTarget,
    pinInput,
    pinError,
    isDeleting,
    pinInputRef,
    openArchiveModal,
    closeArchiveModal,
    confirmArchive,
    openRestoreModal,
    closeRestoreModal,
    confirmRestore,
    openDeleteModal,
    closeDeleteModal,
    confirmDelete,
    handleArchiveInputChange,
    handleArchiveKeyDown,
    handleRestoreInputChange,
    handleRestoreKeyDown,
    handlePinInputChange,
    handlePinKeyDown,
  };
}
