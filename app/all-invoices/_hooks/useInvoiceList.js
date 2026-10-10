"use client";

import { useState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

// Data loading: invoices + inventory list, search/status/archived filters, summary metrics.
export default function useInvoiceList() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [showArchived, setShowArchived] = useState(false);

  // Inventory list (used by the Graphical View modal)
  const [inventoryList, setInventoryList] = useState([]);

  const fetchInventoryList = async () => {
    try {
      const res = await fetch("/api/employee/inventory");
      const data = await res.json();
      if (res.ok && data.data) {
        setInventoryList(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch inventory list:", err);
    }
  };

  // Effect event keeps the original trigger set: refetch when search/status/archived change.
  const onFiltersChange = useEffectEvent(() => {
    fetchInvoices();
    fetchInventoryList();
  });
  useEffect(() => {
    onFiltersChange();
  }, [search, statusFilter, showArchived]);

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      let url = `/api/employee/b2b-invoice?archived=${showArchived}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;
      if (statusFilter && statusFilter !== "All")
        url += `status=${encodeURIComponent(statusFilter)}&`;

      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setInvoices(data.data);
      } else {
        toast.error("Failed to load invoices");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while fetching invoices");
    } finally {
      setLoading(false);
    }
  };

  // Metrics Calculations
  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + (inv.grandTotal || 0),
    0
  );
  const totalReceived = invoices.reduce(
    (sum, inv) => sum + (inv.receivedAmount || 0),
    0
  );
  const totalBalance = invoices.reduce(
    (sum, inv) => {
      const invBal =
        inv.balanceAmount !== undefined && inv.balanceAmount !== null && inv.balanceAmount !== 0
          ? inv.balanceAmount
          : (inv.grandTotal || 0) - (inv.receivedAmount || 0);
      return sum + invBal;
    },
    0
  );

  const handleShowActive = () => setShowArchived(false);
  const handleShowArchived = () => setShowArchived(true);
  const handleSearchChange = (e) => setSearch(e.target.value);
  const handleStatusFilterChange = (e) => setStatusFilter(e.target.value);

  return {
    invoices,
    loading,
    search,
    statusFilter,
    showArchived,
    inventoryList,
    fetchInvoices,
    totalRevenue,
    totalReceived,
    totalBalance,
    handleShowActive,
    handleShowArchived,
    handleSearchChange,
    handleStatusFilterChange,
  };
}
