import Table from "@/components/ui/Table/Table";
import cx from "@/components/ui/cx";
import ItemThumbnail from "../ItemThumbnail/ItemThumbnail";
import StatusPill from "../StatusPill/StatusPill";
import RowActions from "../RowActions/RowActions";
import { calculateTotal, calculateFinalUnitPrice, formatDate } from "../../purchaseHistoryUtils";
import styles from "./FlatRow.module.css";

export default function FlatRow({
  item: p,
  isArchived,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const finalUnitPrice = calculateFinalUnitPrice(p);
  return (
    <Table.Row className={cx(isArchived && styles.isArchived)}>
      <Table.Cell>
        <ItemThumbnail item={p} onMouseEnter={onImageMouseEnter} onMouseLeave={onImageMouseLeave} />
      </Table.Cell>
      <Table.Cell className={styles.nowrap}>{formatDate(p.orderedOn)}</Table.Cell>
      <Table.Cell className={styles.seller}>{p.sellerId?.businessName || "Unknown"}</Table.Cell>
      <Table.Cell>{p.sellerProductId}</Table.Cell>
      <Table.Cell className={styles.id}>{p.inventoryId}</Table.Cell>
      <Table.Cell numeric className={styles.strong}>{p.quantity}</Table.Cell>
      <Table.Cell numeric>₹{(Number(p.price) || 0).toFixed(2)}</Table.Cell>
      <Table.Cell numeric className={styles.finalPrice}>₹{finalUnitPrice.toFixed(2)}</Table.Cell>
      <Table.Cell numeric className={styles.total}>₹{calculateTotal(p).toFixed(2)}</Table.Cell>
      <Table.Cell>{p.invoiceNo || "-"}</Table.Cell>
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
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </Table.Cell>
    </Table.Row>
  );
}
