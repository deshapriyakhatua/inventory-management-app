import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import { formatCurrency } from "../../salesRecordsConfig";
import styles from "./TotalsSummary.module.css";

const TOTAL_ITEMS = [
    { key: "grossUnits", label: "Gross Units" },
    { key: "logisticsReturns", label: "Log Returns" },
    { key: "customerReturns", label: "Cust Returns" },
    { key: "cancellations", label: "Cancellations" },
    { key: "netUnits", label: "Net Units" },
    { key: "netSales", label: "Net Sales", currency: true },
    { key: "totalExpenses", label: "Expenses", currency: true },
    { key: "otherBenefits", label: "Benefits", currency: true },
    { key: "projectedBankSettlement", label: "Settlement", currency: true },
];

export default function TotalsSummary({ totals, visibleColumns, rowCount }) {
    return (
        <Card padding="sm" className={styles.root}>
            <div className={styles.header}>
                <Icon name="icon-3af5fc37" size={16} className={styles.headerIcon} />
                Visible Rows Totals ({rowCount})
            </div>
            <div className={styles.grid}>
                {TOTAL_ITEMS.filter(item => visibleColumns[item.key]).map(item => (
                    <div key={item.key} className={styles.box}>
                        <span className={styles.label}>{item.label}</span>
                        <span className={cx(styles.value, item.currency && styles.currency)}>
                            {item.currency ? formatCurrency(totals[item.key]) : totals[item.key]}
                        </span>
                    </div>
                ))}
            </div>
        </Card>
    );
}
