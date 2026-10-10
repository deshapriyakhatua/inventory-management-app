"use client";
import { toast } from "sonner";
import { useState, useEffect } from "react";

// Data loading: active + archived purchase lists and the archived toggle.
export default function usePurchaseData() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);

  // Show archived toggle
  const [showArchived, setShowArchived] = useState(false);
  const [archivedPurchases, setArchivedPurchases] = useState([]);
  const [loadingArchived, setLoadingArchived] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, []);

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/employee/purchase?history=true");
      const result = await res.json();
      if (res.ok && result.success) {
        setPurchases(result.purchases || []);
      } else {
        toast.error(result.error || "Failed to load purchase history", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading history", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedPurchases = async () => {
    setLoadingArchived(true);
    try {
      const res = await fetch("/api/employee/purchase?history=true&archived=true");
      const result = await res.json();
      if (res.ok && result.success) {
        setArchivedPurchases(result.purchases || []);
      } else {
        toast.error(result.error || "Failed to load archived records", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading archived records", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoadingArchived(false);
    }
  };

  const toggleShowArchived = () => {
    const next = !showArchived;
    setShowArchived(next);
    if (next && archivedPurchases.length === 0) {
      fetchArchivedPurchases();
    }
  };

  return {
    loading,
    purchases,
    setPurchases,
    showArchived,
    archivedPurchases,
    setArchivedPurchases,
    loadingArchived,
    fetchPurchases,
    fetchArchivedPurchases,
    toggleShowArchived,
  };
}
