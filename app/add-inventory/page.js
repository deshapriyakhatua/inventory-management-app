"use client";
import { toast } from "sonner";

import Icon from "@/components/ui/Icon/Icon";


import { useState, useEffect } from "react";
import Image from "next/image";
import styles from "./page.module.css";

import { fetchVerticalsData } from "../../utils/apiUtils";
import { useAuth } from "../../components/AuthProvider";


export default function AddInventory() {
    const [inventoryId, setInventoryId] = useState("");
    const [verticalShort, setVerticalShort] = useState("");
    const [vertical, setVertical] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

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
            toast.success("Inventory ID copied to clipboard!", { id: "app-feedback", duration: 3000 });
        } catch (err) {
            console.error("Failed to copy:", err);
            toast.error("Failed to copy to clipboard.", { id: "app-feedback", duration: 3000 });
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
                toast.success("Inventory archived successfully.", { id: "app-feedback", duration: 3000 });
                loadData(true);
            } else {
                toast.error(result.error || "Failed to archive inventory.", { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Network Error:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
        } finally {
            setDeleteButtonLoading(false);
            setDeletingItemId(null);
        }
    };

    const generateId = async () => {
        try {
            setIsGenerating(true);
            toast.dismiss("app-feedback");
            if (!verticalShort) {
                toast.error("Please select a Vertical to generate an ID.", { id: "app-feedback", duration: 3000 });
                return;
            }
            const response = await fetch(`/api/employee/inventory/generate-id?verticalShort=${verticalShort}`);

            const result = await response.json();
            if (response.ok) {
                setInventoryId(result.nextId);
                toast.success("Inventory ID generated successfully.", { id: "app-feedback", duration: 3000 });
            } else {
                toast.error("Failed to generate ID: " + (result.error || "Unknown error"), { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Error generating ID:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
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
        toast.dismiss("app-feedback");

        if (!inventoryId) {
            toast.error("Please generate or enter an Inventory ID.", { id: "app-feedback", duration: 3000 });
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
                toast.success("Inventory item added successfully!", { id: "app-feedback", duration: 3000 });
                setInventoryId("");
                setVertical("");
                setVerticalShort("");
                setImageFile(null);
                setImagePreview(null);
                document.getElementById('imageUpload').value = "";
                loadData(true);
            } else {
                toast.error("Failed to add inventory: " + (result.error || "Unknown error"), { id: "app-feedback", duration: 3000 });
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Network error. Please try again.", { id: "app-feedback", duration: 3000 });
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
                            <Icon name="refresh" size={16} />
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
                            <Icon name="refresh" size={16} />
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
                                                    ? <Icon name="refresh-loop" size={16} className={styles.deleteLoadingIcon} />
                                                    : <Icon name="trash" size={16} className={styles.deleteIcon} />
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
                                                <Icon name="copy-inventory-id" size={14} />
                                            </button>
                                        </div>
                                        <p className={styles.recentDate}>
                                            {item?.createdAt ? new Date(item.createdAt).toLocaleString('en-IN', {
                                                day: 'numeric',
                                                month: 'short',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            }) : ''}
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
                            <Icon name="icon-cfd589e1" size={24} />
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
