"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";

export default function CreateNewListing() {
    const [verticalShort, setVerticalShort] = useState("");
    const [vertical, setVertical] = useState("");
    const [skuId, setSkuId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isGenerating, setIsGenerating] = useState(false);

    // Inventory Grid specific state
    const [inventoryItems, setInventoryItems] = useState([]);
    const [loadingInventoryItems, setLoadingInventoryItems] = useState(false);
    const [selectedInventoryIds, setSelectedInventoryIds] = useState([]);

    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);

    // Recent Listings specific state
    const [recentListings, setRecentListings] = useState([]);
    const [loadingRecentListings, setLoadingRecentListings] = useState(true);
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingListingId, setDeletingListingId] = useState(null);

    useEffect(() => {
        loadVerticals();
        loadData();
    }, []);

    const loadData = async () => {
        const data = await fetchLatestListings();
        setRecentListings(data);
    };

    const fetchLatestListings = async () => {
        setLoadingRecentListings(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "getListing",
            page: 1,
            pageSize: 5,
            sort: "newest_first"
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (result.status === 200) {
                console.log(result.message.listings);
                return result.message.listings;
            } else {
                console.error("API Error:", result.message);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingRecentListings(false);
        }
    };

    const handleDelete = async (skuId) => {
        setDeletingListingId(skuId);
        setDeleteButtonLoading(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"),
            action: "deleteListing",
            skuId: skuId,
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (result.status === 200) {
                setMessage({ text: result.message ? result.message : "Listing deleted successfully.", type: "success" });
                loadData();
            } else {
                console.error("API Error:", result.message);
                setMessage({ text: "Failed to delete listing.", type: "error" });
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
        const payload = {
            pin: sessionStorage.getItem("app_pin"),
            action: "getVertical",
            pageSize: 100,
            sort: "name_asc"
        };
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();
            if (result.status === 200) {
                setVerticals(result.data);
            } else {
                console.error("API Error:", result.message);
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoadingVerticals(false);
        }
    };

    const loadInventory = async () => {
        setLoadingInventoryItems(true);
        setSelectedInventoryIds([]);

        const payload = {
            pin: sessionStorage.getItem("app_pin"),
            action: "getInventory",
            vertical: vertical,
            page: 1,
            pageSize: 100, // Fetch lots of items to show in the grid
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            });
            const result = await response.json();

            if (result.status === 200) {
                setInventoryItems(result.data);
            } else {
                console.error("API Error:", result.message);
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setLoadingInventoryItems(false);
        }
    };

    const toggleSelection = (id) => {
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
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    pin: sessionStorage.getItem("app_pin"),
                    action: "generateSkuId", // Assuming we might have a specific endpoint, otherwise we could fallback
                    vertical: verticalShort,
                    itemCount: selectedInventoryIds.length
                }),
            });

            const result = await response.json();
            if (result.status === 200) {
                setSkuId(result.message);
                setMessage({ text: "SKU ID generated successfully.", type: "success" });
            } else {
                // Fallback to generateId if generateSkuId fails (incase backend doesn't have it yet)
                const fallbackResponse = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                    method: "POST",
                    body: JSON.stringify({
                        pin: sessionStorage.getItem("app_pin"),
                        action: "generateId",
                        vertical: verticalShort
                    }),
                });
                const fallbackResult = await fallbackResponse.json();
                if (fallbackResult.status === 200) {
                    setSkuId(fallbackResult.message + "-SKU");
                    setMessage({ text: "SKU ID generated successfully.", type: "success" });
                } else {
                    setMessage({ text: "Failed to generate SKU: " + (result.message || fallbackResult.message), type: "error" });
                }
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
        if (selectedInventoryIds.length === 0) {
            setMessage({ text: "Please select at least one inventory item.", type: "error" });
            return;
        }
        if (!skuId) {
            setMessage({ text: "Please auto-generate or enter a SKU ID.", type: "error" });
            return;
        }

        const storedPin = sessionStorage.getItem("app_pin");
        if (!storedPin) {
            setMessage({ text: "Session expired. Please log in again.", type: "error" });
            return;
        }

        setIsLoading(true);

        try {
            const payload = {
                pin: storedPin,
                action: "addListing",
                vertical: vertical,
                skuId: skuId,
                inventoryItems: selectedInventoryIds, // Send the chosen item IDs
            };

            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: { "Content-Type": "text/plain;charset=utf-8" },
                body: JSON.stringify(payload),
            });

            const text = await response.text();

            // Allow failing gracefully if endpoint handles differently
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                // If the app script throws HTML
                throw new Error("Invalid response from server");
            }

            if (result.status === 200) {
                setMessage({ text: "New listing created successfully!", type: "success" });

                // Reset specific form fields
                setSkuId("");
                setSelectedInventoryIds([]);
                // Optionally could reset vertical as well: setVertical(""); setVerticalShort("");
                loadData();
            } else {
                setMessage({ text: "Failed to create listing: " + (result.message || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ text: "Error submitting. Server endpoint might need to implement action: 'addListing'.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Create New Listing</h1>

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

                    {/* Scrollable Grid of Existing Inventory */}
                    {verticalShort && (
                        <div className={styles.inputGroup}>
                            <label className={styles.label}>
                                Select Inventory Items for Listing ({selectedInventoryIds.length} selected)
                            </label>
                            <div className={styles.inventoryGridContainer}>
                                {loadingInventoryItems ? (
                                    <p className={styles.loadingText}>Loading inventory...</p>
                                ) : inventoryItems.length > 0 ? (
                                    <div className={styles.grid}>
                                        {inventoryItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`${styles.gridItem} ${selectedInventoryIds.includes(item.id) ? styles.gridItemSelected : ""}`}
                                                onClick={() => toggleSelection(item.id)}
                                            >
                                                {selectedInventoryIds.includes(item.id) && (
                                                    <div className={styles.checkmark}>
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                            <polyline points="20 6 9 17 4 12"></polyline>
                                                        </svg>
                                                    </div>
                                                )}

                                                {item.driveId ? (
                                                    <div className={styles.imageContainer}>
                                                        <Image
                                                            src={`https://drive.google.com/thumbnail?id=${item.driveId}&sz=w200`}
                                                            alt={item.id}
                                                            referrerPolicy="no-referrer"
                                                            fill
                                                            style={{ objectFit: 'cover' }}
                                                            unoptimized
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className={styles.imagePlaceholder}>No Image</div>
                                                )}
                                                <div className={styles.itemInfo}>
                                                    <p className={styles.itemId}>{item.id}</p>
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
                                placeholder="e.g., SKU-CZ-ER-004"
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
                        disabled={isLoading || !verticalShort || selectedInventoryIds.length === 0 || !skuId}
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
            {recentListings.length > 0 && (
                <div className={styles.recentSection}>
                    <h2 className={styles.recentTitle}>Recently Added (Last {recentListings.length})</h2>
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
                                                    {inv.imageId ? (
                                                        <Image
                                                            src={`https://drive.google.com/thumbnail?id=${inv.imageId}&sz=w150`}
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
                                            <p className={styles.recentId}>{item.skuId}</p>
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
                                        <p className={styles.recentVertical}>{item.vertical}</p>
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
