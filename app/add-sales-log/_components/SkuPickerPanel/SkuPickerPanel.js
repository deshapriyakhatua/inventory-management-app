import Icon from "@/components/ui/Icon/Icon";
import styles from "./SkuPickerPanel.module.css";

export default function SkuPickerPanel({
  row,
  loadingListings,
  filteredListings,
  onPickerSearch,
  onSelectSku,
}) {
  return (
    <div className={styles.pickerPanel}>
      <div className={styles.pickerSearchWrap}>
        <Icon name="icon-9c4a10ac" size={15} className={styles.pickerSearchIcon} />
        <input
          type="text"
          placeholder="Search SKU ID…"
          value={row.pickerSearch}
          onChange={(e) => onPickerSearch(row.id, e.target.value)}
          className={styles.pickerSearch}
          autoFocus
        />
      </div>
      <div className={styles.pickerList}>
        {loadingListings ? (
          <div className={styles.pickerEmpty}>Loading listings…</div>
        ) : filteredListings.length === 0 ? (
          <div className={styles.pickerEmpty}>No SKUs match your search.</div>
        ) : (
          filteredListings.slice(0, 60).map((item) => (
            <div
              key={item.skuId}
              className={`${styles.pickerItem} ${row.skuId === item.skuId ? styles.pickerItemSelected : ""}`}
              onClick={() => onSelectSku(row.id, item.skuId)}
            >
              <span className={styles.pickerSkuId}>{item.skuId}</span>
              <span className={styles.pickerMeta}>
                {item.vertical} · {item.marketplace || "Direct"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
