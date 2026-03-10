"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";

export default function AddInventory() {
    const [inventoryId, setInventoryId] = useState("");
    const [brand, setBrand] = useState("");
    const [vertical, setVertical] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isGenerating, setIsGenerating] = useState(false);
    const [recentItems, setRecentItems] = useState([]);
    const [loadingInventoryItems, setLoadingInventoryItems] = useState(true);
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [brands, setBrands] = useState([]);
    const [loadingBrands, setLoadingBrands] = useState(true);
    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);


    useEffect(() => {
        loadBrands();
        loadVerticals();
        loadData();
    }, []);

    const loadData = async () => {
        const data = await fetchLatestInventory();
        setRecentItems(data);
    };

    const fetchLatestInventory = async () => {
        setLoadingInventoryItems(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "getInventory",
            page: 1,           // Always the first page
            pageSize: 5,       // Limit to 5 items
            sort: "newest_first" // Default, but good to be explicit
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 200) {
                return result.data; // Array of 5 latest items
            } else {
                console.error("API Error:", result.message);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingInventoryItems(false);
        }
    };

    const loadBrands = async () => {
        const data = await fetchBrands();
        setBrands(data);
    };

    const fetchBrands = async () => {
        setLoadingBrands(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "getBrand",
            pageSize: 100, // Get all brands for the dropdown
            sort: "name_asc"
        };
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 200) {
                return result.data; // Array of 5 latest items
            } else {
                console.error("API Error:", result.message);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingBrands(false);
        }
    };

    const loadVerticals = async () => {
        const data = await fetchVerticals();
        setVerticals(data);
    };

    const fetchVerticals = async () => {
        setLoadingVerticals(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "getVertical",
            pageSize: 100, // Get all verticals for the dropdown
            sort: "name_asc"
        };
        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 200) {
                return result.data; // Array of 5 latest items
            } else {
                console.error("API Error:", result.message);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingVerticals(false);
        }
    };

    const handleDelete = async (id) => {
        setDeletingItemId(id);
        setDeleteButtonLoading(true);
        const payload = {
            pin: sessionStorage.getItem("app_pin"), // Authenticate
            action: "deleteInventory",
            id: id,           // Always the first page
        };

        try {
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const result = await response.json();

            if (result.status === 200) {
                loadData();
            } else {
                console.error("API Error:", result.message);
            }
        } catch (error) {
            console.error("Network Error:", error);
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
        }
    };

    // Generate a random 6-character alphanumeric ID
    const generateId = async () => {
        try {
            setIsGenerating(true);
            setMessage({ text: "", type: "" });
            if (!brand || !vertical) {
                setMessage({ text: "Please enter both Brand and Vertical to generate an ID.", type: "error" });
                return;
            }
            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify({
                    pin: sessionStorage.getItem("app_pin"),
                    action: "generateId",
                    brand: brand,
                    vertical: vertical
                }),
            });

            const result = await response.json();
            if (result.status === 200) {
                setInventoryId(result.message); // This sets 'CZ-ER-004'
            } else {
                setMessage({ text: "Failed to generate ID: " + (result.message || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error generating ID:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsGenerating(false);
        }
    };


    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImageFile(file);
            // Create a preview URL for the selected image
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result);
            };
            reader.readAsDataURL(file);
        } else {
            setImageFile(null);
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage({ text: "", type: "" });

        if (!inventoryId) {
            setMessage({ text: "Please generate or enter an Inventory ID.", type: "error" });
            return;
        }

        // 1. Grab the PIN from storage
        const storedPin = sessionStorage.getItem("app_pin");

        if (!storedPin) {
            setMessage({ text: "Session expired. Please log in again.", type: "error" });
            return;
        }

        setIsLoading(true);

        try {
            let base64Image = "";
            if (imageFile) {
                // If there's an image, we need to send the base64 string
                base64Image = imagePreview.split(',')[1]; // extract base64 part
            }

            const payload = {
                pin: storedPin,
                action: "addInventory",
                id: inventoryId,
                brand: brand,
                vertical: vertical,
                imageName: imageFile ? imageFile.name : "",
                imageMimeType: imageFile ? imageFile.type : "",
                imageData: base64Image
            };

            const response = await fetch(process.env.NEXT_PUBLIC_SCRIPT_URL, {
                method: "POST",
                mode: "cors",
                headers: {
                    "Content-Type": "text/plain;charset=utf-8",
                },
                body: JSON.stringify(payload),
            });

            const text = await response.text();
            const result = JSON.parse(text);

            if (result.status === 200) {
                setMessage({ text: "Inventory item added successfully!", type: "success" });

                // Add to recent items
                const newItem = {
                    id: inventoryId,
                    brand: brand,
                    vertical: vertical,
                    imagePreview: imagePreview || "" // Store base64 preview
                };
                setRecentItems(prev => {
                    const updatedList = [newItem, ...prev].slice(0, 5);
                    localStorage.setItem("recent_inventory", JSON.stringify(updatedList));
                    return updatedList;
                });

                // Reset form
                setInventoryId("");
                setBrand("");
                setVertical("");
                setImageFile(null);
                setImagePreview(null);
                // Reset file input value natively
                document.getElementById('imageUpload').value = "";
            } else {
                setMessage({ text: "Failed to add inventory: " + (result.message || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
            loadData();
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Add New Inventory</h1>

                <form onSubmit={handleSubmit} className={styles.form}>

                    {/* Brand Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="brand" className={styles.label}>Brand</label>
                        <select
                            id="brand"
                            value={brand}
                            onChange={(e) => setBrand(e.target.value)}
                            className={styles.input}
                            disabled={isLoading || loadingBrands}
                        >
                            <option value="">Select a brand</option>
                            {brands.map((b) => (
                                <option key={b.brandName} value={b.brandShort}>
                                    {`${b.brandShort} - ${b.brandName}`}
                                </option>
                            ))}
                        </select>

                    </div>

                    {/* Vertical Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="vertical" className={styles.label}>Vertical</label>
                        <select
                            id="vertical"
                            value={vertical}
                            onChange={(e) => setVertical(e.target.value)}
                            className={styles.input}
                            disabled={isLoading || loadingVerticals}
                        >
                            <option value="">Select a vertical</option>
                            {verticals.map((v) => (
                                <option key={v.verticalName} value={v.verticalShort}>
                                    {`${v.verticalShort} - ${v.verticalName}`}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Inventory ID Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="inventoryId" className={styles.label}>Inventory ID</label>
                        <div className={styles.idRow}>
                            <input
                                type="text"
                                id="inventoryId"
                                value={inventoryId}
                                onChange={(e) => setInventoryId(e.target.value.toUpperCase())}
                                placeholder="e.g., CZ-ER-004"
                                className={styles.input}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={async () => await generateId()}
                                className={styles.generateBtn}
                                disabled={isLoading || isGenerating}
                            >
                                {isGenerating ? "Generating..." : inventoryId ? "Regenerate ID" : "Generate ID"}
                            </button>
                        </div>
                    </div>

                    {/* Image Upload Section */}
                    <div className={styles.inputGroup}>
                        <label htmlFor="imageUpload" className={styles.label}>Upload Image</label>
                        <input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageChange}
                            className={styles.fileInput}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Image Preview Section */}
                    {imagePreview && (
                        <div className={styles.previewContainer}>
                            <p className={styles.previewLabel}>Image Preview:</p>
                            <div style={{ position: 'relative', width: '100%', height: '250px' }}>
                                <Image
                                    src={imagePreview}
                                    alt="Inventory Preview"
                                    fill
                                    style={{ objectFit: 'contain' }}
                                    className={styles.previewImage}
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || (!inventoryId && !imageFile)}
                    >
                        {isLoading ? "Adding Item..." : "Add to Inventory"}
                    </button>

                </form>

                {/* Feedback Message */}
                {message.text && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Recent Inventory Section */}
            {recentItems.length > 0 && (
                <div className={styles.recentSection}>
                    <h2 className={styles.recentTitle}>Recently Added (Last {recentItems.length})</h2>
                    {loadingInventoryItems
                        ? <p>Loading...</p>
                        : <div className={styles.recentGrid}>
                            {recentItems.map((item) => (
                                <div key={item.id} className={styles.recentCard}>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(item.id)}
                                        className={styles.deleteBtn}
                                        title="Remove from recent"
                                        disabled={deleteButtonLoading}
                                    >
                                        {deleteButtonLoading && deletingItemId === item.id
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
                                    {item.driveId ? (
                                        <div className={styles.recentImageContainer}>
                                            <Image
                                                src={`https://drive.google.com/thumbnail?id=${item.driveId}&sz=w200`}
                                                alt={item.id}
                                                referrerPolicy="no-referrer"
                                                fill
                                                className={styles.recentImage}
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.recentImagePlaceholder}>No Image</div>
                                    )}
                                    <div className={styles.recentInfo}>
                                        <p className={styles.recentId}>{item.id}</p>
                                        <p className={styles.recentBrand}>
                                            {new Date(item.timestamp).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
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
