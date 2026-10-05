"use client";
import { toast } from "sonner";

import { useState, useEffect, useEffectEvent } from "react";
import Image from "next/image";
import ConfirmModal from "@/components/ConfirmModal/ConfirmModal";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import FormField from "@/components/ui/FormField/FormField";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import Select from "@/components/ui/Select/Select";
import RecentlyAdded from "./_components/RecentlyAdded/RecentlyAdded";
import styles from "./page.module.css";

import { fetchVerticalsData } from "@/utils/apiUtils";
import { useAuth } from "@/components/AuthProvider";

const INVENTORY_ID_ERROR = "Please generate or enter an Inventory ID.";
const VERTICAL_ERROR = "Please select a Vertical to generate an ID.";
const IMAGE_ERROR = "Please upload an image.";

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
    const [touched, setTouched] = useState({});

    const { user } = useAuth();

    // Confirmation Modal State
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Inline errors mirror the existing toast validations; shown after blur/submit.
    const verticalError = touched.vertical && !verticalShort ? VERTICAL_ERROR : undefined;
    const inventoryIdError = touched.inventoryId && !inventoryId ? INVENTORY_ID_ERROR : undefined;
    const imageError = touched.image && !imageFile ? IMAGE_ERROR : undefined;
    const markTouched = (field) => () => setTouched((prev) => ({ ...prev, [field]: true }));

    // Mount-only load; useEffectEvent keeps it from re-running when the loaders change identity
    const loadInitial = useEffectEvent(() => {
        loadVerticals();
        loadData();
    });

    useEffect(() => {
        loadInitial();
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

    const closeConfirmModal = () => {
        setShowConfirmModal(false);
        setItemToDelete(null);
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
                setTouched((prev) => ({ ...prev, vertical: true }));
                toast.error(VERTICAL_ERROR, { id: "app-feedback", duration: 3000 });
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
            setTouched((prev) => ({ ...prev, inventoryId: true, image: true }));
            toast.error(INVENTORY_ID_ERROR, { id: "app-feedback", duration: 3000 });
            return;
        }

        // Previously enforced by disabling the submit button while no image was selected.
        if (!imageFile) {
            setTouched((prev) => ({ ...prev, image: true }));
            toast.error(IMAGE_ERROR, { id: "app-feedback", duration: 3000 });
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
                setTouched({});
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
        <PageShell className={styles.shell}>
            <PageHeader title="Add New Inventory" />

            <Card padding="lg">
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <div className={styles.grid2}>
                        {/* Children passed as an array so FormField labels the inner control, not the row wrapper. */}
                        <FormField label="Vertical" id="vertical" error={verticalError}>
                            {[
                                <div key="row" className={styles.controlRow}>
                                    <div className={styles.controlGrow}>
                                        <Select
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
                                            disabled={isLoading || loadingVerticals}
                                            aria-invalid={verticalError ? true : undefined}
                                            aria-describedby={verticalError ? "vertical-error" : undefined}
                                        >
                                            <option value="">Select a vertical</option>
                                            {verticals.map((v) => (
                                                <option key={v.verticalName} value={`${v.verticalShort} - ${v.verticalName}`}>
                                                    {`${v.verticalShort} - ${v.verticalName}`}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>
                                    <IconButton
                                        name="refresh"
                                        variant="secondary"
                                        aria-label="Refresh"
                                        title="Refresh"
                                        onClick={() => loadVerticals(true)}
                                        disabled={loadingVerticals}
                                    />
                                </div>,
                            ]}
                        </FormField>

                        <FormField label="Inventory ID" id="inventoryId" required error={inventoryIdError}>
                            {[
                                <div key="row" className={styles.controlRow}>
                                    <div className={styles.controlGrow}>
                                        <Input
                                            type="text"
                                            id="inventoryId"
                                            value={inventoryId}
                                            onChange={(e) => setInventoryId(e.target.value.toUpperCase())}
                                            onBlur={markTouched("inventoryId")}
                                            placeholder="e.g., ER-0001"
                                            disabled={isLoading}
                                            required
                                            aria-invalid={inventoryIdError ? true : undefined}
                                            aria-describedby={inventoryIdError ? "inventoryId-error" : undefined}
                                        />
                                    </div>
                                    <Button
                                        variant="secondary"
                                        onClick={generateId}
                                        disabled={isLoading || isGenerating}
                                    >
                                        {isGenerating ? "Generating..." : inventoryId ? "Regenerate ID" : "Generate ID"}
                                    </Button>
                                </div>,
                            ]}
                        </FormField>
                    </div>

                    <FormField label="Upload Image" required error={imageError}>
                        <Input
                            type="file"
                            id="imageUpload"
                            accept="image/*"
                            onChange={handleImageChange}
                            onBlur={markTouched("image")}
                            disabled={isLoading}
                        />
                    </FormField>

                    {imagePreview && (
                        <div className={styles.preview}>
                            <p className={styles.previewLabel}>Image Preview:</p>
                            <div className={styles.previewFrame}>
                                <Image
                                    src={imagePreview}
                                    alt="Inventory Preview"
                                    fill
                                    className={styles.previewImage}
                                    unoptimized
                                />
                            </div>
                        </div>
                    )}

                    <div className={styles.actions}>
                        <Button type="submit" loading={isLoading}>
                            {isLoading ? "Adding Item..." : "Add to Inventory"}
                        </Button>
                    </div>
                </form>
            </Card>

            {(recentItems.length > 0 || loadingInventoryItems || refreshingRecentItems) && (
                <RecentlyAdded
                    items={recentItems}
                    user={user}
                    loading={loadingInventoryItems}
                    refreshing={refreshingRecentItems}
                    deleteButtonLoading={deleteButtonLoading}
                    deletingItemId={deletingItemId}
                    onRefresh={() => loadData(true)}
                    onDelete={handleDelete}
                    onCopy={copyInventoryId}
                />
            )}

            <ConfirmModal
                isOpen={showConfirmModal}
                title="Confirm Archiving"
                message="Are you sure you want to archive this inventory item? It will be hidden from all standard views."
                confirmLabel="Confirm Archive"
                cancelLabel="Cancel"
                variant="danger"
                onConfirm={confirmDelete}
                onClose={closeConfirmModal}
            />
        </PageShell>
    );
}
