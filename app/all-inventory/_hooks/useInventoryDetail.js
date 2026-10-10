"use client";
import { useState, useEffect } from "react";

// Owns the detail (expander) modal: selected item and its linked SKUs.
export default function useInventoryDetail() {
    const [selectedItem, setSelectedItem] = useState(null); // For expander modal
    const [modalSkus, setModalSkus] = useState([]);
    const [modalSkusLoading, setModalSkusLoading] = useState(false);

    useEffect(() => {
        if (selectedItem) {
            // Verbatim from page.js; this rule was latent there (the compiler bailed out on the larger page component)
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setModalSkus([]);
            setModalSkusLoading(true);
            fetch(`/api/employee/inventory/skus?inventoryId=${selectedItem.inventoryId}`)
                .then(res => res.json())
                .then(data => {
                    if (data.success) {
                        setModalSkus(data.skus || []);
                    } else {
                        console.error("Failed to load SKUs:", data.error);
                    }
                })
                .catch(err => console.error("Error fetching SKUs:", err))
                .finally(() => setModalSkusLoading(false));
        }
    }, [selectedItem]);

    return { selectedItem, setSelectedItem, modalSkus, modalSkusLoading };
}
