import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./BulkActionsMenu.module.css";

export default function BulkActionsMenu({ menuRef, selectedCount, isOpen, onToggle, viewArchived, onAction }) {
    return (
        <div className={styles.root} ref={menuRef}>
            <Button
                variant="secondary"
                className={styles.trigger}
                aria-haspopup="menu"
                aria-expanded={isOpen}
                onClick={onToggle}
                rightIcon={<Icon name="click-to-select-from-inventory" size={14} />}
            >
                Actions ({selectedCount})
            </Button>
            {isOpen && (
                <div className={styles.menu} role="menu">
                    {!viewArchived ? (
                        <button type="button" role="menuitem" className={styles.item} onClick={() => onAction("archive")}>
                            <Icon name="archive-this-record" size={14} />
                            Archive Selected
                        </button>
                    ) : (
                        <>
                            <button type="button" role="menuitem" className={styles.item} onClick={() => onAction("restore")}>
                                <Icon name="icon-eec919d0" size={14} />
                                Restore Selected
                            </button>
                            <button type="button" role="menuitem" className={cx(styles.item, styles.danger)} onClick={() => onAction("delete")}>
                                <Icon name="trash" size={14} />
                                Permanently Delete
                            </button>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
