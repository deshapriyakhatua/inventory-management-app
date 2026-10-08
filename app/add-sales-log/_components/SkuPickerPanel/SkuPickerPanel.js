import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Spinner from "@/components/ui/Spinner/Spinner";
import cx from "@/components/ui/cx";
import styles from "./SkuPickerPanel.module.css";

export default function SkuPickerPanel({
  row,
  loadingListings,
  filteredListings,
  onPickerSearch,
  onSelectSku,
}) {
  return (
    <div className={styles.root}>
      <Input
        type="text"
        aria-label="Search SKU ID"
        placeholder="Search SKU ID…"
        value={row.pickerSearch}
        onChange={(e) => onPickerSearch(row.id, e.target.value)}
        leading={<Icon name="icon-9c4a10ac" size={16} />}
        autoFocus
      />
      <div className={styles.list}>
        {loadingListings ? (
          <div className={styles.status}>
            <Spinner size="sm" label="Loading listings" />
            <span>Loading listings…</span>
          </div>
        ) : filteredListings.length === 0 ? (
          <EmptyState
            className={styles.empty}
            icon={<Icon name="icon-9c4a10ac" size={28} />}
            title="No SKUs match your search."
          />
        ) : (
          filteredListings.slice(0, 60).map((item) => {
            const isSelected = row.skuId === item.skuId;
            return (
              <button
                key={item.skuId}
                type="button"
                aria-pressed={isSelected}
                className={cx(styles.item, isSelected && styles.itemSelected)}
                onClick={() => onSelectSku(row.id, item.skuId)}
              >
                <span className={styles.skuId}>{item.skuId}</span>
                <span className={styles.meta}>
                  {item.vertical} · {item.marketplace || "Direct"}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
