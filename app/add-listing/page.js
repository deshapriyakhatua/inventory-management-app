"use client";
import { toast } from "sonner";

import { useState, useEffect, useEffectEvent } from "react";
import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import { fetchVerticalsData } from "@/utils/apiUtils";
import { useAuth } from "@/components/AuthProvider";
import InventoryPicker from "./_components/InventoryPicker/InventoryPicker";
import MarketplacePicker from "./_components/MarketplacePicker/MarketplacePicker";
import RecentListings from "./_components/RecentListings/RecentListings";
import SelectedItems from "./_components/SelectedItems/SelectedItems";
import SkuFields from "./_components/SkuFields/SkuFields";
import VerticalPicker from "./_components/VerticalPicker/VerticalPicker";
import styles from "./page.module.css";

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

    // Inline validation: mirrors the checks in handleSubmit, shown after submit (SKU also after blur)
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [skuTouched, setSkuTouched] = useState(false);

    // Mount-only load; useEffectEvent keeps it from re-running when the loaders change identity
    const loadInitial = useEffectEvent(() => {
        loadVerticals();
        loadData();
    });

    useEffect(() => {
        loadInitial();
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
    const onVerticalChange = useEffectEvent(() => loadInventory());

    useEffect(() => {
        if (verticalShort) {
            onVerticalChange();
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
        setSubmitAttempted(true);

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
                setSubmitAttempted(false);
                setSkuTouched(false);
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

    const toggleVertical = (v, isSelected) => {
        if (isSelected) {
            setVertical("");
            setVerticalShort("");
        } else {
            setVertical(v.verticalName);
            setVerticalShort(v.verticalShort);
        }
    };

    // Same rules and messages as handleSubmit
    const effectiveParams = getEffectiveVerticalParams();
    const errors = {
        vertical: !effectiveParams.vertical ? "Please ensure vertical or items are selected." : undefined,
        marketplace: !marketplace ? "Please select a Marketplace." : undefined,
        items: selectedItems.length === 0 ? "Please select at least one inventory item." : undefined,
        skuId: !skuId ? "Please auto-generate or enter a SKU ID." : undefined,
    };
    const showError = (field) => (submitAttempted || (field === "skuId" && skuTouched) ? errors[field] : undefined);

    return (
        <PageShell className={styles.shell}>
            <PageHeader title="Create New Listing" />

            <Card padding="lg">
                <form onSubmit={handleSubmit} className={styles.form} noValidate>
                    <MarketplacePicker
                        value={marketplace}
                        onChange={setMarketplace}
                        disabled={isLoading}
                        error={showError("marketplace")}
                    />

                    <VerticalPicker
                        verticals={verticals}
                        loading={loadingVerticals}
                        verticalShort={verticalShort}
                        vertical={vertical}
                        onToggle={toggleVertical}
                        onRefresh={loadVerticals}
                        disabled={isLoading}
                        error={showError("vertical")}
                    />

                    {selectedItems.length > 0 && (
                        <SelectedItems
                            items={selectedItems}
                            isCombo={isSelectionCombo()}
                            onRemove={toggleSelection}
                        />
                    )}

                    {verticalShort && (
                        <InventoryPicker
                            items={inventoryItems}
                            selectedItems={selectedItems}
                            loading={loadingInventoryItems}
                            refreshing={refreshingInventory}
                            onToggle={toggleSelection}
                            onRefresh={() => loadInventory(true)}
                            error={showError("items")}
                        />
                    )}

                    <SkuFields
                        showStyleId={marketplace === "Myntra"}
                        styleId={styleId}
                        onStyleIdChange={(e) => setStyleId(e.target.value)}
                        skuId={skuId}
                        onSkuIdChange={(e) => setSkuId(e.target.value.toUpperCase())}
                        onSkuBlur={() => setSkuTouched(true)}
                        skuError={showError("skuId")}
                        skuDisabled={isLoading || !verticalShort}
                        disabled={isLoading}
                        onGenerate={async () => await generateSkuId()}
                        generateDisabled={isLoading || isGenerating || selectedItems.length === 0}
                        isGenerating={isGenerating}
                    />

                    <div className={styles.actions}>
                        <Button type="submit" loading={isLoading}>
                            {isLoading ? "Creating Listing..." : "Create Listing"}
                        </Button>
                    </div>
                </form>
            </Card>

            {(recentListings.length > 0 || loadingRecentListings || refreshingRecentListings) && (
                <RecentListings
                    listings={recentListings}
                    loading={loadingRecentListings}
                    refreshing={refreshingRecentListings}
                    onRefresh={() => loadData(true)}
                    onDelete={handleDelete}
                    onCopy={handleCopySku}
                    deleteButtonLoading={deleteButtonLoading}
                    deletingListingId={deletingListingId}
                />
            )}
        </PageShell>
    );
}
