import IconButton from "@/components/ui/IconButton/IconButton";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import cx from "@/components/ui/cx";
import { ALL_COLUMNS, MONTHS, SALES_CHANNELS, generateYearOptions } from "../../salesRecordsConfig";
import styles from "./Toolbar.module.css";

export default function Toolbar({
    bulkActions,
    columnsMenu,
    searchQuery,
    onSearchChange,
    monthFilter,
    onMonthChange,
    yearFilter,
    onYearChange,
    channelFilter,
    onChannelChange,
    sortBy,
    onSortByChange,
    sortOrder,
    onSortOrderChange,
    refreshing,
    onRefresh,
}) {
    return (
        <div className={styles.root}>
            {bulkActions}

            <div className={styles.search}>
                <Input
                    type="text"
                    aria-label="Search SKU ID…"
                    placeholder="Search SKU ID…"
                    leading={<Icon name="icon-9c4a10ac" size={16} />}
                    value={searchQuery}
                    onChange={e => onSearchChange(e.target.value)}
                />
            </div>

            <div className={styles.filter}>
                <Select aria-label="Month" value={monthFilter} onChange={e => onMonthChange(e.target.value)}>
                    <option value="">All Months</option>
                    {MONTHS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </Select>
            </div>

            <div className={styles.filter}>
                <Select aria-label="Year" value={yearFilter} onChange={e => onYearChange(e.target.value)}>
                    <option value="">All Years</option>
                    {generateYearOptions().map(y => (
                        <option key={y} value={y}>{y}</option>
                    ))}
                </Select>
            </div>

            <div className={styles.filter}>
                <Select aria-label="Channel" value={channelFilter} onChange={e => onChannelChange(e.target.value)}>
                    <option value="">All Channels</option>
                    {SALES_CHANNELS.map(c => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </Select>
            </div>

            {columnsMenu}

            <div className={styles.filter}>
                <Select aria-label="Sort" value={sortBy} onChange={e => onSortByChange(e.target.value)}>
                    {ALL_COLUMNS.map(c => (
                        <option key={`sort-${c.key}`} value={c.key}>Sort: {c.label}</option>
                    ))}
                </Select>
            </div>

            <div className={styles.filter}>
                <Select aria-label="Sort order" value={sortOrder} onChange={e => onSortOrderChange(e.target.value)}>
                    <option value="desc">Desc</option>
                    <option value="asc">Asc</option>
                </Select>
            </div>

            <IconButton
                name="refresh"
                variant="secondary"
                className={cx(refreshing && styles.isSpinning)}
                onClick={onRefresh}
                disabled={refreshing}
                title="Fetch Latest Data"
                aria-label="Fetch Latest Data"
            />
        </div>
    );
}
