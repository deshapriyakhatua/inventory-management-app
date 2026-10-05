import IconButton from "@/components/ui/IconButton/IconButton";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import RecentListingCard from "../RecentListingCard/RecentListingCard";
import styles from "./RecentListings.module.css";

export default function RecentListings({
    listings,
    loading,
    refreshing,
    onRefresh,
    onDelete,
    onCopy,
    deleteButtonLoading,
    deletingListingId,
}) {
    return (
        <section className={styles.root}>
            <div className={styles.header}>
                <h2 className={styles.title}>Recently Added (Last {listings.length})</h2>
                <IconButton
                    name="refresh"
                    aria-label="Refresh Recent Listings"
                    title="Refresh Recent Listings"
                    onClick={onRefresh}
                    disabled={loading || refreshing}
                    loading={refreshing}
                />
            </div>
            {loading ? (
                <div className={styles.row} aria-busy="true" aria-label="Loading...">
                    {Array.from({ length: 5 }, (_, index) => (
                        <Skeleton key={index} className={styles.skeleton} />
                    ))}
                </div>
            ) : (
                <div className={styles.row}>
                    {listings.map((item) => (
                        <RecentListingCard
                            key={item.skuId}
                            item={item}
                            deleting={deleteButtonLoading && deletingListingId === item.skuId}
                            deleteDisabled={deleteButtonLoading}
                            onDelete={onDelete}
                            onCopy={onCopy}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
