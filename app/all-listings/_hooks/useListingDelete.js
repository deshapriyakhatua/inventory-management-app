"use client";
import { toast } from "sonner";
import { useState } from "react";

// Owns the delete-listing confirmation flow.
export default function useListingDelete({ allListingsData, setAllListingsData }) {
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);

    // Delete Confirmation Modal State
    const [deletingListing, setDeletingListing] = useState(null);
    const [deleteInputText, setDeleteInputText] = useState("");

    const openDeleteModal = (listing) => {
        setDeletingListing(listing);
        setDeleteInputText("");
    };

    const confirmDelete = async () => {
        if (!deletingListing) return;
        const id = deletingListing._id;
        const skuId = deletingListing.skuId;
        const marketplace = deletingListing.marketplace;
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const deleteUrl = id
                ? `/api/employee/listing?id=${id}`
                : `/api/employee/listing?skuId=${skuId}&marketplace=${encodeURIComponent(marketplace)}`;
            const response = await fetch(deleteUrl, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Listing deleted successfully.", { id: "app-feedback", duration: 3000 });
                // Update local data
                const updatedData = allListingsData.filter(item =>
                    id ? item._id !== id : !(item.skuId === skuId && item.marketplace === marketplace)
                );
                setAllListingsData(updatedData);
                setDeletingListing(null);
                setDeleteInputText("");
            } else {
                toast.error(result.error || "Failed to delete listing.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingListingId(null);
        }
    };

    const closeDeleteModal = () => setDeletingListing(null);
    const handleDeleteInputChange = (e) => setDeleteInputText(e.target.value);
    const handleDeleteInputKeyDown = (e) => {
        if (e.key === 'Enter' && deleteInputText.trim().toLowerCase() === 'delete' && !deleteButtonLoading) {
            confirmDelete();
        }
    };

    return {
        deleteButtonLoading,
        deletingListingId,
        deletingListing,
        deleteInputText,
        openDeleteModal,
        confirmDelete,
        closeDeleteModal,
        handleDeleteInputChange,
        handleDeleteInputKeyDown,
    };
}
