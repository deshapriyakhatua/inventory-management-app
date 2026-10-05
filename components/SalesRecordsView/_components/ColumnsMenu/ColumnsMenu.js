import Button from "@/components/ui/Button/Button";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Icon from "@/components/ui/Icon/Icon";
import { ALL_COLUMNS } from "../../salesRecordsConfig";
import styles from "./ColumnsMenu.module.css";

export default function ColumnsMenu({ menuRef, isOpen, onToggle, visibleColumns, onToggleColumn }) {
    return (
        <div className={styles.root} ref={menuRef}>
            <Button
                variant="secondary"
                aria-haspopup="true"
                aria-expanded={isOpen}
                onClick={onToggle}
                rightIcon={<Icon name="click-to-select-from-inventory" size={14} />}
            >
                Columns
            </Button>
            {isOpen && (
                <div className={styles.menu}>
                    {ALL_COLUMNS.map(c => (
                        <label key={c.key} className={styles.item}>
                            <Checkbox
                                className={styles.checkbox}
                                checked={!!visibleColumns[c.key]}
                                onChange={() => onToggleColumn(c.key)}
                            />
                            {c.label}
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
}
