"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";
import { useAuth } from "../../components/AuthProvider";
import MarketplaceLogo from "../../components/MarketplaceLogo/MarketplaceLogo";

export default function CreateNewListing() {
    const [verticalShort, setVerticalShort] = useState("");
    const [vertical, setVertical] = useState("");
    const [marketplace, setMarketplace] = useState("");
    const [skuId, setSkuId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isGenerating, setIsGenerating] = useState(false);
    const { user } = useAuth();
    const [isMigrating, setIsMigrating] = useState(false);

    // Inventory Grid specific state
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventoryItems, setLoadingInventoryItems] = useState(false);
    const [refreshingInventory, setRefreshingInventory] = useState(false);
    const [selectedInventoryIds, setSelectedInventoryIds] = useState([]);

    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);

    // Recent Listings specific state
    const [recentListings, setRecentListings] = useState([]);
    const [loadingRecentListings, setLoadingRecentListings] = useState(true);
    const [refreshingRecentListings, setRefreshingRecentListings] = useState(false);
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);

    useEffect(() => {
        loadVerticals();
        loadData();
    }, []);

    const loadData = async (forceRefresh = false) => {
        const data = await fetchLatestListings(forceRefresh);
        setRecentListings(data);
    };

    const fetchLatestListings = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshingRecentListings(true);
        } else {
            setLoadingRecentListings(true);
        }

        try {
            const response = await fetch("/api/employee/listing?limit=10");
            const result = await response.json();
            
            if (response.ok && result.success) {
                const fetchedListings = result.data || [];
                // Update the local cache with fresh data
                localStorage.setItem("all_listings_data", JSON.stringify(fetchedListings));
                return fetchedListings.slice(0, 5);
            } else {
                console.error("API Error:", result.error);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingRecentListings(false);
            setRefreshingRecentListings(false);
        }
    };

    const handleMigrate = async () => {
        const pin = prompt("Enter your 4-digit PIN to authorize migration from Google Apps Script:");
        if (!pin) return;

        try {
            setIsMigrating(true);
            setMessage({ text: "Migrating data... Please wait.", type: "info" });
            
            const response = await fetch("/api/employee/listing/migrate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ pin }),
            });
            
            const result = await response.json();
            if (response.ok && result.success) {
                setMessage({ text: result.message, type: "success" });
                loadData(true);
            } else {
                setMessage({ text: result.error || "Migration failed.", type: "error" });
            }
        } catch (error) {
            console.error("Migration Error:", error);
            setMessage({ text: "Migration failed due to network error.", type: "error" });
        } finally {
            setIsMigrating(false);
        }
    };

    const handleDelete = async (skuId) => {
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/listing?skuId=${skuId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                setMessage({ text: "Listing deleted successfully.", type: "success" });
                loadData(true); 
            } else {
                setMessage({ text: result.error || "Failed to delete listing.", type: "error" });
            }
        } catch (error) {
            console.error("Network Error:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingListingId(null);
        }
    };

    const handleCopySku = (sku) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sku).then(() => {
                setMessage({ text: "SKU ID copied to clipboard!", type: "success" });
            }).catch(err => {
                console.error("Failed to copy:", err);
                setMessage({ text: "Failed to copy SKU ID.", type: "error" });
            });
        } else {
            setMessage({ text: "Clipboard copy not supported in this browser.", type: "error" });
        }
    };

    // Whenever vertical changes, load the inventory for that vertical
    useEffect(() => {
        if (verticalShort) {
            loadInventory();
        } else {
            setInventoryItems([]);
            setSelectedInventoryIds([]);
        }
    }, [verticalShort]);

    const loadVerticals = async () => {
        setLoadingVerticals(true);
        const pin = sessionStorage.getItem("app_pin");
        
        try {
            const currentVerticals = await fetchVerticalsData(pin);
            setVerticals(currentVerticals);
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoadingVerticals(false);
        }
    };

    const loadInventory = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshingInventory(true);
        } else {
            setLoadingInventoryItems(true);
        }
        setSelectedInventoryIds([]);

        if (!forceRefresh) {
            const cachedInventory = localStorage.getItem("all_inventory_data");
            if (cachedInventory) {
                try {
                    const parsed = JSON.parse(cachedInventory);
                    const verticalInventory = parsed.filter(item => item.vertical === vertical);
                    
                    // Sort by newest first
                    verticalInventory.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                    
                    setInventoryItems(verticalInventory.slice(0, 100));
                    setLoadingInventoryItems(false);
                    return;
                } catch (e) {
                    console.error("Failed to parse cached inventory", e);
                }
            }
        }

        try {
            const response = await fetch("/api/employee/inventory");
            const result = await response.json();

            if (response.ok) {
                const fetchedData = result.data || [];
                // Update cache
                localStorage.setItem("all_inventory_data", JSON.stringify(fetchedData));
                
                const verticalInventory = fetchedData.filter(item => item.vertical === vertical);
                setInventoryItems(verticalInventory);
            } else {
                console.error("API Error:", result.error);
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoadingInventoryItems(false);
            setRefreshingInventory(false);
        }
    };

    const toggleSelection = (id) => {
        setSkuId(""); // Clear SKU ID if selection changes
        setSelectedInventoryIds(prev =>
            prev.includes(id)
                ? prev.filter(selectedId => selectedId !== id)
                : [...prev, id]
        );
    };

    // Generate a random ID for SKU
    const generateSkuId = async () => {
        try {
            setIsGenerating(true);
            setMessage({ text: "", type: "" });
            if (!verticalShort) {
                setMessage({ text: "Please select a Vertical first.", type: "error" });
                return;
            }
            if (selectedInventoryIds.length === 0) {
                setMessage({ text: "Please select at least one inventory item.", type: "error" });
                return;
            }

            const response = await fetch(`/api/employee/listing/generate-sku?verticalShort=${verticalShort}&itemCount=${selectedInventoryIds.length}`);
            const result = await response.json();

            if (response.ok && result.success) {
                setSkuId(result.nextId);
                setMessage({ text: "SKU ID generated successfully.", type: "success" });
            } else {
                setMessage({ text: result.error || "Failed to generate SKU ID.", type: "error" });
            }
        } catch (error) {
            console.error("Error generating SKU ID:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!verticalShort) {
            setMessage({ text: "Please select a Vertical.", type: "error" });
            return;
        }
        if (!marketplace) {
            setMessage({ text: "Please select a Marketplace.", type: "error" });
            return;
        }
        if (selectedInventoryIds.length === 0) {
            setMessage({ text: "Please select at least one inventory item.", type: "error" });
            return;
        }
        if (!skuId) {
            setMessage({ text: "Please auto-generate or enter a SKU ID.", type: "error" });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/employee/listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skuId: skuId,
                    vertical: vertical,
                    marketplace: marketplace,
                    inventoryItems: selectedInventoryIds,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                setMessage({ text: "New listing created successfully!", type: "success" });

                // Reset specific form fields
                setSkuId("");
                setSelectedInventoryIds([]);
                loadData(true); // Force fresh fetch to show the newly created listing
            } else {
                setMessage({ text: "Failed to create listing: " + (result.error || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ text: "Error submitting. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className={styles.title} style={{ marginBottom: 0 }}>Create New Listing</h1>
                    <div style={{ display: 'flex', gap: '10px' }}>
                        {(user?.role === "admin" || user?.role === "superadmin") && (
                            <button
                                type="button"
                                className={`${styles.refreshBtn} ${isMigrating ? styles.spinning : ''}`}
                                onClick={handleMigrate}
                                disabled={isMigrating}
                                title="Import Data from Google Apps Script"
                                style={{ color: '#38bdf8' }}
                            >
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                Import Legacy
                            </button>
                        )}
                        <button
                            type="button"
                            className={`${styles.refreshBtn} ${refreshingRecentListings ? styles.spinning : ''}`}
                            onClick={() => loadData(true)}
                            disabled={loadingRecentListings || refreshingRecentListings}
                            title="Refresh Recent Listings"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <polyline points="1 20 1 14 7 14"></polyline>
                                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Vertical Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="vertical" className={styles.label}>Select Vertical Type</label>
                        <select
                            id="vertical"
                            value={verticalShort && vertical ? `${verticalShort} - ${vertical}` : ""}
                            onChange={(e) => {
                                const val = e.target.value;
                                if (val) {
                                    setVertical(val.split(' - ')[1]);
                                    setVerticalShort(val.split(' - ')[0]);
                                } else {
                                    setVertical("");
                                    setVerticalShort("");
                                }
                            }}
                            className={styles.input}
                            disabled={isLoading || loadingVerticals}
                        >
                            <option value="">Select a vertical</option>
                            {verticals.map((v) => (
                                <option key={v.verticalName} value={`${v.verticalShort} - ${v.verticalName}`}>
                                    {`${v.verticalShort} - ${v.verticalName}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Marketplace Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="marketplace" className={styles.label}>Select Marketplace</label>
                        <select
                            id="marketplace"
                            value={marketplace}
                            onChange={(e) => setMarketplace(e.target.value)}
                            className={styles.input}
                            disabled={isLoading}
                        >
                            <option value="">Select marketplace</option>
                            <option value="Flipkart">Flipkart</option>
                            <option value="Shopsy">Shopsy</option>
                            <option value="Amazon">Amazon</option>
                            <option value="Meesho">Meesho</option>
                            <option value="Myntra">Myntra</option>
                            <option value="Ajio">Ajio</option>
                            <option value="Website">Website</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    {/* Scrollable Grid of Existing Inventory */}
                    {verticalShort && (
                        <div className={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className={styles.label}>
                                    Select Inventory Items for Listing ({selectedInventoryIds.length} selected)
                                </label>
                                <button
                                    type="button"
                                    className={`${styles.refreshBtn} ${refreshingInventory ? styles.spinning : ''}`}
                                    onClick={() => loadInventory(true)}
                                    disabled={loadingInventoryItems || refreshingInventory}
                                    title="Refresh Inventory"
                                >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <polyline points="23 4 23 10 17 10"></polyline>
                                        <polyline points="1 20 1 14 7 14"></polyline>
                                        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
                                    </svg>
                                </button>
                            </div>
                            <div className={styles.inventoryGridContainer}>
                                {loadingInventoryItems ? (
                                    <p className={styles.loadingText}>Loading inventory...</p>
                                ) : inventoryItems.length > 0 ? (
                                    <div className={styles.grid}>
                                        {inventoryItems.map((item) => (
                                            <div
                                                key={item._id}
                                                className={`${styles.gridItem} ${selectedInventoryIds.includes(item.inventoryId) ? styles.gridItemSelected : ""}`}
                                                onClick={() => toggleSelection(item.inventoryId)}
                                            >
                                                {selectedInventoryIds.includes(item.inventoryId) && (
                                                    <div className={styles.checkmark}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </div>
                                                )}
                                                <div className={styles.imageContainer}>
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.inventoryId}
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className={styles.imagePlaceholder}>
                                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                                                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                                                <polyline points="21 15 16 10 5 21"></polyline>
                                                            </svg>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className={styles.itemInfo}>
                                                    <p className={styles.itemId}>{item.inventoryId}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className={styles.noItemsText}>No inventory found for this vertical.</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* SKU ID Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="skuId" className={styles.label}>Product SKU ID</label>
                        <div className={styles.idRow}>
                            <input
                                type="text"
                                id="skuId"
                                value={skuId}
                                onChange={(e) => setSkuId(e.target.value.toUpperCase())}
                                placeholder="e.g., ER-01-0001"
                                className={styles.input}
                                disabled={isLoading || !verticalShort}
                            />
                            <button
                                type="button"
                                onClick={async () => await generateSkuId()}
                                className={styles.generateBtn}
                                disabled={isLoading || isGenerating || !verticalShort || selectedInventoryIds.length === 0}
                            >
                                {isGenerating ? "Generating..." : skuId ? "Regenerate SKU" : "Generate SKU"}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || !verticalShort || selectedInventoryIds.length === 0 || !skuId || !marketplace}
                    >
                        {isLoading ? "Creating Listing..." : "Create Listing"}
                    </button>

                </form>

                <Toast
                    message={message}
                    onClose={() => setMessage({ text: "", type: "" })}
                />
            </div>

            {/* Recent Listings Section */}
            {(recentListings.length > 0 || loadingRecentListings || refreshingRecentListings) && (
                <div className={styles.recentSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className={styles.recentTitle} style={{ marginBottom: 0 }}>Recently Added (Last {recentListings.length})</h2>
                    </div>
                    {loadingRecentListings
                        ? <div className={styles.recentGrid}>
                            {Array.from({ length: 5 }).map((_, index) => (
                                <div key={index} className={styles.recentCard}>
                                    <div className={styles.recentImageContainer}>
                                        <div className={styles.recentImagePlaceholder}>
                                            <p>Loading...</p>
                                        </div>
                                    </div>
                                    <div className={styles.recentInfo}>
                                        <p className={styles.recentId}>Loading...</p>
                                        <p className={styles.recentDate}>Loading...</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        : <div className={styles.recentGrid}>
                            {recentListings.map((item) => (
                                <div key={item.skuId} className={styles.recentCard}>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.skuId)}
                                        className={styles.deleteBtn}
                                        title="Remove from recent"
                                        disabled={deleteButtonLoading}
                                    >
                                        {deleteButtonLoading && deletingListingId === item.skuId
                                            ? <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteLoadingIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 12a9 9 0 1 1-9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                                                <path d="M21 3v5h-5"></path>
                                            </svg>
                                            : <svg xmlns="http://www.w3.org/2000/svg" className={styles.deleteIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                            </svg>
                                        }
                                    </button>
                                    {item.inventoryItems && item.inventoryItems.length > 0 ? (
                                        <div className={styles.recentImagesScrollContainer}>
                                            {item.inventoryItems.map((inv) => (
                                                <div key={inv.inventoryId} className={styles.recentImageThumbWrapper}>
                                                    {inv.imageUrl ? (
                                                        <Image
                                                            src={inv.imageUrl}
                                                            alt={inv.inventoryId}
                                                            referrerPolicy="no-referrer"
                                                            fill
                                                            className={styles.recentImageThumb}
                                                            unoptimized
                                                        />
                                                    ) : (
                                                        <div className={styles.recentImagePlaceholderSmall}>No Image</div>
                                                    )}
                                                    <div className={styles.recentImageThumbId}>{inv.inventoryId}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className={styles.recentImagePlaceholder}>No Images Linked</div>
                                    )}
                                    <div className={styles.recentInfo}>
                                        <div className={styles.idRowWrapper}>
                                            <div className={styles.recentIdWithLogo}>
                                                <MarketplaceLogo marketplace={item.marketplace} size={18} />
                                                <p className={styles.recentId}>{item.skuId}</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleCopySku(item.skuId)}
                                                className={styles.copyBtn}
                                                title="Copy SKU ID"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '4px' }}>
                                            <p className={styles.recentVertical}>{item.vertical}</p>
                                            <span style={{ color: '#64748b', fontSize: '0.8rem' }}>•</span>
                                            <p className={styles.recentVertical} style={{ color: '#94a3b8' }}>{item.marketplace || 'Direct'}</p>
                                        </div>
                                        <p className={styles.recentDate}>
                                            {item.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : 'Recently added'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    }
                </div>
            )}
        </div>
    );
}
