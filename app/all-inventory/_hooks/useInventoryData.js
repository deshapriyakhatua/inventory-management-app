"use client";
import { toast } from "sonner";
import React, { useState, useEffect, useEffectEvent } from "react";
import { useSearchParams } from "next/navigation";

import { fetchVerticalsData } from "@/utils/apiUtils";

// Owns the inventory source data: verticals, all inventory, the archived view flag (seeded from the URL),
// the mount-time load and the server fetch.
export default function useInventoryData() {
    const [allInventoryData, setAllInventoryData] = useState([]); // All data from API/Local Storage
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const searchParams = useSearchParams();

    const [showArchived, setShowArchived] = useState(() => searchParams.get('archived') === 'true');

    const STALE_THRESHOLD_MS = 60 * 1000; // 1 minute
    // Ref to track current showArchived value inside the stale event listener closure
    const showArchivedRef = React.useRef(showArchived);
    useEffect(() => { showArchivedRef.current = showArchived; }, [showArchived]);

    // Mount-only load; useEffectEvent keeps it from re-running when the loaders change identity
    const loadOnMount = useEffectEvent(() => {
        loadInitialData();
        const initialArchived = searchParams.get('archived') === 'true';
        fetchInventory(false, initialArchived);
    });

    useEffect(() => {
        loadOnMount();
    }, []);

    const loadInitialData = async () => {
        const pin = sessionStorage.getItem("app_pin");
        try {
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);
        } catch (error) {
            console.error("Failed to load verticals:", error);
        }
    };

    const fetchInventory = async (forceRefresh = false, fetchArchived = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        toast.dismiss("app-feedback");

        try {
            const url = `/api/employee/inventory${fetchArchived ? '?showArchived=true' : ''}`;
            const response = await fetch(url);
            const result = await response.json();

            if (response.ok) {
                const fetchedData = result.data || [];
                setAllInventoryData(fetchedData);

                if (forceRefresh) {
                    toast.success("Inventory refreshed successfully.", { id: "app-feedback", duration: 3000 });
                }
            } else {
                toast.error(result.error || "Failed to load inventory.", { id: "app-feedback", duration: 3000 });
                if (!allInventoryData.length) setAllInventoryData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Network error while loading data.", { id: "app-feedback", duration: 3000 });
            if (!allInventoryData.length) setAllInventoryData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    return {
        allInventoryData,
        setAllInventoryData,
        verticals,
        loading,
        refreshing,
        showArchived,
        setShowArchived,
        fetchInventory,
    };
}
