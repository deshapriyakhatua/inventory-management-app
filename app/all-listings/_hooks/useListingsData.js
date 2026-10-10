"use client";
import { toast } from "sonner";
import { useState, useEffect, useEffectEvent } from "react";

import { fetchVerticalsData } from "@/utils/apiUtils";

// Owns the listings source data: verticals + all listings, initial load and server fetch.
export default function useListingsData() {
    const [allListingsData, setAllListingsData] = useState([]); // All data from API/Local Storage
    const [verticals, setVerticals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    // Mount-only load; useEffectEvent keeps it from re-running when the loaders change identity
    const loadOnMount = useEffectEvent(() => {
        loadInitialData();
        fetchListings(false); // Try loading from local storage first
    });
    useEffect(() => { loadOnMount(); }, []);

    const loadInitialData = async () => {
        const pin = sessionStorage.getItem("app_pin");
        try {
            const cachedVerticals = await fetchVerticalsData(pin);
            setVerticals(cachedVerticals || []);
        } catch (error) {
            console.error("Failed to load verticals:", error);
        }
    };

    const fetchListings = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        toast.dismiss("app-feedback");

        try {
            const response = await fetch("/api/employee/listing");
            const result = await response.json();

            if (response.ok && result.success) {
                const fetchedData = result.data || [];
                setAllListingsData(fetchedData);

                if (forceRefresh) {
                    toast.success("Listings refreshed successfully.", { id: "app-feedback", duration: 3000 });
                }
            } else {
                toast.error(result.error || "Failed to load listings.", { id: "app-feedback", duration: 3000 });
                if (!allListingsData.length) setAllListingsData([]);
            }
        } catch (error) {
            console.error("Fetch Error:", error);
            toast.error("Network error while loading data.", { id: "app-feedback", duration: 3000 });
            if (!allListingsData.length) setAllListingsData([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    return {
        allListingsData,
        setAllListingsData,
        verticals,
        loading,
        refreshing,
        fetchListings,
    };
}
