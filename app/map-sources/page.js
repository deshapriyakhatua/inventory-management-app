"use client";
import { toast } from "sonner";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Select from "@/components/ui/Select/Select";
import Spinner from "@/components/ui/Spinner/Spinner";
import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import styles from "./page.module.css";

import { parseSearchQuery, matchesSearchTerms } from "../../utils/searchUtils";

export default function MapSourcesPage() {
  const [loading, setLoading] = useState(true);
  const [inventories, setInventories] = useState([]);
  const [filteredInventories, setFilteredInventories] = useState([]);
  const [sellers, setSellers] = useState([]);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInventory, setSelectedInventory] = useState(null);

  // Form State
  const [formSellerId, setFormSellerId] = useState("");
  const [formSellerSku, setFormSellerSku] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sellerError, setSellerError] = useState("");

  // Unmap Confirm State
  const [showUnmapConfirm, setShowUnmapConfirm] = useState(false);
  const [sourceToRemove, setSourceToRemove] = useState(null);
  const [unmapLoading, setUnmapLoading] = useState(false);

  useEffect(() => {
    fetchMappingData();
  }, []);

  const fetchMappingData = async () => {
    try {
      const res = await fetch("/api/employee/inventory/map-source");
      const result = await res.json();

      if (res.ok && result.success) {
        setInventories(result.inventory || []);
        setFilteredInventories(result.inventory || []);
        setSellers(result.sellers || []);
      } else {
        toast.error(result.error || "Failed to load mapping data", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error loading data", { id: "app-feedback", duration: 3000 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventories(inventories);
      return;
    }
    const { includeTerms, excludeTerms } = parseSearchQuery(searchQuery);
    const filtered = inventories.filter(inv => matchesSearchTerms(inv.inventoryId, includeTerms, excludeTerms));
    setFilteredInventories(filtered);
  }, [searchQuery, inventories]);

  const handleSelectInventory = (inv) => {
    setSelectedInventory(inv);
    // Reset form
    setFormSellerId("");
    setFormSellerSku("");
    setSellerError("");
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!selectedInventory || !formSellerId) {
      setSellerError("Please select an inventory item and a seller");
      toast.error("Please select an inventory item and a seller", { id: "app-feedback", duration: 3000 });
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        inventoryId: selectedInventory._id,
        sellerId: formSellerId,
        sellerProductId: formSellerSku
      };

      const res = await fetch("/api/employee/inventory/map-source", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Source mapped successfully", { id: "app-feedback", duration: 3000 });

        // Update local state arrays seamlessly
        const updatedInventory = result.data;
        setSelectedInventory(updatedInventory);
        setInventories(prev => prev.map(inv => inv._id === updatedInventory._id ? updatedInventory : inv));

        // Reset form
        setFormSellerId("");
        setFormSellerSku("");
      } else {
        toast.error(result.error || "Failed to map source", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error while mapping source", { id: "app-feedback", duration: 3000 });
    } finally {
      setSubmitting(false);
    }
  };

  const confirmRemoveSource = async () => {
    if (!selectedInventory || !sourceToRemove) return;

    setUnmapLoading(true);
    try {
      const res = await fetch(
        `/api/employee/inventory/map-source?inventoryId=${selectedInventory._id}&sellerId=${sourceToRemove}`,
        { method: "DELETE" }
      );
      const result = await res.json();

      if (res.ok && result.success) {
        toast.success("Source removed", { id: "app-feedback", duration: 3000 });
        const updatedInventory = result.data;
        setSelectedInventory(updatedInventory);
        setInventories(prev => prev.map(inv => inv._id === updatedInventory._id ? updatedInventory : inv));
      } else {
        toast.error(result.error || "Failed to remove source", { id: "app-feedback", duration: 3000 });
      }
    } catch (error) {
      toast.error("Network error while removing source", { id: "app-feedback", duration: 3000 });
    } finally {
      setUnmapLoading(false);
      setShowUnmapConfirm(false);
      setSourceToRemove(null);
    }
  };

  const closeUnmapConfirm = () => {
    setShowUnmapConfirm(false);
    setSourceToRemove(null);
  };

  if (loading) {
    return (
      <PageShell>
        <div className={styles.loading}>
          <Spinner size="lg" label="Loading your inventory catalog" />
          <p>Loading your inventory catalog...</p>
        </div>
      </PageShell>
    );
  }

  const hasSources = selectedInventory?.sources?.length > 0;

  return (
    <PageShell>
      <PageHeader
        title="Map Inventory Sources"
        subtitle="Attach multiple sellers and pricing to your internal inventory items."
      />

      <div className={styles.layout}>

        {/* Left Panel: Inventory Selection */}
        <Card padding="lg" className={styles.selectionPanel}>
          <h2 className={styles.panelTitle}>
            <Icon name="icon-5d77ebc6" size={18} />
            Select Inventory
          </h2>

          <Input
            type="text"
            aria-label="Search by Inventory ID"
            placeholder="Search by Inventory ID..."
            leading={<Icon name="icon-9c4a10ac" size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className={styles.inventoryList}>
            {filteredInventories.length === 0 ? (
              <EmptyState title="No items found." className={styles.listEmpty} />
            ) : (
              filteredInventories.map(inv => (
                <button
                  type="button"
                  key={inv._id}
                  aria-pressed={selectedInventory?._id === inv._id}
                  className={cx(styles.inventoryItem, selectedInventory?._id === inv._id && styles.isSelected)}
                  onClick={() => handleSelectInventory(inv)}
                >
                  <span className={styles.itemLeft}>
                    {inv.imageUrl ? (
                      <Image src={inv.imageUrl} alt={inv.inventoryId} width={44} height={44} className={styles.itemImage} />
                    ) : (
                      <span className={styles.imagePlaceholder}>NA</span>
                    )}
                    <span className={styles.itemText}>
                      <span className={styles.itemId}>{inv.inventoryId}</span>
                      {inv.sources?.length > 0 && (
                        <Badge tone="info">{inv.sources.length} mapped sources</Badge>
                      )}
                    </span>
                  </span>
                  <Icon name="icon-40639b2b" size={18} />
                </button>
              ))
            )}
          </div>
        </Card>

        {/* Right Panel: Mapping details */}
        <Card padding="lg" className={styles.mappingPanel}>
          {!selectedInventory ? (
            <EmptyState
              icon={<Icon name="icon-b99b6c9f" size={48} />}
              title="Select an inventory item from the left to view and edit its sources."
              className={styles.emptySelection}
            />
          ) : (
            <div className={styles.details}>
              {/* Selected Item header */}
              <div className={styles.selectedHeader}>
                {selectedInventory.imageUrl ? (
                  <Image src={selectedInventory.imageUrl} alt={selectedInventory.inventoryId} width={80} height={80} className={styles.selectedImage} />
                ) : (
                  <span className={cx(styles.selectedImage, styles.selectedPlaceholder)}>No IMG</span>
                )}
                <div className={styles.selectedText}>
                  <h3 className={styles.selectedId}>{selectedInventory.inventoryId}</h3>
                  <span className={styles.muted}>
                    Total linked sources: {selectedInventory.sources?.length || 0}
                  </span>
                </div>
              </div>

              {/* Current Sources */}
              <section className={styles.section}>
                <h4 id="mapped-suppliers-title" className={styles.sectionHeading}>Currently Mapped Suppliers</h4>

                <Table
                  aria-labelledby="mapped-suppliers-title"
                  columns={3}
                  empty={hasSources ? undefined : "This item currently has no sellers mapped to it."}
                >
                  <Table.Head>
                    <Table.Row hover={false}>
                      <Table.Cell as="th">Seller</Table.Cell>
                      <Table.Cell as="th">Their SKU</Table.Cell>
                      <Table.Cell as="th" className={styles.actionCell}>
                        <span className="srOnly">Unmap this seller</span>
                      </Table.Cell>
                    </Table.Row>
                  </Table.Head>
                  <Table.Body>
                    {hasSources && selectedInventory.sources.map((src, idx) => (
                      <Table.Row key={idx}>
                        <Table.Cell className={styles.sellerName}>
                          {src.sellerId ? src.sellerId.businessName : "Unknown Seller"}
                        </Table.Cell>
                        <Table.Cell>
                          {src.sellerProductId || <span className={styles.subtle}>Not provided</span>}
                        </Table.Cell>
                        <Table.Cell className={styles.actionCell}>
                          <IconButton
                            name="remove-this-product"
                            size="sm"
                            aria-label="Unmap this seller"
                            title="Unmap this seller"
                            className={styles.removeButton}
                            onClick={() => {
                              setSourceToRemove(src.sellerId?._id);
                              setShowUnmapConfirm(true);
                            }}
                          />
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </section>

              {/* Add new Source Form */}
              <section className={styles.section}>
                <h4 className={styles.sectionHeading}>Add / Update Supplier</h4>

                <form onSubmit={handleAddSource} className={styles.formGrid}>
                  <FormField label="Select Seller" error={sellerError} className={styles.fullWidth}>
                    <Select
                      value={formSellerId}
                      onChange={(e) => {
                        setFormSellerId(e.target.value);
                        setSellerError("");
                      }}
                      required
                    >
                      <option value="">-- Choose a Seller --</option>
                      {sellers.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.businessName} {s.contactPerson ? `(${s.contactPerson})` : ""}
                        </option>
                      ))}
                    </Select>
                  </FormField>

                  <FormField label="Seller's Product ID / SKU">
                    <Input
                      type="text"
                      placeholder="e.g. WH-TSH-01"
                      value={formSellerSku}
                      onChange={(e) => setFormSellerSku(e.target.value)}
                    />
                  </FormField>

                  <div className={cx(styles.fullWidth, styles.actions)}>
                    <Button
                      type="submit"
                      loading={submitting}
                      leftIcon={<Icon name="add-another-product" size={18} />}
                    >
                      Map Source
                    </Button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </Card>
      </div>

      {/* ── Unmap Confirm Modal ── */}
      <ConfirmModal
        isOpen={showUnmapConfirm}
        title="Unmap Seller?"
        message="Are you sure you want to remove this seller from your source mappings? This action cannot be undone."
        confirmLabel="Confirm Removal"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={unmapLoading}
        onConfirm={confirmRemoveSource}
        onClose={closeUnmapConfirm}
      />
    </PageShell>
  );
}
