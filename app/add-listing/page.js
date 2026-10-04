"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";

import { fetchVerticalsData } from "../../utils/apiUtils";
import { useAuth } from "../../components/AuthProvider";
import MarketplaceLogo from "../../components/MarketplaceLogo/MarketplaceLogo";

export default function CreateNewListing() {
    const [verticalShort, setVerticalShort] = useState("");
    const [vertical, setVertical] = useState("");
    const [marketplace, setMarketplace] = useState("");
    const [skuId, setSkuId] = useState("");
    const [styleId, setStyleId] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const [isGenerating, setIsGenerating] = useState(false);
    const { user } = useAuth();

    // Inventory Grid specific state
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventoryItems, setLoadingInventoryItems] = useState(false);
    const [refreshingInventory, setRefreshingInventory] = useState(false);
    const [selectedItems, setSelectedItems] = useState([]);

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
            const response = await fetch("/api/employee/listing?limit=5");
            const result = await response.json();
            
            if (response.ok && result.success) {
                const fetchedListings = result.data || [];
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

    const handleDelete = async (skuId) => {
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);

        try {
            const response = await fetch(`/api/employee/listing?skuId=${skuId}`, {
                method: "DELETE",
            });
            const result = await response.json();
            if (response.ok && result.success) {
                toast.success("Listing deleted successfully.", { id: "app-feedback", duration: 3000 });
                loadData(true); 
            } else {
                toast.error(result.error || "Failed to delete listing.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingListingId(null);
        }
    };

    const handleCopySku = (sku) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(sku).then(() => {
                toast.success("SKU ID copied to clipboard!", { id: "app-feedback", duration: 3000 });
            }).catch(err => {
                console.error("Failed to copy:", err);
                toast.error("Failed to copy SKU ID.", { id: "app-feedback", duration: 3000 });
            });
        } else {
            toast.error("Clipboard copy not supported in this browser.", { id: "app-feedback", duration: 3000 });
        }
    };

    // Whenever vertical changes, load the inventory for that vertical
    useEffect(() => {
        if (verticalShort) {
            loadInventory();
        } else {
            setInventoryItems([]);
            // Do not clear selectedItems, allow persisting across selections
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

        try {
            const response = await fetch("/api/employee/inventory");
            const result = await response.json();

            if (response.ok) {
                const fetchedData = result.data || [];
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

    const toggleSelection = (item) => {
        setSkuId(""); // Clear SKU ID if selection changes
        setSelectedItems(prev =>
            prev.some(s => s.inventoryId === item.inventoryId)
                ? prev.filter(s => s.inventoryId !== item.inventoryId)
                : [...prev, { inventoryId: item.inventoryId, imageUrl: item.imageUrl, vertical: item.vertical }]
        );
    };

    const isSelectionCombo = () => {
        if (selectedItems.length <= 1) return false;
        const prefixes = new Set(selectedItems.map(item => item.inventoryId.split('-')[0]));
        return prefixes.size > 1;
    };

    const getEffectiveVerticalParams = () => {
        if (isSelectionCombo()) {
            return { verticalShort: "CMB", vertical: "Combo" };
        } else if (selectedItems.length > 0) {
            const firstItem = selectedItems[0];
            const vShort = firstItem.inventoryId.split('-')[0];
            return { verticalShort: vShort, vertical: firstItem.vertical || vertical };
        }
        return { verticalShort, vertical };
    };

    // Generate a random ID for SKU
    const generateSkuId = async () => {
        try {
            setIsGenerating(true);
            toast.dismiss("app-feedback");
            
            const params = getEffectiveVerticalParams();
            const effVerticalShort = params.verticalShort;

            if (!effVerticalShort) {
                toast.error("Please select a Vertical first or ensure items are selected.", { id: "app-feedback", duration: 3000 });
                return;
            }
            if (selectedItems.length === 0) {
                toast.error("Please select at least one inventory item.", { id: "app-feedback", duration: 3000 });
                return;
            }

            const response = await fetch(`/api/employee/listing/generate-sku?verticalShort=${effVerticalShort}&itemCount=${selectedItems.length}`);
            const result = await response.json();

            if (response.ok && result.success) {
                setSkuId(result.nextId);
                toast.success("SKU ID generated successfully.", { id: "app-feedback", duration: 3000 });
            } else {
                toast.error(result.error || "Failed to generate SKU ID.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Error generating SKU ID:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        toast.dismiss("app-feedback");

        const params = getEffectiveVerticalParams();
        const effVertical = params.vertical;

        if (!effVertical) {
            toast.error("Please ensure vertical or items are selected.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!marketplace) {
            toast.error("Please select a Marketplace.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (selectedItems.length === 0) {
            toast.error("Please select at least one inventory item.", { id: "app-feedback", duration: 3000 });
            return;
        }
        if (!skuId) {
            toast.error("Please auto-generate or enter a SKU ID.", { id: "app-feedback", duration: 3000 });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch("/api/employee/listing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skuId: skuId,
                    vertical: effVertical,
                    marketplace: marketplace,
                    inventoryItems: selectedItems.map(item => item.inventoryId),
                    styleId: marketplace === "Myntra" ? styleId.trim() : undefined,
                }),
            });

            const result = await response.json();

            if (response.ok && result.success) {
                toast.success("New listing created successfully!", { id: "app-feedback", duration: 3000 });

                // Reset specific form fields
                setSkuId("");
                setStyleId("");
                setSelectedItems([]);
                loadData(true); // Force fresh fetch to show the newly created listing
            } else {
                toast.error("Failed to create listing: " + (result.error || "Unknown error"), { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error submitting. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h1 className={styles.title} style={{ marginBottom: 0 }}>Create New Listing</h1>
                </div>

                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Marketplace Section */}
                    <div className={styles.inputGroup}>
                        <label className={styles.label}>Select Marketplace</label>
                        <div className={styles.marketplaceGrid}>
                            {['Amazon', 'Flipkart', 'Myntra', 'Meesho', 'Ajio', 'Shopsy', 'Website', 'Other'].map(mp => (
                                <button
                                    key={mp}
                                    type="button"
                                    className={`${styles.marketplacePill} ${marketplace === mp ? styles.marketplacePillActive : ''}`}
                                    onClick={() => setMarketplace(mp)}
                                    disabled={isLoading}
                                >
                                    <MarketplaceLogo marketplace={mp} size={20} />
                                    <span>{mp}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vertical Section */}
                    <div className={styles.inputGroup}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className={styles.label}>Select Vertical Type</label>
                            <button
                                type="button"
                                className={`${styles.refreshBtn} ${loadingVerticals ? styles.spinning : ''}`}
                                onClick={loadVerticals}
                                disabled={loadingVerticals}
                                title="Refresh Verticals"
                            >
                                <Icon name="refresh" size={16} />
                            </button>
                        </div>

                        {loadingVerticals ? (
                            <p className={styles.loadingText}>Loading verticals...</p>
                        ) : verticals.length > 0 ? (
                            <div className={styles.verticalGrid}>
                                {verticals.map((v) => {
                                    const isSelected = verticalShort === v.verticalShort && vertical === v.verticalName;
                                    return (
                                        <button
                                            key={v.verticalName}
                                            type="button"
                                            className={`${styles.verticalPill} ${isSelected ? styles.verticalPillActive : ''}`}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setVertical("");
                                                    setVerticalShort("");
                                                } else {
                                                    setVertical(v.verticalName);
                                                    setVerticalShort(v.verticalShort);
                                                }
                                            }}
                                            disabled={isLoading}
                                        >
                                            <span className={styles.verticalBadge}>{v.verticalShort}</span>
                                            <span className={styles.verticalName}>{v.verticalName}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className={styles.noItemsText}>No verticals available.</p>
                        )}
                    </div>

                    {/* Selected Items Strip */}
                    {selectedItems.length > 0 && (
                        <div className={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <label className={styles.label}>
                                    Selected Items ({selectedItems.length}) {isSelectionCombo() ? "- Combo Mode" : ""}
                                </label>
                            </div>
                            <div className={styles.recentImagesScrollContainer} style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid #1e293b', minHeight: '80px', display: 'flex', gap: '10px', overflowX: 'auto' }}>
                                {selectedItems.map(item => (
                                    <div key={item.inventoryId} className={styles.recentImageThumbWrapper} style={{ position: 'relative', flexShrink: 0, width: '60px' }}>
                                        <div style={{ position: 'relative', width: '60px', height: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => toggleSelection(item)} 
                                                style={{ position: 'absolute', top: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', color: 'white', border: 'none', borderBottomLeftRadius: '6px', width: '20px', height: '20px', fontSize: '14px', lineHeight: '14px', cursor: 'pointer', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                                title="Remove item"
                                            >
                                                ×
                                            </button>
                                            {item.imageUrl ? (
                                                <Image src={item.imageUrl} alt={item.inventoryId} fill style={{ objectFit: 'cover' }} unoptimized />
                                            ) : (
                                                <div className={styles.recentImagePlaceholderSmall} style={{ width: '100%', height: '100%', fontSize: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No Img</div>
                                            )}
                                        </div>
                                        <div className={styles.recentImageThumbId} style={{ fontSize: '0.6rem', textAlign: 'center', marginTop: '4px', wordBreak: 'break-all' }}>{item.inventoryId}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Scrollable Grid of Existing Inventory */}
                    {verticalShort && (
                        <div className={styles.inputGroup}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className={styles.label}>
                                    Select Inventory Items to Add
                                </label>
                                <button
                                    type="button"
                                    className={`${styles.refreshBtn} ${refreshingInventory ? styles.spinning : ''}`}
                                    onClick={() => loadInventory(true)}
                                    disabled={loadingInventoryItems || refreshingInventory}
                                    title="Refresh Inventory"
                                >
                                    <Icon name="refresh" size={16} />
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
                                                className={`${styles.gridItem} ${selectedItems.some(s => s.inventoryId === item.inventoryId) ? styles.gridItemSelected : ""}`}
                                                onClick={() => toggleSelection(item)}
                                            >
                                                {selectedItems.some(s => s.inventoryId === item.inventoryId) && (
                                                    <div className={styles.checkmark}>
                                                        <Icon name="icon-5ab11cbf" size={12} />
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
                                                            <Icon name="icon-b99b6c9f" size={24} style={{opacity:0.3}} />
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

                    {/* Style ID Section (Myntra) */}
                    {marketplace === "Myntra" && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="styleId" className={styles.label}>Style ID (Myntra)</label>
                            <input
                                type="text"
                                id="styleId"
                                value={styleId}
                                onChange={(e) => setStyleId(e.target.value)}
                                placeholder="e.g., 29481052"
                                className={styles.input}
                                disabled={isLoading}
                            />
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
                                disabled={isLoading || isGenerating || selectedItems.length === 0}
                            >
                                {isGenerating ? "Generating..." : skuId ? "Regenerate SKU" : "Generate SKU"}
                            </button>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || selectedItems.length === 0 || !skuId || !marketplace}
                    >
                        {isLoading ? "Creating Listing..." : "Create Listing"}
                    </button>

                </form>

                        </div>

            {/* Recent Listings Section */}
            {(recentListings.length > 0 || loadingRecentListings || refreshingRecentListings) && (
                <div className={styles.recentSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className={styles.recentTitle} style={{ marginBottom: 0 }}>Recently Added (Last {recentListings.length})</h2>
                        <button
                            type="button"
                            className={`${styles.refreshBtn} ${refreshingRecentListings ? styles.spinning : ''}`}
                            onClick={() => loadData(true)}
                            disabled={loadingRecentListings || refreshingRecentListings}
                            title="Refresh Recent Listings"
                        >
                            <Icon name="refresh" size={16} />
                        </button>
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
                                            ? <Icon name="refresh-loop" size={16} className={styles.deleteLoadingIcon} />
                                            : <Icon name="trash" size={16} className={styles.deleteIcon} />
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
                                                <Icon name="copy-inventory-id" size={14} />
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
