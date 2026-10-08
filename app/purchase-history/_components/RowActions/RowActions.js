import IconButton from "@/components/ui/IconButton/IconButton";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./RowActions.module.css";

export default function RowActions({ item, isArchived, align = "start", onEdit, onArchive, onRestore, onDelete }) {
  return (
    <div className={cx(styles.root, align === "center" && styles.alignCenter)}>
      {!isArchived && (
        <>
          <IconButton
            size="sm"
            icon={<Icon name="edit-inventory" size={14} />}
            onClick={() => onEdit(item)}
            title="Edit record"
            aria-label="Edit record"
          />
          <IconButton
            size="sm"
            icon={<Icon name="archive-this-record" size={14} />}
            onClick={() => onArchive(item)}
            title="Archive this record"
            aria-label="Archive this record"
          />
        </>
      )}
      {isArchived && (
        <>
          <IconButton
            size="sm"
            icon={<Icon name="restore-invoice" size={14} />}
            onClick={() => onRestore(item)}
            title="Restore record"
            aria-label="Restore record"
          />
          <IconButton
            size="sm"
            variant="danger"
            icon={<Icon name="delete-permanently" size={14} />}
            onClick={() => onDelete(item)}
            title="Delete permanently"
            aria-label="Delete permanently"
          />
        </>
      )}
    </div>
  );
}
