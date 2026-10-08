import Icon from "@/components/ui/Icon/Icon";
import ItemThumbnail from "../ItemThumbnail/ItemThumbnail";
import StatusPill from "../StatusPill/StatusPill";
import RowActions from "../RowActions/RowActions";
import { calculateTotal, calculateFinalUnitPrice, formatDate } from "../../purchaseHistoryUtils";
import styles from "./GroupRow.module.css";

export default function GroupRow({
  group,
  isArchived,
  isExpanded,
  onToggle,
  onCopy,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  return (
    <>
      <tr
        className={`${styles.tr} ${styles.groupRow} ${isExpanded ? styles.expandedGroupRow : ""} ${isArchived ? styles.archivedRow : ""}`}
        onClick={() => onToggle(group.groupKey, isArchived)}
      >
        <td className={styles.td} onClick={(e) => e.stopPropagation()}>
          <button
            className={styles.expandChevronBtn}
            onClick={() => onToggle(group.groupKey, isArchived)}
            title={isExpanded ? "Collapse group" : "Expand group"}
          >
            <Icon name="icon-40639b2b" size={16} className={`${styles.chevronIcon} ${isExpanded?styles.chevronRotated:""}`} />
          </button>
        </td>
        <td className={`${styles.td} ${styles.invoiceCell}`}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <span className={styles.invoiceText}>{group.invoiceNo}</span>
            {group.invoiceNo !== "No Invoice" && (
              <button
                className={styles.copyBtnSmall}
                onClick={(e) => { e.stopPropagation(); onCopy(group.invoiceNo, "Invoice No"); }}
                title="Copy Invoice No"
              >
                <Icon name="copy-inventory-id" size={13} />
              </button>
            )}
          </div>
        </td>
        <td className={`${styles.td} ${styles.sellerCell}`}>{group.sellerName}</td>
        <td className={styles.td}>{formatDate(group.orderedOn)}</td>
        <td className={styles.td}>
          <span className={styles.itemCountBadge}>{group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}</span>
        </td>
        <td className={`${styles.td} ${styles.quantity}`}>{group.totalQuantity} units</td>
        <td className={`${styles.td} ${styles.total}`}>₹{group.totalAmount.toFixed(2)}</td>
        <td className={styles.td}>
          <StatusPill tone={group.deliveredCount === group.itemCount ? "received" : group.deliveredCount > 0 ? "partial" : "pending"}>
            {group.groupStatus}
          </StatusPill>
        </td>
        <td className={styles.td} style={{ textAlign: "right", paddingRight: "1.5rem" }}>
          <span style={{ fontSize: "0.8rem", color: isExpanded ? "#3b82f6" : "#64748b", fontWeight: 500 }}>
            {isExpanded ? "Hide items ▲" : "Show items ▼"}
          </span>
        </td>
      </tr>

      {/* Expanded Sub-table */}
      {isExpanded && (
        <tr className={styles.nestedRow}>
          <td colSpan="9" style={{ padding: 0 }}>
            <div className={styles.nestedContainer}>
              <div className={styles.nestedHeader}>
                <div className={styles.nestedHeaderTitle}>
                  <Icon name="pdf-preview" size={14} />
                  Invoice Items ({group.items.length}) — {group.sellerName} [{group.invoiceNo}]
                </div>
                <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                  Group Total: <strong style={{ color: "#fff" }}>₹{group.totalAmount.toFixed(2)}</strong> ({group.totalQuantity} units)
                </div>
              </div>

              <table className={styles.nestedTable}>
                <thead>
                  <tr>
                    <th className={styles.nestedTh}>Image</th>
                    <th className={styles.nestedTh}>Order Date</th>
                    <th className={styles.nestedTh}>Seller SKU</th>
                    <th className={styles.nestedTh}>Internal ID</th>
                    <th className={styles.nestedTh}>Qty</th>
                    <th className={styles.nestedTh}>Unit Price</th>
                    <th className={styles.nestedTh}>Final Unit Price</th>
                    <th className={styles.nestedTh}>Shipping & Tax</th>
                    <th className={styles.nestedTh}>Item Total</th>
                    <th className={styles.nestedTh}>Received On</th>
                    <th className={styles.nestedTh}>Status</th>
                    <th className={styles.nestedTh} style={{ textAlign: "center" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((p) => {
                    const itemTotal = calculateTotal(p);
                    const finalUnitPrice = calculateFinalUnitPrice(p);
                    const subtotal = p.quantity * p.price;
                    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
                    return (
                      <tr key={p._id}>
                        <td className={styles.nestedTd}>
                          <ItemThumbnail item={p} onMouseEnter={onImageMouseEnter} onMouseLeave={onImageMouseLeave} />
                        </td>
                        <td className={styles.nestedTd}>{formatDate(p.orderedOn)}</td>
                        <td className={styles.nestedTd}>{p.sellerProductId}</td>
                        <td className={`${styles.nestedTd} ${styles.idCell}`}>{p.inventoryId}</td>
                        <td className={`${styles.nestedTd} ${styles.quantity}`}>{p.quantity}</td>
                        <td className={`${styles.nestedTd} ${styles.price}`}>₹{p.price.toFixed(2)}</td>
                        <td className={`${styles.nestedTd} ${styles.finalUnitPrice}`}>₹{finalUnitPrice.toFixed(2)}</td>
                        <td className={styles.nestedTd} style={{ fontSize: "0.78rem", color: "#94a3b8" }}>
                          ₹{p.shippingFee || 0} ship | {p.taxPercentage || 0}% tax (₹{taxAmount.toFixed(2)})
                        </td>
                        <td className={`${styles.nestedTd} ${styles.total}`}>₹{itemTotal.toFixed(2)}</td>
                        <td className={styles.nestedTd}>{formatDate(p.receivedOn)}</td>
                        <td className={styles.nestedTd}>
                          <StatusPill tone={p.receivedOn ? "received" : "pending"}>
                            {p.receivedOn ? "Delivered" : "In-Transit"}
                          </StatusPill>
                        </td>
                        <td className={styles.nestedTd} style={{ textAlign: "center" }}>
                          <RowActions
                            item={p}
                            isArchived={isArchived}
                            style={{ justifyContent: "center" }}
                            onEdit={onEdit}
                            onArchive={onArchive}
                            onRestore={onRestore}
                            onDelete={onDelete}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
