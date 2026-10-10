"use client";
import { toast } from "sonner";
import { useState } from "react";

// Owns the archive, restore and permanent-delete confirmation flows.
export default function useInventoryActions({ allInventoryData, setAllInventoryData, fetchInventory }) {
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
    const [itemToRestore, setItemToRestore] = useState(null);
    const [restoreButtonLoading, setRestoreButtonLoading] = useState(false);

    // Permanent Delete State
    const [showPermDeleteConfirm, setShowPermDeleteConfirm] = useState(false);
    const [itemToPermDelete, setItemToPermDelete] = useState(null);
    const [permDeleteLoading, setPermDeleteLoading] = useState(false);

    const handleDelete = (id) => {
        setItemToDelete(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;

        const id = itemToDelete;
        setDeletingItemId(id);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/inventory/add?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Inventory archived successfully.", { id: "app-feedback", duration: 3000 });
                // Update local data
                const updatedData = allInventoryData.filter(item => item._id !== id);
                setAllInventoryData(updatedData);
            } else {
                toast.error(result.error || "Failed to archive inventory.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
            setShowDeleteConfirm(false);
            setItemToDelete(null);
        }
    };

    const handleRestore = (id) => {
        setItemToRestore(id);
        setShowRestoreConfirm(true);
    };

    const confirmRestore = async () => {
        if (!itemToRestore) return;
        const id = itemToRestore;
        setRestoreButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/inventory/add`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id, action: "restore" })
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Inventory restored successfully.", { id: "app-feedback", duration: 3000 });
                fetchInventory(true);
            } else {
                toast.error(result.error || "Failed to restore inventory.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setRestoreButtonLoading(false);
            setShowRestoreConfirm(false);
            setItemToRestore(null);
        }
    };

    const handlePermanentDelete = (id) => {
        setItemToPermDelete(id);
        setShowPermDeleteConfirm(true);
    };

    const confirmPermanentDelete = async () => {
        if (!itemToPermDelete) return;
        setPermDeleteLoading(true);
        try {
            const res = await fetch(`/api/employee/inventory/add?id=${itemToPermDelete}&permanent=true`, {
                method: "DELETE",
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Inventory item permanently deleted.", { id: "app-feedback", duration: 3000 });
                const updatedData = allInventoryData.filter(item => item._id !== itemToPermDelete);
                setAllInventoryData(updatedData);
            } else {
                toast.error(result.error || "Failed to permanently delete item.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Permanent Delete Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setPermDeleteLoading(false);
            setShowPermDeleteConfirm(false);
            setItemToPermDelete(null);
        }
    };

    return {
        deleteButtonLoading,
        deletingItemId,
        showDeleteConfirm,
        setShowDeleteConfirm,
        showRestoreConfirm,
        setShowRestoreConfirm,
        restoreButtonLoading,
        showPermDeleteConfirm,
        setShowPermDeleteConfirm,
        permDeleteLoading,
        handleDelete,
        confirmDelete,
        handleRestore,
        confirmRestore,
        handlePermanentDelete,
        confirmPermanentDelete,
    };
}
