"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

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
  
  // Unmap Confirm State
  const [showUnmapConfirm, setShowUnmapConfirm] = useState(false);
  const [sourceToRemove, setSourceToRemove] = useState(null);
  const [unmapLoading, setUnmapLoading] = useState(false);

  const [message, setMsg] = useState({ text: "", type: "" });

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
        setMsg({ text: result.error || "Failed to load mapping data", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error loading data", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredInventories(inventories);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = inventories.filter(inv => inv.inventoryId.toLowerCase().includes(q));
    setFilteredInventories(filtered);
  }, [searchQuery, inventories]);

  const handleSelectInventory = (inv) => {
    setSelectedInventory(inv);
    // Reset form
    setFormSellerId("");
    setFormSellerSku("");
  };

  const handleAddSource = async (e) => {
    e.preventDefault();
    if (!selectedInventory || !formSellerId) {
      setMsg({ text: "Please select an inventory item and a seller", type: "error" });
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
        setMsg({ text: "Source mapped successfully", type: "success" });
        
        // Update local state arrays seamlessly
        const updatedInventory = result.data;
        setSelectedInventory(updatedInventory);
        setInventories(prev => prev.map(inv => inv._id === updatedInventory._id ? updatedInventory : inv));
        
        // Reset form
        setFormSellerId("");
        setFormSellerSku("");
      } else {
        setMsg({ text: result.error || "Failed to map source", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error while mapping source", type: "error" });
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
        setMsg({ text: "Source removed", type: "success" });
        const updatedInventory = result.data;
        setSelectedInventory(updatedInventory);
        setInventories(prev => prev.map(inv => inv._id === updatedInventory._id ? updatedInventory : inv));
      } else {
        setMsg({ text: result.error || "Failed to remove source", type: "error" });
      }
    } catch (error) {
      setMsg({ text: "Network error while removing source", type: "error" });
    } finally {
      setUnmapLoading(false);
      setShowUnmapConfirm(false);
      setSourceToRemove(null);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingSpinner}>
          <div className={styles.spinner}></div>
          <p>Loading your inventory catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Map Inventory Sources</h1>
        <p className={styles.subtitle}>Attach multiple sellers and pricing to your internal inventory items.</p>
      </div>

      <div className={styles.contentWrapper}>
        
        {/* Left Panel: Inventory Selection */}
        <div className={`${styles.panel} ${styles.selectionPanel}`}>
          <h2 className={styles.panelTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line>
            </svg>
            Select Inventory
          </h2>
          
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search by Inventory ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <div className={styles.inventoryList}>
            {filteredInventories.length === 0 ? (
              <p style={{ textAlign: "center", color: "#64748b", padding: "2rem" }}>No items found.</p>
            ) : (
              filteredInventories.map(inv => (
                <div 
                  key={inv._id}
                  className={`${styles.inventoryCard} ${selectedInventory?._id === inv._id ? styles.selected : ""}`}
                  onClick={() => handleSelectInventory(inv)}
                >
                  <div className={styles.cardLeft}>
                    {inv.imageUrl ? (
                      <img src={inv.imageUrl} alt={inv.inventoryId} className={styles.itemImage} />
                    ) : (
                      <div className={styles.imagePlaceholder}>NA</div>
                    )}
                    <div>
                      <h4 className={styles.itemId}>{inv.inventoryId}</h4>
                      {inv.sources?.length > 0 && (
                        <span className={styles.sourcesCount}>{inv.sources.length} mapped sources</span>
                      )}
                    </div>
                  </div>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={selectedInventory?._id === inv._id ? "#3b82f6" : "#475569"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Mapping details */}
        <div className={`${styles.panel} ${styles.mappingPanel}`}>
          {!selectedInventory ? (
            <div className={styles.emptySelection}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <p>Select an inventory item from the left to view and edit its sources.</p>
            </div>
          ) : (
            <>
              {/* Selected Item header */}
              <div className={styles.selectedItemHeader}>
                {selectedInventory.imageUrl ? (
                  <img src={selectedInventory.imageUrl} alt={selectedInventory.inventoryId} className={styles.selectedItemImage} />
                ) : (
                  <div className={styles.selectedItemImage} style={{ background: '#334155', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No IMG</div>
                )}
                <div>
                  <h3 className={styles.selectedItemId}>{selectedInventory.inventoryId}</h3>
                  <span style={{ color: "#94a3b8", fontSize: "0.95rem" }}>
                    Total linked sources: {selectedInventory.sources?.length || 0}
                  </span>
                </div>
              </div>

              {/* Current Sources */}
              <div className={styles.sourcesSection}>
                <h4 className={styles.sectionHeading}>Currently Mapped Suppliers</h4>
                
                {(!selectedInventory.sources || selectedInventory.sources.length === 0) ? (
                  <div className={styles.noSources}>This item currently has no sellers mapped to it.</div>
                ) : (
                  <div className={styles.sourcesGrid}>
                    {selectedInventory.sources.map((src, idx) => (
                      <div key={idx} className={styles.sourceCard}>
                        <button 
                          type="button" 
                          className={styles.removeSourceBtn}
                          onClick={() => {
                            setSourceToRemove(src.sellerId?._id);
                            setShowUnmapConfirm(true);
                          }}
                          title="Unmap this seller"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                        
                        <h4 className={styles.sellerName}>
                          {src.sellerId ? src.sellerId.businessName : "Unknown Seller"}
                        </h4>
                        
                        <div className={styles.sourceDetailRow}>
                          <span className={styles.sourceDetailLabel}>Their SKU:</span>
                          <span className={styles.sourceDetailValue}>{src.sellerProductId || <span style={{color: '#64748b'}}>Not provided</span>}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add new Source Form */}
              <div className={styles.mappingForm}>
                <h4 className={styles.sectionHeading}>Add / Update Supplier</h4>
                
                <form onSubmit={handleAddSource} className={styles.formGrid}>
                  <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                    <label className={styles.label}>Select Seller *</label>
                    <select 
                      className={styles.select}
                      value={formSellerId}
                      onChange={(e) => setFormSellerId(e.target.value)}
                      required
                    >
                      <option value="">-- Choose a Seller --</option>
                      {sellers.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.businessName} {s.contactPerson ? `(${s.contactPerson})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.label}>Seller's Product ID / SKU</label>
                    <input 
                      type="text" 
                      className={styles.input}
                      placeholder="e.g. WH-TSH-01"
                      value={formSellerSku}
                      onChange={(e) => setFormSellerSku(e.target.value)}
                    />
                  </div>

                  <div className={styles.fullWidth}>
                    <button type="submit" className={styles.submitBtn} disabled={submitting}>
                      {submitting ? "Mapping..." : (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                          Map Source
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>

            </>
          )}
        </div>
      </div>
      
      {/* ── Unmap Confirm Modal ── */}
      {showUnmapConfirm && (
        <div 
          className={styles.confirmOverlay} 
          onClick={() => { setShowUnmapConfirm(false); setSourceToRemove(null); }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 23, 42, 0.8)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}
        >
          <div 
            className={styles.confirmModal} 
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#1e293b", padding: "2rem", borderRadius: "12px", border: "1px solid #334155", maxWidth: "420px", textAlign: "center", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)" }}
          >
            <div style={{ background: "rgba(239, 68, 68, 0.1)", width: "60px", height: "60px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem" }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h3 style={{ color: "#fff", fontSize: "1.3rem", margin: "0 0 0.8rem 0" }}>Unmap Seller?</h3>
            <p style={{ color: "#94a3b8", margin: "0 0 2rem 0", lineHeight: "1.5" }}>
              Are you sure you want to remove this seller from your source mappings? This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button 
                onClick={() => { setShowUnmapConfirm(false); setSourceToRemove(null); }} 
                disabled={unmapLoading}
                style={{ background: "transparent", color: "#cbd5e1", border: "1px solid #475569", padding: "0.6rem 1.4rem", borderRadius: "8px", cursor: "pointer", transition: "all 0.2s" }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmRemoveSource} 
                disabled={unmapLoading}
                style={{ background: "#ef4444", color: "white", border: "none", padding: "0.6rem 1.4rem", borderRadius: "8px", cursor: "pointer", fontWeight: "600", transition: "all 0.2s" }}
              >
                {unmapLoading ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast message={message} onClose={() => setMsg({ text: "", type: "" })} />
    </div>
  );
}
