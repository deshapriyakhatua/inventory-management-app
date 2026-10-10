"use client";
import { toast } from "sonner";
import { useState } from "react";

// Owns the edit-inventory modal flow (form state, image preview, save).
export default function useInventoryEdit({ fetchInventory, showArchived }) {
    // Edit Modal State
    const [editingItem, setEditingItem] = useState(null);
    const [editForm, setEditForm] = useState({
        inventoryId: "",
        vertical: "",
        image: null,
        imagePreview: "",
    });
    const [editSaving, setEditSaving] = useState(false);

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditForm({
            inventoryId: item.inventoryId || "",
            vertical: item.vertical || "",
            image: null,
            imagePreview: item.imageUrl || "",
        });
    };

    const closeEditModal = () => {
        setEditingItem(null);
        setEditForm({ inventoryId: "", vertical: "", image: null, imagePreview: "" });
    };

    const handleEditFormChange = (e) => {
        const { name, value, files } = e.target;
        if (name === "image" && files && files[0]) {
            const file = files[0];
            setEditForm(prev => ({
                ...prev,
                image: file,
                imagePreview: URL.createObjectURL(file)
            }));
        } else {
            setEditForm(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        if (!editingItem) return;
        if (!editForm.inventoryId.trim()) {
            toast.error("Inventory ID is required.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!editForm.vertical.trim()) {
            toast.error("Vertical is required.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setEditSaving(true);
        try {
            const formData = new FormData();
            formData.append("id", editingItem._id);
            formData.append("inventoryId", editForm.inventoryId.trim());
            formData.append("vertical", editForm.vertical.trim());
            if (editForm.image) {
                formData.append("image", editForm.image);
            }

            const res = await fetch("/api/employee/inventory/add", {
                method: "PUT",
                body: formData,
            });

            const result = await res.json();
            if (res.ok && result.success) {
                toast.success("Inventory item updated successfully.", { id: "app-feedback", duration: 3000 });
                fetchInventory(true, showArchived);
                closeEditModal();
            } else {
                toast.error(result.error || "Failed to update inventory item.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Save Edit Error:", error);
            toast.error("Network error while saving inventory item.", { id: "app-feedback", duration: 3000 });
        } finally {
            setEditSaving(false);
        }
    };

    return {
        editingItem,
        editForm,
        editSaving,
        openEditModal,
        closeEditModal,
        handleEditFormChange,
        handleSaveEdit,
    };
}
