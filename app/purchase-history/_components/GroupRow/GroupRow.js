import Badge from "@/components/ui/Badge/Badge";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
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
      <Table.Row
        className={cx(styles.groupRow, isExpanded && styles.isExpanded, isArchived && styles.isArchived)}
        onClick={() => onToggle(group.groupKey, isArchived)}
      >
        <Table.Cell onClick={(e) => e.stopPropagation()}>
          <IconButton
            size="sm"
            icon={<Icon name="icon-40639b2b" size={16} className={cx(styles.chevron, isExpanded && styles.chevronOpen)} />}
            onClick={() => onToggle(group.groupKey, isArchived)}
            aria-expanded={isExpanded}
            title={isExpanded ? "Collapse group" : "Expand group"}
            aria-label={isExpanded ? "Collapse group" : "Expand group"}
          />
        </Table.Cell>
        <Table.Cell>
          <div className={styles.invoice}>
            <span className={styles.invoiceText}>{group.invoiceNo}</span>
            {group.invoiceNo !== "No Invoice" && (
              <IconButton
                size="sm"
                icon={<Icon name="copy-inventory-id" size={13} />}
                onClick={(e) => { e.stopPropagation(); onCopy(group.invoiceNo, "Invoice No"); }}
                title="Copy Invoice No"
                aria-label="Copy Invoice No"
              />
            )}
          </div>
        </Table.Cell>
        <Table.Cell className={styles.seller}>{group.sellerName}</Table.Cell>
        <Table.Cell className={styles.nowrap}>{formatDate(group.orderedOn)}</Table.Cell>
        <Table.Cell>
          <Badge tone="accent">{group.itemCount} {group.itemCount === 1 ? 'item' : 'items'}</Badge>
        </Table.Cell>
        <Table.Cell numeric className={styles.strong}>{group.totalQuantity} units</Table.Cell>
        <Table.Cell numeric className={styles.total}>₹{group.totalAmount.toFixed(2)}</Table.Cell>
        <Table.Cell>
          <StatusPill tone={group.deliveredCount === group.itemCount ? "received" : group.deliveredCount > 0 ? "partial" : "pending"}>
            {group.groupStatus}
          </StatusPill>
        </Table.Cell>
        <Table.Cell className={styles.details}>
          <span className={cx(styles.detailsHint, isExpanded && styles.detailsHintOpen)}>
            {isExpanded ? "Hide items ▲" : "Show items ▼"}
          </span>
        </Table.Cell>
      </Table.Row>

      {isExpanded && (
        <Table.Row hover={false}>
          <Table.Cell colSpan={9} className={styles.nestedCell}>
            <div className={styles.nested}>
              <div className={styles.nestedHeader}>
                <div className={styles.nestedTitle}>
                  <Icon name="pdf-preview" size={14} />
                  Invoice Items ({group.items.length}) — {group.sellerName} [{group.invoiceNo}]
                </div>
                <div className={styles.nestedMeta}>
                  Group Total: <strong className={styles.nestedTotal}>₹{group.totalAmount.toFixed(2)}</strong> ({group.totalQuantity} units)
                </div>
              </div>

              <Table className={styles.nestedTable} columns={12} maxHeight="none">
                <Table.Head>
                  <Table.Row hover={false}>
                    <Table.Cell as="th">Image</Table.Cell>
                    <Table.Cell as="th">Order Date</Table.Cell>
                    <Table.Cell as="th">Seller SKU</Table.Cell>
                    <Table.Cell as="th">Internal ID</Table.Cell>
                    <Table.Cell as="th" numeric>Qty</Table.Cell>
                    <Table.Cell as="th" numeric>Unit Price</Table.Cell>
                    <Table.Cell as="th" numeric>Final Unit Price</Table.Cell>
                    <Table.Cell as="th">Shipping & Tax</Table.Cell>
                    <Table.Cell as="th" numeric>Item Total</Table.Cell>
                    <Table.Cell as="th">Received On</Table.Cell>
                    <Table.Cell as="th">Status</Table.Cell>
                    <Table.Cell as="th" className={styles.center}>Actions</Table.Cell>
                  </Table.Row>
                </Table.Head>
                <Table.Body>
                  {group.items.map((p) => {
                    const itemTotal = calculateTotal(p);
                    const finalUnitPrice = calculateFinalUnitPrice(p);
                    const price = Number(p.price) || 0;
                    const subtotal = (Number(p.quantity) || 0) * price;
                    const taxAmount = (subtotal * (p.taxPercentage || 0)) / 100;
                    return (
                      <Table.Row key={p._id}>
                        <Table.Cell>
                          <ItemThumbnail item={p} onMouseEnter={onImageMouseEnter} onMouseLeave={onImageMouseLeave} />
                        </Table.Cell>
                        <Table.Cell className={styles.nowrap}>{formatDate(p.orderedOn)}</Table.Cell>
                        <Table.Cell>{p.sellerProductId}</Table.Cell>
                        <Table.Cell className={styles.id}>{p.inventoryId}</Table.Cell>
                        <Table.Cell numeric className={styles.strong}>{p.quantity}</Table.Cell>
                        <Table.Cell numeric>₹{price.toFixed(2)}</Table.Cell>
                        <Table.Cell numeric className={styles.finalPrice}>₹{finalUnitPrice.toFixed(2)}</Table.Cell>
                        <Table.Cell className={styles.muted}>
                          ₹{p.shippingFee || 0} ship | {p.taxPercentage || 0}% tax (₹{taxAmount.toFixed(2)})
                        </Table.Cell>
                        <Table.Cell numeric className={styles.total}>₹{itemTotal.toFixed(2)}</Table.Cell>
                        <Table.Cell className={styles.nowrap}>{formatDate(p.receivedOn)}</Table.Cell>
                        <Table.Cell>
                          <StatusPill tone={p.receivedOn ? "received" : "pending"}>
                            {p.receivedOn ? "Delivered" : "In-Transit"}
                          </StatusPill>
                        </Table.Cell>
                        <Table.Cell>
                          <RowActions
                            item={p}
                            isArchived={isArchived}
                            align="center"
                            onEdit={onEdit}
                            onArchive={onArchive}
                            onRestore={onRestore}
                            onDelete={onDelete}
                          />
                        </Table.Cell>
                      </Table.Row>
                    );
                  })}
                </Table.Body>
              </Table>
            </div>
          </Table.Cell>
        </Table.Row>
      )}
    </>
  );
}
