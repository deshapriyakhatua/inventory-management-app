import Checkbox from "@/components/ui/Checkbox/Checkbox";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import {
    ALL_COLUMNS, CURRENCY_KEYS, NUMERIC_KEYS,
    formatCurrency, formatDate, getMonthName,
} from "../../salesRecordsConfig";
import styles from "./RecordsTable.module.css";

const renderCellContent = (key, rec) => {
    const displayValue = rec[key];

    if (key === "timestamp") return <span className={styles.dateText}>{formatDate(displayValue)}</span>;
    if (key === "skuId") return <span className={styles.skuText}>{displayValue}</span>;
    if (key === "month") return <span className={styles.highlightText}>{getMonthName(displayValue)}</span>;
    if (key === "year" || key === "salesChannel") return <span className={styles.highlightText}>{displayValue || "—"}</span>;
    if (CURRENCY_KEYS.includes(key)) {
        return <span className={styles.currencyText}>{formatCurrency(displayValue)}</span>;
    }

    return displayValue !== undefined && displayValue !== null ? displayValue : <span className={styles.na}>—</span>;
};

export default function RecordsTable({
    records,
    loading,
    visibleColumns,
    selectedRecordIds,
    onToggleRow,
    onToggleAll,
    sortBy,
    sortOrder,
    onHeaderSort,
}) {
    const columns = ALL_COLUMNS.filter(c => visibleColumns[c.key]);
    const isEmpty = !loading && records.length === 0;

    return (
        <Table
            className={styles.root}
            loading={loading}
            loadingRows={8}
            columns={columns.length + 1}
            empty={isEmpty ? <EmptyState title="No matching records found." /> : undefined}
        >
            <Table.Head>
                <tr>
                    <Table.Cell as="th" className={styles.checkboxCell}>
                        <Checkbox
                            aria-label="Select all records"
                            checked={selectedRecordIds.size === records.length && records.length > 0}
                            onChange={onToggleAll}
                        />
                    </Table.Cell>
                    {columns.map(c => (
                        <Table.Cell
                            as="th"
                            key={`th-${c.key}`}
                            numeric={NUMERIC_KEYS.includes(c.key)}
                            aria-sort={sortBy === c.key ? (sortOrder === "asc" ? "ascending" : "descending") : undefined}
                        >
                            <button type="button" className={styles.sortButton} onClick={() => onHeaderSort(c.key)}>
                                {c.label}
                                {sortBy === c.key && (
                                    <Icon name="icon-b18c9210" size={12} sortOrder={sortOrder} />
                                )}
                            </button>
                        </Table.Cell>
                    ))}
                </tr>
            </Table.Head>
            <Table.Body>
                {records.map((rec, index) => {
                    const isSelected = selectedRecordIds.has(rec._id);
                    return (
                        <Table.Row key={`row-${rec._id}-${index}`} className={cx(isSelected && styles.rowSelected)}>
                            <Table.Cell className={styles.checkboxCell}>
                                <Checkbox
                                    aria-label={`Select ${rec.skuId}`}
                                    checked={isSelected}
                                    onChange={() => onToggleRow(rec._id)}
                                />
                            </Table.Cell>
                            {columns.map(c => (
                                <Table.Cell key={`td-${c.key}-${index}`} numeric={NUMERIC_KEYS.includes(c.key)}>
                                    {renderCellContent(c.key, rec)}
                                </Table.Cell>
                            ))}
                        </Table.Row>
                    );
                })}
            </Table.Body>
        </Table>
    );
}
