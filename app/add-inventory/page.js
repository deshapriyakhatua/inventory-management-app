"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";
import Toast from "../../components/Toast/Toast";
import { fetchVerticalsData } from "../../utils/apiUtils";
import { useAuth } from "../../components/AuthProvider";
import RefreshIcon from "@/components/RefreshIcon/RefreshIcon";

export default function AddInventory() {
    const [inventoryId, setInventoryId] = useState("");
    const [verticalShort, setVerticalShort] = useState("");
    const [vertical, setVertical] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState({ text: "", type: "" });
    const [isGenerating, setIsGenerating] = useState(false);
    const [recentItems, setRecentItems] = useState([]);
    const [loadingInventoryItems, setLoadingInventoryItems] = useState(true);
    const [refreshingRecentItems, setRefreshingRecentItems] = useState(false);
    const [deleteButtonLoading, setDeleteButtonLoading] = useState(false);
    const [deletingItemId, setDeletingItemId] = useState(null);
    const [verticals, setVerticals] = useState([]);
    const [loadingVerticals, setLoadingVerticals] = useState(true);

    const { user } = useAuth();

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        loadVerticals();
        loadData();
    }, []);

    const loadData = async (forceRefresh = false) => {
        const data = await fetchLatestInventory(forceRefresh);
        setRecentItems(data);
    };

    const fetchLatestInventory = async (forceRefresh = false) => {
        if (forceRefresh) {
            setRefreshingRecentItems(true);
        } else {
            setLoadingInventoryItems(true);
        }

        try {
            const response = await fetch("/api/employee/inventory/add");
            const result = await response.json();

            if (response.ok) {
                const items = result.data || [];
                localStorage.setItem("recent_inventory_data", JSON.stringify(items));
                // Invalidate the all-inventory timestamp so it fetches fresh data on next visit
                localStorage.removeItem("all_inventory_last_fetched");
                return items;
            } else {
                console.error("API Error:", result.error);
                return [];
            }
        } catch (error) {
            console.error("Network Error:", error);
            return [];
        } finally {
            setLoadingInventoryItems(false);
            setRefreshingRecentItems(false);
        }
    };

    const copyInventoryId = async (id) => {
        try {
            await navigator.clipboard.writeText(id);
            setMessage({ text: "Inventory ID copied to clipboard!", type: "success" });
        } catch (err) {
            console.error("Failed to copy:", err);
            setMessage({ text: "Failed to copy to clipboard.", type: "error" });
        }
    };

    const loadVerticals = async (forceRefresh = false) => {
        setLoadingVerticals(true);
        const data = await fetchVerticalsData(forceRefresh);
        setVerticals(data);
        setLoadingVerticals(false);
    };

    const handleDelete = (id) => {
        setItemToDelete(id);
        setShowConfirmModal(true);
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        
        const id = itemToDelete;
        setShowConfirmModal(false);
        setItemToDelete(null);
        
        setDeletingItemId(id);
        setDeleteButtonLoading(true);
        try {
            const response = await fetch(`/api/employee/inventory/add?id=${id}`, {
                method: "DELETE",
            });

            const result = await response.json();
            if (response.ok) {
                setMessage({ text: "Inventory archived successfully.", type: "success" });
                loadData(true);
            } else {
                setMessage({ text: result.error || "Failed to archive inventory.", type: "error" });
            }
        } catch (error) {
            console.error("Network Error:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
        }
    };

    const generateId = async () => {
        try {
            setIsGenerating(true);
            setMessage({ text: "", type: "" });
            if (!verticalShort) {
                setMessage({ text: "Please select a Vertical to generate an ID.", type: "error" });
                return;
            }
            const response = await fetch(`/api/employee/inventory/generate-id?verticalShort=${verticalShort}`);

            const result = await response.json();
            if (response.ok) {
                setInventoryId(result.nextId);
                setMessage({ text: "Inventory ID generated successfully.", type: "success" });
            } else {
                setMessage({ text: "Failed to generate ID: " + (result.error || "Unknown error"), type: "error" });
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

        setIsLoading(true);

        try {
            const formData = new FormData();
            formData.append("inventoryId", inventoryId);
            formData.append("vertical", vertical);
            formData.append("image", imageFile);

            const response = await fetch("/api/employee/inventory/add", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({ text: "Inventory item added successfully!", type: "success" });
                setInventoryId("");
                setVertical("");
                setVerticalShort("");
                setImageFile(null);
                setImagePreview(null);
                document.getElementById('imageUpload').value = "";
                loadData(true);
            } else {
                setMessage({ text: "Failed to add inventory: " + (result.error || "Unknown error"), type: "error" });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            setMessage({ text: "Network error. Please try again.", type: "error" });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>Add New Inventory</h1>

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.inputGroup}>
                        <label htmlFor="vertical" className={styles.label}>Vertical</label>
                        <div className={styles.inputWithRefresh}>
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
                        <button
                            type="button"
                            onClick={() => loadVerticals(true)}
                            className={styles.refreshBtn}
                            disabled={loadingVerticals}
                            title="Refresh"
                        >
                            <RefreshIcon />
                        </button>
                        </div>
                    </div>

                    <div className={styles.inputGroup}>
                        <label htmlFor="inventoryId" className={styles.label}>Inventory ID</label>
                        <div className={styles.idRow}>
                            <input
                                type="text"
                                id="inventoryId"
                                value={inventoryId}
                                onChange={(e) => setInventoryId(e.target.value.toUpperCase())}
                                placeholder="e.g., ER-0001"
                                className={styles.input}
                                disabled={isLoading}
                            />
                            <button
                                type="button"
                                onClick={generateId}
                                className={styles.generateBtn}
                                disabled={isLoading || isGenerating}
                            >
                                {isGenerating ? "Generating..." : inventoryId ? "Regenerate ID" : "Generate ID"}
                            </button>
                        </div>
                    </div>

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

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading || (!inventoryId || !imageFile)}
                    >
                        {isLoading ? "Adding Item..." : "Add to Inventory"}
                    </button>
                </form>

                <Toast
                    message={message}
                    onClose={() => setMessage({ text: "", type: "" })}
                />
            </div>

            {(recentItems.length > 0 || loadingInventoryItems || refreshingRecentItems) && (
                <div className={styles.recentSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h2 className={styles.recentTitle} style={{ marginBottom: 0 }}>Recently Added (Last {recentItems.length})</h2>
                        <button
                            type="button"
                            className={`${styles.refreshBtn} ${refreshingRecentItems ? styles.spinning : ''}`}
                            onClick={() => loadData(true)}
                            disabled={loadingInventoryItems || refreshingRecentItems}
                            title="Refresh Recent Inventory"
                        >
                            <RefreshIcon />
                        </button>
                    </div>
                    {loadingInventoryItems
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
                                {recentItems.map((item) => {
                                    const canArchive = user?.role === 'admin' || user?.role === 'superadmin' || item.addedBy === user?.id;
                                    return (
                                    <div key={item._id || item.inventoryId} className={styles.recentItemCard}>
                                        {canArchive && (
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(item._id || item.inventoryId)}
                                                className={styles.deleteBtn}
                                                title="Remove from recent"
                                                disabled={deleteButtonLoading}
                                            >
                                                {deleteButtonLoading && deletingItemId === (item._id || item.inventoryId)
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
                                        )}
                                    {item.imageUrl ? (
                                        <div className={styles.recentImageContainer}>
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.inventoryId}
                                                fill
                                                className={styles.recentImage}
                                                unoptimized
                                            />
                                        </div>
                                    ) : (
                                        <div className={styles.recentImagePlaceholder}>No Image</div>
                                    )}
                                    <div className={styles.recentInfo}>
                                        <div className={styles.recentIdRow}>
                                            <p className={styles.recentId}>{item.inventoryId}</p>
                                            <button
                                                type="button"
                                                className={styles.copyBtn}
                                                onClick={() => copyInventoryId(item.inventoryId)}
                                                title="Copy Inventory ID"
                                            >
                                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                            </button>
                                        </div>
                                        <p className={styles.recentDate}>
                                            {new Date(item.createdAt).toLocaleString('en-IN', {
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
                            );})}
                        </div>
                    }
                </div>
            )}
            {/* Confirmation Modal */}
            {showConfirmModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                <line x1="12" y1="9" x2="12" y2="13"></line>
                                <line x1="12" y1="17" x2="12.01" y2="17"></line>
                            </svg>
                            <h2>Confirm Archiving</h2>
                        </div>
                        <div className={styles.modalBody}>
                            <p className={styles.modalMessage}>
                                Are you sure you want to archive this inventory item? It will be hidden from all standard views.
                            </p>
                        </div>
                        <div className={styles.modalFooter}>
                            <button 
                                className={styles.cancelBtn} 
                                onClick={() => {
                                    setShowConfirmModal(false);
                                    setItemToDelete(null);
                                }}
                            >
                                Cancel
                            </button>
                            <button 
                                className={styles.deleteConfirmBtn}
                                onClick={confirmDelete}
                            >
                                Confirm Archive
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
