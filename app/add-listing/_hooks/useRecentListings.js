import { useState } from "react";
import { toast } from "sonner";

export function useRecentListings() {
    // Recent Listings specific state
    const [recentListings, setRecentListings] = useState([]);
    const [loadingRecentListings, setLoadingRecentListings] = useState(true);
    const [refreshingRecentListings, setRefreshingRecentListings] = useState(false);
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);

    const loadData = async (forceRefresh = false) => {
        const data = await fetchLatestListings(forceRefresh);
        setRecentListings(data);
    };

    const fetchLatestListings = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshingRecentListings(true);
        } else {
            setLoadingRecentListings(true);
        }

        try {
            const response = await fetch("/api/employee/listing?limit=5");
            const result = await response.json();
            
            if (response.ok && result.success) {
                const fetchedListings = result.data || [];
                return fetchedListings.slice(0, 5);
            } else {
                console.error("API Error:", result.error);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingRecentListings(false);
            setRefreshingRecentListings(false);
        }
    };

    const handleDelete = async (skuId) => {
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/listing?skuId=${skuId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Listing deleted successfully.", { id: "app-feedback", duration: 3000 });
                loadData(true); 
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

    const handleCopySku = (sku) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sku).then(() => {
                toast.success("SKU ID copied to clipboard!", { id: "app-feedback", duration: 3000 });
            }).catch(err => {
                console.error("Failed to copy:", err);
                toast.error("Failed to copy SKU ID.", { id: "app-feedback", duration: 3000 });
            });
        } else {
            toast.error("Clipboard copy not supported in this browser.", { id: "app-feedback", duration: 3000 });
        }
    };

    return {
        recentListings, loadingRecentListings, refreshingRecentListings,
        deleteButtonLoading, deletingListingId,
        loadData, handleDelete, handleCopySku,
    };
}
