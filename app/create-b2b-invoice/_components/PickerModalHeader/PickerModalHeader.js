import Icon from "@/components/ui/Icon/Icon";
import styles from "./PickerModalHeader.module.css";

// Shared header of the inventory picker, multi-select and company settings modals.
export default function PickerModalHeader({ title, subtitle, onClose }) {
  return (
    <div className={styles.pickerHeader}>
      <div>
        <h3 className={styles.pickerTitle}>{title}</h3>
        <p className={styles.pickerSubtitle}>
          {subtitle}
        </p>
      </div>
      <button
        type="button"
        className={styles.pickerCloseBtn}
        onClick={onClose}
      >
        <Icon name="remove-this-product" />
      </button>
    </div>
  );
}
