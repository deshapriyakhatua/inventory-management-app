import Icon from "@/components/ui/Icon/Icon";
import styles from "./InventorySearchBar.module.css";

// Shared search input of the single and multi-select inventory modals.
export default function InventorySearchBar({ inputRef, value, onChange, onClear }) {
  return (
    <div className={styles.pickerSearch}>
      <Icon name="icon-9c4a10ac" size={16} className={styles.pickerSearchIcon} />
      <input
        ref={inputRef}
        type="text"
        className={styles.pickerSearchInput}
        placeholder="Search by Inventory ID or category..."
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          className={styles.pickerSearchClear}
          onClick={onClear}
        >
          <Icon name="remove-this-product" size={14} />
        </button>
      )}
    </div>
  );
}
