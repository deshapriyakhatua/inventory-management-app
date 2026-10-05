"use client";
import { toast } from "sonner";

import React, { useState, useEffect, useEffectEvent, useCallback, useMemo, useRef } from "react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Spinner from "@/components/ui/Spinner/Spinner";
import InventoryPickerModal from "./_components/InventoryPickerModal/InventoryPickerModal";
import ProductsSection from "./_components/ProductsSection/ProductsSection";
import PurchaseTotals from "./_components/PurchaseTotals/PurchaseTotals";
import SupplierSection from "./_components/SupplierSection/SupplierSection";
import TimelineSection from "./_components/TimelineSection/TimelineSection";
import styles from "./page.module.css";

import { parseSearchQuery, matchesSearchTerms } from "@/utils/searchUtils";

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

  // Inline validation display (mirrors the rules enforced in handleSubmit)
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const markTouched = (key) => setTouched(prev => ({ ...prev, [key]: true }));
  const fieldError = (key, invalid, message) =>
    invalid && (submitAttempted || touched[key]) ? message : undefined;

  const getTodayDateString = () => new Date().toISOString().split("T")[0];

  // Mount-only load; useEffectEvent keeps it from re-running when fetchInitialData changes identity
  const loadInitial = useEffectEvent(() => fetchInitialData());

  useEffect(() => {
    loadInitial();
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
    setTouched({});
    setSubmitAttempted(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitAttempted(true);

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

    // The form is noValidate; keep the native constraint checks (Seller SKU required, min/max/step) it enforced before.
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
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
      <PageShell className={styles.shell}>
        <div className={styles.loading}>
          <Spinner size="lg" label="Loading purchase config" />
          <p>Loading purchase config...</p>
        </div>
      </PageShell>
    );
  }

  const itemErrors = (item) => ({
    inventoryId: fieldError(`${item.id}.inventoryId`, !item.inventoryId, "Please select an inventory item."),
    quantity: fieldError(`${item.id}.quantity`, !item.quantity, "Please enter a quantity."),
    price: fieldError(`${item.id}.price`, !item.price, "Please enter the unit price."),
  });

  return (
    <PageShell className={styles.shell}>
      <PageHeader
        title="Add Purchase"
        subtitle="Record inbound stock invoices. This safely logs expenses without mutating open inventory limits."
      />

      <Card padding="lg">
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <SupplierSection
            sellers={sellers}
            sellerId={formSellerId}
            sellerError={fieldError("seller", !formSellerId, "Please select a seller.")}
            onSellerChange={setFormSellerId}
            onSellerBlur={() => markTouched("seller")}
            invoiceNo={formInvoiceNo}
            onInvoiceNoChange={setFormInvoiceNo}
          />

          <ProductsSection
            items={items}
            sellerSelected={Boolean(formSellerId)}
            mappingsLoading={mappingsLoading}
            mappings={currentMappings}
            getItemErrors={itemErrors}
            onRemoveItem={removeItem}
            onSkuChange={handleItemSellerProductChange}
            onItemChange={handleItemChange}
            onItemBlur={(itemId, field) => markTouched(`${itemId}.${field}`)}
            onOpenPicker={openInventoryPicker}
            onAddItem={addItem}
          />

          <TimelineSection
            orderedOn={formOrderedOn}
            orderedOnError={fieldError("orderedOn", !formOrderedOn, "Please select the Ordered On date.")}
            onOrderedOnChange={setFormOrderedOn}
            onOrderedOnBlur={() => markTouched("orderedOn")}
            receivedOn={formReceivedOn}
            onReceivedOnChange={setFormReceivedOn}
          />

          <PurchaseTotals totals={totals} />

          <div className={styles.actions}>
            <Button type="submit" size="lg" loading={submitting}>
              {submitting
                ? `Saving ${items.length} purchase(s)...`
                : `Save ${items.length} Purchase${items.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </form>
      </Card>

      <InventoryPickerModal
        open={Boolean(inventoryPickerFor)}
        onClose={closeInventoryPicker}
        searchRef={pickerSearchRef}
        search={inventorySearch}
        onSearchChange={setInventorySearch}
        loading={inventoryLoading}
        inventory={filteredInventory}
        selectedInventoryId={items.find(i => i.id === inventoryPickerFor)?.inventoryId}
        onPick={pickInventoryItem}
      />
    </PageShell>
  );
}
