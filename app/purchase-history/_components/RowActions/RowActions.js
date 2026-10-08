import Icon from "@/components/ui/Icon/Icon";
import styles from "./RowActions.module.css";

export default function RowActions({ item, isArchived, style, onEdit, onArchive, onRestore, onDelete }) {
  return (
    <div className={styles.actionGroup} style={style}>
      {!isArchived && (
        <>
          <button className={styles.editBtn} onClick={() => onEdit(item)} title="Edit record">
            <Icon name="edit-inventory" size={14} />
          </button>
          <button className={styles.archiveBtn} onClick={() => onArchive(item)} title="Archive this record">
            <Icon name="archive-this-record" size={14} />
          </button>
        </>
      )}
      {isArchived && (
        <>
          <button className={styles.restoreBtn} onClick={() => onRestore(item)} title="Restore record">
            <Icon name="restore-invoice" size={14} />
          </button>
          <button className={styles.deleteBtn} onClick={() => onDelete(item)} title="Delete permanently">
            <Icon name="delete-permanently" size={14} />
          </button>
        </>
      )}
    </div>
  );
}
