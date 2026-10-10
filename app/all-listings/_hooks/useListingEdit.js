"use client";
import { toast } from "sonner";
import { useState } from "react";

// Owns the edit-listing modal flow, including the inventory picker.
export default function useListingEdit({ allListingsData, setAllListingsData }) {
    // Edit Modal State
    const [editingListing, setEditingListing] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [editSaving, setEditSaving] = useState(false);

    // Inventory Picker State
    const [showInventoryPicker, setShowInventoryPicker] = useState(false);
    const [inventoryPickerItems, setInventoryPickerItems] = useState([]);
    const [inventoryPickerLoading, setInventoryPickerLoading] = useState(false);
    const [inventoryPickerSearch, setInventoryPickerSearch] = useState("");

    const openEditModal = (listing) => {
        setEditingListing(listing);
        setEditForm({
            vertical: listing.vertical || "",
            marketplace: listing.marketplace || "",
            status: listing.status || "active",
            styleId: listing.styleId || "",
            inventoryItems: listing.inventoryItems?.map(inv => inv.inventoryId || inv) || [],
        });
        setShowInventoryPicker(false);
        setInventoryPickerSearch("");
    };

    const openInventoryPicker = async () => {
        setShowInventoryPicker(true);
        if (inventoryPickerItems.length > 0) return; // already loaded
        setInventoryPickerLoading(true);
        try {
            const res = await fetch("/api/employee/inventory");
            const result = await res.json();
            if (res.ok && result.success) {
                setInventoryPickerItems(result.data || []);
            }
        } catch (e) {
            console.error("Failed to load inventory for picker:", e);
        } finally {
            setInventoryPickerLoading(false);
        }
    };

    const toggleInventoryItem = (inventoryId) => {
        setEditForm(f => {
            const exists = f.inventoryItems.includes(inventoryId);
            return {
                ...f,
                inventoryItems: exists
                    ? f.inventoryItems.filter(id => id !== inventoryId)
                    : [...f.inventoryItems, inventoryId],
            };
        });
    };

    const handleEditSave = async () => {
        if (!editForm.vertical) {
            toast.error("Please select a vertical.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!editForm.marketplace) {
            toast.error("Please select a marketplace.", { id: "app-feedback", duration: 3000 });
            return;
        }
        setEditSaving(true);
        try {
            const updatedStyleId = editForm.marketplace === "Myntra" ? (editForm.styleId ? editForm.styleId.trim() : null) : null;
            const payload = {
                id: editingListing._id,
                skuId: editingListing.skuId,
                ...editForm,
                styleId: updatedStyleId,
            };
            const res = await fetch("/api/employee/listing", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });
            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Listing updated successfully.", { id: "app-feedback", duration: 3000 });
                // Update local cache
                const updated = allListingsData.map(item =>
                    (editingListing._id ? item._id === editingListing._id : item.skuId === editingListing.skuId && item.marketplace === editingListing.marketplace)
                        ? {
                            ...item,
                            ...editForm,
                            styleId: updatedStyleId,
                            inventoryItems: editForm.inventoryItems.map(id => ({ inventoryId: id, imageUrl: item.inventoryItems.find(i => i.inventoryId === id)?.imageUrl || null }))
                        }
                        : item
                );
                setAllListingsData(updated);
                setEditingListing(null);
            } else {
                toast.error(result.error || "Failed to update listing.", { id: "app-feedback", duration: 3000 });
            }
        } catch (e) {
            console.error("Edit Error:", e);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setEditSaving(false);
        }
    };

    const closeEditModal = () => setEditingListing(null);
    const handleEditStatusChange = (s) => setEditForm(f => ({ ...f, status: s }));
    const handleEditMarketplaceChange = (mp) => setEditForm(f => ({ ...f, marketplace: mp }));
    const handleEditStyleIdChange = e => setEditForm(f => ({ ...f, styleId: e.target.value }));
    const handleEditVerticalChange = (verticalName) => setEditForm(f => ({ ...f, vertical: verticalName }));
    const handleRemoveInventoryItem = (id) => setEditForm(f => ({ ...f, inventoryItems: f.inventoryItems.filter(i => i !== id) }));
    const closeInventoryPicker = () => setShowInventoryPicker(false);
    const handleInventoryPickerSearchChange = e => setInventoryPickerSearch(e.target.value.toUpperCase());
    const clearInventoryPickerSearch = () => setInventoryPickerSearch('');

    return {
        editingListing,
        editForm,
        editSaving,
        showInventoryPicker,
        inventoryPickerItems,
        inventoryPickerLoading,
        inventoryPickerSearch,
        openEditModal,
        openInventoryPicker,
        toggleInventoryItem,
        handleEditSave,
        closeEditModal,
        handleEditStatusChange,
        handleEditMarketplaceChange,
        handleEditStyleIdChange,
        handleEditVerticalChange,
        handleRemoveInventoryItem,
        closeInventoryPicker,
        handleInventoryPickerSearchChange,
        clearInventoryPickerSearch,
    };
}
