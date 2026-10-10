"use client";
import { useState, useRef } from "react";
import { toast } from "sonner";

// Line item editing, single inventory picker, multi-select inventory modal and image hover preview
export default function useLineItemPickers({ lineItems, setLineItems, inventoryList }) {
  const pickerSearchRef = useRef(null);

  // Inventory Modal state
  const [inventoryPickerIndex, setInventoryPickerIndex] = useState(null);
  const [inventorySearch, setInventorySearch] = useState("");

  // Floating Cursor Image Preview state
  const [hoveredImage, setHoveredImage] = useState(null);

  // Multi-Select Inventory Modal state
  const [isMultiSelectOpen, setIsMultiSelectOpen] = useState(false);
  const [selectedInvIds, setSelectedInvIds] = useState([]);
  const [multiSelectSearch, setMultiSelectSearch] = useState("");
  const multiSearchRef = useRef(null);

  const openMultiSelectModal = () => {
    setIsMultiSelectOpen(true);
    // Pre-populate selectedInvIds with all items currently present in lineItems
    const existingIds = lineItems
      .map((item) => item.inventoryId)
      .filter((id) => Boolean(id) && String(id).trim() !== "");
    setSelectedInvIds(Array.from(new Set(existingIds)));
    setMultiSelectSearch("");
    setTimeout(() => {
      if (multiSearchRef.current) {
        multiSearchRef.current.focus();
      }
    }, 50);
  };

  const closeMultiSelectModal = () => {
    setIsMultiSelectOpen(false);
    setSelectedInvIds([]);
    setMultiSelectSearch("");
  };

  const toggleInvSelection = (invId) => {
    setSelectedInvIds((prev) =>
      prev.includes(invId) ? prev.filter((id) => id !== invId) : [...prev, invId]
    );
  };

  const handleSelectAllFiltered = (filteredList) => {
    const ids = filteredList.map((i) => i.inventoryId);
    setSelectedInvIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleClearSelection = () => {
    setSelectedInvIds([]);
  };

  const handleAddSelectedItems = () => {
    // Map of currently existing items keyed by inventoryId to preserve their details (qty, price, gstRate, etc.)
    const existingMap = new Map();
    lineItems.forEach((item) => {
      if (item.inventoryId) {
        existingMap.set(item.inventoryId, item);
      }
    });

    // Custom manual rows without an inventoryId (e.g. user typed a description manually)
    const customRows = lineItems.filter(
      (item) => !item.inventoryId && (item.description || item.unitPrice > 0)
    );

    // Build list of inventory item rows based on selectedInvIds
    const updatedInvRows = selectedInvIds.map((invId) => {
      if (existingMap.has(invId)) {
        return existingMap.get(invId); // preserve existing quantities, prices, etc.
      }
      return {
        inventoryId: invId,
        description: invId,
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      };
    });

    const finalRows = [...updatedInvRows, ...customRows];

    if (finalRows.length === 0) {
      finalRows.push({
        inventoryId: "",
        description: "",
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      });
    }

    setLineItems(finalRows);
    toast.success(`Updated invoice with ${selectedInvIds.length} selected item(s)`);
    closeMultiSelectModal();
  };

  const handleAddBlankRow = () => {
    addLineItem();
    closeMultiSelectModal();
  };

  const filteredMultiInventory = inventoryList.filter((inv) => {
    if (!multiSelectSearch.trim()) return true;
    const q = multiSelectSearch.toLowerCase().trim();
    return (
      inv.inventoryId?.toLowerCase().includes(q) ||
      inv.vertical?.toLowerCase().includes(q)
    );
  });

  const openInventoryPicker = (index) => {
    setInventoryPickerIndex(index);
    setInventorySearch("");
    setTimeout(() => {
      if (pickerSearchRef.current) {
        pickerSearchRef.current.focus();
      }
    }, 50);
  };

  const closeInventoryPicker = () => {
    setInventoryPickerIndex(null);
    setInventorySearch("");
  };

  const selectInventoryItem = (inv) => {
    if (inventoryPickerIndex === null) return;
    handleLineItemChange(inventoryPickerIndex, "inventoryId", inv.inventoryId);
    closeInventoryPicker();
  };

  const filteredInventory = inventoryList.filter((inv) => {
    if (!inventorySearch.trim()) return true;
    const q = inventorySearch.toLowerCase().trim();
    return (
      inv.inventoryId?.toLowerCase().includes(q) ||
      inv.vertical?.toLowerCase().includes(q)
    );
  });

  // Line Item Change Handlers
  const handleLineItemChange = (index, field, value) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };

    if (field === "inventoryId" && value) {
      const selectedItem = inventoryList.find((i) => i.inventoryId === value);
      if (selectedItem) {
        updated[index].description = selectedItem.inventoryId;
      }
    }

    setLineItems(updated);
  };

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      {
        inventoryId: "",
        description: "",
        hsnCode: "7117",
        quantity: 1,
        unitPrice: 0,
        gstRate: 3,
      },
    ]);
  };

  const removeLineItem = (index) => {
    if (lineItems.length === 1) {
      toast.error("Invoice must have at least one item");
      return;
    }
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handlePickerMouseEnter = (e, selectedInv) => {
    if (selectedInv?.imageUrl) {
      setHoveredImage({
        url: selectedInv.imageUrl,
        id: selectedInv.inventoryId,
        x: e.clientX,
        y: e.clientY,
      });
    }
  };
  const handlePickerMouseMove = (e, selectedInv) => {
    if (selectedInv?.imageUrl) {
      setHoveredImage((prev) =>
        prev
          ? { ...prev, x: e.clientX, y: e.clientY }
          : {
              url: selectedInv.imageUrl,
              id: selectedInv.inventoryId,
              x: e.clientX,
              y: e.clientY,
            }
      );
    }
  };
  const handlePickerMouseLeave = () => setHoveredImage(null);
  const handleInventorySearchChange = (e) => setInventorySearch(e.target.value);
  const handleClearInventorySearch = () => setInventorySearch("");
  const handleMultiSelectSearchChange = (e) => setMultiSelectSearch(e.target.value);
  const handleClearMultiSelectSearch = () => setMultiSelectSearch("");

  return {
    pickerSearchRef,
    inventoryPickerIndex,
    inventorySearch,
    hoveredImage,
    isMultiSelectOpen,
    selectedInvIds,
    multiSelectSearch,
    multiSearchRef,
    openMultiSelectModal,
    closeMultiSelectModal,
    toggleInvSelection,
    handleSelectAllFiltered,
    handleClearSelection,
    handleAddSelectedItems,
    handleAddBlankRow,
    filteredMultiInventory,
    openInventoryPicker,
    closeInventoryPicker,
    selectInventoryItem,
    filteredInventory,
    handleLineItemChange,
    removeLineItem,
    handlePickerMouseEnter,
    handlePickerMouseMove,
    handlePickerMouseLeave,
    handleInventorySearchChange,
    handleClearInventorySearch,
    handleMultiSelectSearchChange,
    handleClearMultiSelectSearch,
  };
}
