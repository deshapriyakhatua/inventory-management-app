"use client";

import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
import PageShell from "@/components/ui/PageShell/PageShell";
import InventoryPicker from "./_components/InventoryPicker/InventoryPicker";
import MarketplacePicker from "./_components/MarketplacePicker/MarketplacePicker";
import RecentListings from "./_components/RecentListings/RecentListings";
import SelectedItems from "./_components/SelectedItems/SelectedItems";
import SkuFields from "./_components/SkuFields/SkuFields";
import VerticalPicker from "./_components/VerticalPicker/VerticalPicker";
import { useListingForm } from "./_hooks/useListingForm";
import { useRecentListings } from "./_hooks/useRecentListings";
import styles from "./page.module.css";

export default function CreateNewListing() {
    const {
        recentListings, loadingRecentListings, refreshingRecentListings,
        deleteButtonLoading, deletingListingId,
        loadData, handleDelete, handleCopySku,
    } = useRecentListings();
    const {
        verticalShort, vertical, marketplace, setMarketplace, skuId, setSkuId,
        styleId, setStyleId, isLoading, isGenerating,
        inventoryItems, loadingInventoryItems, refreshingInventory, selectedItems,
        verticals, loadingVerticals, setSkuTouched,
        loadVerticals, loadInventory, toggleSelection, isSelectionCombo,
        generateSkuId, handleSubmit, toggleVertical, showError,
    } = useListingForm({ loadData });

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
