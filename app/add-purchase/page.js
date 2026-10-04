"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import styles from "./page.module.css";

import { parseSearchQuery, matchesSearchTerms } from "../../utils/searchUtils";

const EMPTY_ITEM = () => ({
  id: crypto.randomUUID(),
  sellerProductId: "",
  inventoryId: "",
  imageUrl: "",
  quantity: "",
  price: "",
  shippingFee: "",
  taxPercentage: "",
});

export default function AddPurchasePage() {
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Shared state
  const [sellers, setSellers] = useState([]);
  const [formSellerId, setFormSellerId] = useState("");
  const [formInvoiceNo, setFormInvoiceNo] = useState("");
  const [formOrderedOn, setFormOrderedOn] = useState("");
  const [formReceivedOn, setFormReceivedOn] = useState("");

  // Mappings for selected seller
  const [currentMappings, setCurrentMappings] = useState([]);
  const [mappingsLoading, setMappingsLoading] = useState(false);

  // Product line items
  const [items, setItems] = useState([EMPTY_ITEM()]);

  // Inventory picker
  const [inventoryPickerFor, setInventoryPickerFor] = useState(null); // itemId being picked
  const [allInventory, setAllInventory] = useState([]);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [inventorySearch, setInventorySearch] = useState("");
  const pickerSearchRef = useRef(null);

  const [submitting, setSubmitting] = useState(false);


  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const res = await fetch("/api/employee/purchase");
      const result = await res.json();
      if (res.ok && result.success) {
        setSellers(result.sellers || []);
        setFormOrderedOn(getTodayDateString());
      } else {
        toast.error(result.error || "Failed to load active sellers", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading sellers", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoadingInitial(false);
    }
  };

  // When seller changes, fetch mappings and reset items
  useEffect(() => {
    setCurrentMappings([]);
    setItems([EMPTY_ITEM()]);

    if (formSellerId) {
      setMappingsLoading(true);
      fetch(`/api/employee/purchase?sellerId=${formSellerId}`)
        .then(r => r.json())
        .then(result => {
          if (result.success) setCurrentMappings(result.mappings || []);
        })
        .catch(err => console.error("Failed to fetch mappings", err))
        .finally(() => setMappingsLoading(false));
    }
  }, [formSellerId]);

  // When a line item's sellerProductId changes, auto-fill its inventoryId + imageUrl
  const handleItemSellerProductChange = useCallback((itemId, sellerProductId) => {
    setItems(prev => prev.map(item => {
      if (item.id !== itemId) return item;
      const matched = currentMappings.find(m => m.sellerProductId === sellerProductId);
      return {
        ...item,
        sellerProductId,
        inventoryId: matched?.inventoryId || "",
        imageUrl: matched?.imageUrl || "",
      };
    }));
  }, [currentMappings]);

  const handleItemChange = (itemId, field, value) => {
    setItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const addItem = () => {
    setItems(prev => [...prev, EMPTY_ITEM()]);
  };

  const removeItem = (itemId) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== itemId) : prev);
  };

  // ── Inventory Picker ────────────────────────────────────────────
  const openInventoryPicker = (itemId) => {
    setInventoryPickerFor(itemId);
    setInventorySearch("");
    // Fetch lazily — only once
    if (allInventory.length === 0) {
      setInventoryLoading(true);
      fetch("/api/employee/inventory")
        .then(r => r.json())
        .then(result => {
          if (result.data) setAllInventory(result.data);
        })
        .catch(err => console.error("Failed to fetch inventory", err))
        .finally(() => setInventoryLoading(false));
    }
    // Focus search after paint
    setTimeout(() => pickerSearchRef.current?.focus(), 80);
  };

  const closeInventoryPicker = () => {
    setInventoryPickerFor(null);
    setInventorySearch("");
  };

  const pickInventoryItem = (inv) => {
    if (!inventoryPickerFor) return;
    // Find associated seller SKU from current mappings, fallback to 'NA'
    const matchedMapping = currentMappings.find(m => m.inventoryId === inv.inventoryId);
    const resolvedSKU = matchedMapping ? matchedMapping.sellerProductId : "NA";
    setItems(prev => prev.map(item =>
      item.id === inventoryPickerFor
        ? { ...item, inventoryId: inv.inventoryId, imageUrl: inv.imageUrl || "", sellerProductId: resolvedSKU }
        : item
    ));
    closeInventoryPicker();
  };

  const filteredInventory = allInventory.filter(inv => {
    if (!inventorySearch) return true;
    const { includeTerms, excludeTerms } = parseSearchQuery(inventorySearch);
    return matchesSearchTerms(inv.inventoryId, includeTerms, excludeTerms);
  });
  // ────────────────────────────────────────────────────────────────

  const handleReset = () => {
    setFormSellerId("");
    setFormInvoiceNo("");
    setFormOrderedOn(getTodayDateString());
    setFormReceivedOn("");
    setCurrentMappings([]);
    setItems([EMPTY_ITEM()]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formSellerId || !formOrderedOn) {
      toast.error("Please fill in the Seller and Ordered On date.", { id: "app-feedback", duration: 3000 });
      return;
    }

    const invalid = items.find(
      item => !item.inventoryId || !item.quantity || !item.price
    );
    if (invalid) {
      toast.error("Each product must have an Inventory ID, quantity, and unit price.", { id: "app-feedback", duration: 3000 });
      return;
    }

    setSubmitting(true);
    toast.dismiss("app-feedback");

    try {
      // Submit each item as a separate purchase record (same seller/invoice/timeline)
      const results = await Promise.allSettled(
        items.map(item =>
          fetch("/api/employee/purchase", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sellerId: formSellerId,
              sellerProductId: item.sellerProductId,
              inventoryId: item.inventoryId,
              quantity: Number(item.quantity),
              price: Number(item.price),
              shippingFee: Number(item.shippingFee) || 0,
              taxPercentage: Number(item.taxPercentage) || 0,
              orderedOn: formOrderedOn,
              receivedOn: formReceivedOn || null,
              invoiceNo: formInvoiceNo || "",
            })
          }).then(r => r.json())
        )
      );

      const failed = results.filter(r => r.status === "rejected" || !r.value?.success);
      if (failed.length === 0) {
        toast.success(`${items.length} purchase(s) logged successfully!`, { id: "app-feedback", duration: 3000 });
        setTimeout(() => handleReset(), 600);
      } else if (failed.length < items.length) {
        toast.error(`${items.length - failed.length} logged, ${failed.length} failed. Check entries and retry.`, { id: "app-feedback", duration: 3000 });
      } else {
        toast.error("All purchases failed to save. Please try again.", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network Error. Please try again.", { id: "app-feedback", duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const totals = useMemo(() => {
    let totalQuantity = 0;
    let subtotal = 0;
    let totalShipping = 0;
    let totalTax = 0;

    items.forEach(item => {
      const qty = Number(item.quantity || 0);
      const price = Number(item.price || 0);
      const ship = Number(item.shippingFee || 0);
      const taxPct = Number(item.taxPercentage || 0);

      const itemSubtotal = qty * price;
      const itemTax = (itemSubtotal * taxPct) / 100;

      totalQuantity += qty;
      subtotal += itemSubtotal;
      totalShipping += ship;
      totalTax += itemTax;
    });

    const grandTotal = subtotal + totalShipping + totalTax;

    return {
      totalLineItems: items.length,
      totalQuantity,
      subtotal,
      totalShipping,
      totalTax,
      grandTotal,
    };
  }, [items]);

  if (loadingInitial) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingWrapper}>
          <div className={styles.spinner}></div>
          <p>Loading purchase config...</p>
        </div>
      </div>
    );
  }

  const allValid = formSellerId && formOrderedOn && items.every(
    i => i.inventoryId && i.quantity && i.price
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Add Purchase</h1>
        <p className={styles.subtitle}>Record inbound stock invoices. This safely logs expenses without mutating open inventory limits.</p>
      </div>

      <div className={styles.formCard}>
        <form onSubmit={handleSubmit}>

          {/* ── SHARED HEADER ─────────────────────────────────── */}
          <h2 className={styles.sectionTitle}>
            <Icon name="icon-2df76557" />
            Supplier &amp; Invoice
          </h2>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Seller <span className={styles.required}>*</span>
              </label>
              <select
                className={styles.select}
                value={formSellerId}
                onChange={e => setFormSellerId(e.target.value)}
                required
              >
                <option value="">-- Choose a Seller --</option>
                {sellers.map(s => (
                  <option key={s._id} value={s._id}>
                    {s.businessName}{s.contactPerson ? ` (${s.contactPerson})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Invoice No</label>
              <input
                type="text"
                className={styles.input}
                placeholder="Optional Invoice ID"
                value={formInvoiceNo}
                onChange={e => setFormInvoiceNo(e.target.value)}
              />
            </div>
          </div>

          {/* ── PRODUCT LINE ITEMS ─────────────────────────────── */}
          <h2 className={styles.sectionTitle}>
            <Icon name="icon-9172bca2" />
            Products
            <span className={styles.itemCount}>{items.length} item{items.length !== 1 ? "s" : ""}</span>
          </h2>

          {!formSellerId && (
            <div className={styles.noSellerHint}>
              <Icon name="icon-fe5d7d4f" size={18} />
              Select a seller above to start adding products.
            </div>
          )}

          <div className={styles.itemsStack}>
            {items.map((item, index) => (
              <div key={item.id} className={styles.productRow}>
                {/* Row header */}
                <div className={styles.productRowHeader}>
                  <span className={styles.productRowLabel}>Product {index + 1}</span>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className={styles.removeItemBtn}
                      onClick={() => removeItem(item.id)}
                      title="Remove this product"
                    >
                      <Icon name="remove-this-product" size={14} />
                      Remove
                    </button>
                  )}
                </div>

                <div className={styles.productRowGrid}>
                  {/* SKU Select */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Seller SKU <span className={styles.required}>*</span>
                    </label>
                    <select
                      className={styles.select}
                      value={item.sellerProductId}
                      onChange={e => handleItemSellerProductChange(item.id, e.target.value)}
                      disabled={!formSellerId || mappingsLoading}
                      required
                    >
                      <option value="">
                        {mappingsLoading ? "Loading SKUs..." : "-- Select Mapped SKU --"}
                      </option>
                      {/* Shown when inventory was picked without a matching seller SKU */}
                      {item.sellerProductId === "NA" && (
                        <option value="NA">NA (no mapping)</option>
                      )}
                      {currentMappings.map(m => (
                        <option key={m.sellerProductId} value={m.sellerProductId}>
                          {m.sellerProductId}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Clickable Inventory ID picker */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Internal Inventory ID <span className={styles.required}>*</span>
                    </label>
                    <button
                      type="button"
                      className={`${styles.inventoryPickerBtn} ${item.inventoryId ? styles.inventoryPickerBtnFilled : ""}`}
                      onClick={() => openInventoryPicker(item.id)}
                      title="Click to select from inventory"
                    >
                      {item.imageUrl && (
                        <img src={item.imageUrl} alt="Preview" className={styles.inputImagePreview} />
                      )}
                      {!item.imageUrl && (
                        <span className={styles.pickerBtnIcon}>
                          <Icon name="icon-b99b6c9f" size={16} />
                        </span>
                      )}
                      <span className={item.inventoryId ? styles.pickerBtnId : styles.pickerBtnPlaceholder}>
                        {item.inventoryId || "Click to select inventory..."}
                      </span>
                      <span className={styles.pickerBtnChevron}>
                        <Icon name="click-to-select-from-inventory" size={14} />
                      </span>
                    </button>
                  </div>

                  {/* Quantity */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Quantity <span className={styles.required}>*</span>
                    </label>
                    <input
                      type="number"
                      min="1"
                      className={styles.input}
                      placeholder="e.g. 50"
                      value={item.quantity}
                      onChange={e => handleItemChange(item.id, "quantity", e.target.value)}
                      required
                    />
                  </div>

                  {/* Unit Price */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>
                      Unit Price <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.priceGroup}>
                      <span className={styles.currencySymbol}>₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${styles.input} ${styles.priceInput}`}
                        placeholder="0.00"
                        value={item.price}
                        onChange={e => handleItemChange(item.id, "price", e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Shipping Fee */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Shipping Fee</label>
                    <div className={styles.priceGroup}>
                      <span className={styles.currencySymbol}>₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={`${styles.input} ${styles.priceInput}`}
                        placeholder="0.00"
                        value={item.shippingFee}
                        onChange={e => handleItemChange(item.id, "shippingFee", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Tax */}
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Tax (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      className={styles.input}
                      placeholder="e.g. 18"
                      value={item.taxPercentage}
                      onChange={e => handleItemChange(item.id, "taxPercentage", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Product button */}
          <button
            type="button"
            className={styles.addItemBtn}
            onClick={addItem}
            disabled={!formSellerId}
          >
            <Icon name="add-another-product" size={16} />
            Add Another Product
          </button>

          {/* ── TIMELINE ────────────────────────────────────────── */}
          <h2 className={`${styles.sectionTitle} ${styles.timelineSection}`}>
            <Icon name="icon-f5ba4e77" />
            Timeline
          </h2>

          <div className={styles.grid}>
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Ordered On <span className={styles.required}>*</span>
              </label>
              <input
                type="date"
                className={styles.input}
                value={formOrderedOn}
                onChange={e => setFormOrderedOn(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Received On</label>
              <input
                type="date"
                className={styles.input}
                value={formReceivedOn}
                onChange={e => setFormReceivedOn(e.target.value)}
              />
            </div>
          </div>

          {/* ── PURCHASE TOTALS SUMMARY ────────────────────────── */}
          <div className={styles.totalsSummaryCard}>
            <div className={styles.totalsSummaryHeader}>
              <Icon name="icon-7e710d4a" size={18} />
              <span>Purchase Summary &amp; Totals</span>
            </div>

            <div className={styles.totalsGrid}>
              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total Items</span>
                <span className={styles.totalValue}>{totals.totalLineItems}</span>
              </div>

              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total Quantity</span>
                <span className={styles.totalValue}>{totals.totalQuantity} units</span>
              </div>

              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Subtotal</span>
                <span className={styles.totalValue}>₹{totals.subtotal.toFixed(2)}</span>
              </div>

              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total Shipping</span>
                <span className={styles.totalValue}>₹{totals.totalShipping.toFixed(2)}</span>
              </div>

              <div className={styles.totalItem}>
                <span className={styles.totalLabel}>Total Tax</span>
                <span className={styles.totalValue}>₹{totals.totalTax.toFixed(2)}</span>
              </div>

              <div className={`${styles.totalItem} ${styles.grandTotalItem}`}>
                <span className={styles.grandTotalLabel}>Grand Total</span>
                <span className={styles.grandTotalValue}>₹{totals.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={submitting || !allValid}
          >
            {submitting
              ? `Saving ${items.length} purchase(s)...`
              : `Save ${items.length} Purchase${items.length !== 1 ? "s" : ""}`}
          </button>
        </form>
      </div>


      {/* ── INVENTORY PICKER MODAL ─────────────────────────────── */}
      {inventoryPickerFor && (
        <div className={styles.pickerOverlay} onClick={closeInventoryPicker}>
          <div className={styles.pickerModal} onClick={e => e.stopPropagation()}>
            {/* Modal header */}
            <div className={styles.pickerHeader}>
              <div>
                <h3 className={styles.pickerTitle}>Select Inventory Item</h3>
                <p className={styles.pickerSubtitle}>Choose which internal inventory this purchase maps to.</p>
              </div>
              <button type="button" className={styles.pickerCloseBtn} onClick={closeInventoryPicker}>
                <Icon name="remove-this-product" />
              </button>
            </div>

            {/* Search */}
            <div className={styles.pickerSearch}>
              <Icon name="icon-9c4a10ac" size={16} className={styles.pickerSearchIcon} />
              <input
                ref={pickerSearchRef}
                type="text"
                className={styles.pickerSearchInput}
                placeholder="Search by inventory ID..."
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
              />
              {inventorySearch && (
                <button type="button" className={styles.pickerSearchClear} onClick={() => setInventorySearch("")}>
                  <Icon name="remove-this-product" size={14} />
                </button>
              )}
            </div>

            {/* Grid */}
            <div className={styles.pickerGrid}>
              {inventoryLoading ? (
                <div className={styles.pickerLoading}>
                  <div className={styles.spinner}></div>
                  <span>Loading inventory...</span>
                </div>
              ) : filteredInventory.length === 0 ? (
                <div className={styles.pickerEmpty}>
                  <Icon name="icon-9c4a10ac" size={40} style={{opacity:0.3}} />
                  <span>No inventory items found.</span>
                </div>
              ) : (
                filteredInventory.map(inv => {
                  const isSelected = items.find(i => i.id === inventoryPickerFor)?.inventoryId === inv.inventoryId;
                  return (
                    <button
                      key={inv._id}
                      type="button"
                      className={`${styles.pickerCard} ${isSelected ? styles.pickerCardSelected : ""}`}
                      onClick={() => pickInventoryItem(inv)}
                    >
                      <div className={styles.pickerCardImg}>
                        {inv.imageUrl
                          ? <img src={inv.imageUrl} alt={inv.inventoryId} />
                          : <span className={styles.pickerCardNoImg}>No Image</span>
                        }
                        {isSelected && (
                          <span className={styles.pickerSelectedTick}>
                            <Icon name="icon-5ab11cbf" size={12} />
                          </span>
                        )}
                      </div>
                      <span className={styles.pickerCardId}>{inv.inventoryId}</span>
                      {inv.currentStock !== undefined && (
                        <span className={`${styles.pickerCardStock} ${inv.currentStock <= 10 ? styles.pickerCardLowStock : ""}`}>
                          Stock: {inv.currentStock ?? 0}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
