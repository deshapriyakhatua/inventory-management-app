"use client";
import { useState, useEffect, useEffectEvent } from "react";
import { toast } from "sonner";

// Data loading (invoice ID, inventory, recent invoices, company settings) and company settings save
export default function useInvoiceData({
  sellerDetails,
  setSellerDetails,
  notes,
  setNotes,
  setInvoiceNumber,
}) {
  const [isGeneratingId, setIsGeneratingId] = useState(false);
  const [inventoryList, setInventoryList] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState("");
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isSavingCompany, setIsSavingCompany] = useState(false);

  // Mount-only load; useEffectEvent keeps it from re-running when fetchRecentInvoices changes identity
  const loadOnMount = useEffectEvent(() => {
    fetchNextInvoiceId();
    fetchInventoryList();
    fetchRecentInvoices();
    fetchCompanySettings();
  });
  useEffect(() => { loadOnMount(); }, []);

  // Fetch Saved Company & Bank Settings from Database
  const fetchCompanySettings = async () => {
    try {
      const res = await fetch("/api/employee/company-settings");
      const data = await res.json();
      if (res.ok && data.data) {
        const cs = data.data;
        setSellerDetails((prev) => ({
          ...prev,
          businessName: cs.businessName || prev.businessName,
          address: cs.address || prev.address,
          state: cs.state || prev.state,
          gstNo: cs.gstNo || prev.gstNo,
          bankName: cs.bankName || prev.bankName,
          accountNo: cs.accountNo || prev.accountNo,
          ifscCode: cs.ifscCode || prev.ifscCode,
          accountHolderName: cs.accountHolderName || prev.accountHolderName,
          upiId: cs.upiId || prev.upiId,
        }));
        if (cs.notes) {
          setNotes(cs.notes);
        }
      }
    } catch (err) {
      console.error("Failed to fetch company settings:", err);
    }
  };

  // Save Company & Bank Settings to Database
  const handleSaveCompanySettings = async () => {
    setIsSavingCompany(true);
    try {
      const res = await fetch("/api/employee/company-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...sellerDetails,
          notes,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Company & bank info saved to database!");
        setIsCompanyModalOpen(false);
      } else {
        toast.error(data.error || "Failed to save company settings");
      }
    } catch (err) {
      console.error("Save company settings error:", err);
      toast.error("Network error while saving company settings");
    } finally {
      setIsSavingCompany(false);
    }
  };

  // Fetch Next Invoice ID (CZ-A0001 pattern)
  const fetchNextInvoiceId = async () => {
    setIsGeneratingId(true);
    try {
      const res = await fetch("/api/employee/b2b-invoice/generate-id");
      const data = await res.json();
      if (res.ok && data.nextId) {
        setInvoiceNumber(data.nextId);
      } else {
        toast.error("Failed to generate Invoice ID");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error while generating ID");
    } finally {
      setIsGeneratingId(false);
    }
  };

  // Fetch Inventory items for dropdown
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

  // Fetch Recent Invoices
  const fetchRecentInvoices = async () => {
    setIsLoadingHistory(true);
    try {
      const url = searchHistory
        ? `/api/employee/b2b-invoice?search=${encodeURIComponent(searchHistory)}`
        : `/api/employee/b2b-invoice`;
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.data) {
        setRecentInvoices(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch recent invoices:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleOpenCompanyModal = () => setIsCompanyModalOpen(true);
  const handleCloseCompanyModal = () => setIsCompanyModalOpen(false);

  return {
    isGeneratingId,
    inventoryList,
    recentInvoices,
    isLoadingHistory,
    isCompanyModalOpen,
    isSavingCompany,
    fetchNextInvoiceId,
    fetchRecentInvoices,
    handleSaveCompanySettings,
    handleOpenCompanyModal,
    handleCloseCompanyModal,
  };
}
