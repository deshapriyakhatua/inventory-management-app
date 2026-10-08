import TableShell from "../TableShell/TableShell";
import HeaderCell from "../HeaderCell/HeaderCell";
import FlatRow from "../FlatRow/FlatRow";
import styles from "./FlatTable.module.css";

export default function FlatTable({
  rows,
  isArchived,
  sortConfig,
  onSort,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  return (
    <TableShell>
      <thead>
        <tr>
          <HeaderCell>Image</HeaderCell>
          <HeaderCell sortKey="orderedOn" sortConfig={sortConfig} onSort={onSort}>Date Ordered</HeaderCell>
          <HeaderCell sortKey="sellerId" sortConfig={sortConfig} onSort={onSort}>Seller</HeaderCell>
          <HeaderCell sortKey="sellerProductId" sortConfig={sortConfig} onSort={onSort}>Seller SKU</HeaderCell>
          <HeaderCell sortKey="inventoryId" sortConfig={sortConfig} onSort={onSort}>Internal ID</HeaderCell>
          <HeaderCell sortKey="quantity" sortConfig={sortConfig} onSort={onSort}>Qty</HeaderCell>
          <HeaderCell sortKey="price" sortConfig={sortConfig} onSort={onSort}>Unit Price</HeaderCell>
          <HeaderCell sortKey="finalUnitPrice" sortConfig={sortConfig} onSort={onSort}>Final Unit Price</HeaderCell>
          <HeaderCell sortKey="total" sortConfig={sortConfig} onSort={onSort}>Total</HeaderCell>
          <HeaderCell sortKey="invoiceNo" sortConfig={sortConfig} onSort={onSort}>Invoice No</HeaderCell>
          <HeaderCell sortKey="receivedOn" sortConfig={sortConfig} onSort={onSort}>Received On</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Actions</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <tr>
            <td colSpan="13" className={styles.noData}>
              {isArchived ? "No archived purchase records." : "No purchase records found matching your filters."}
            </td>
          </tr>
        ) : (
          rows.map((p) => (
            <FlatRow
              key={p._id}
              item={p}
              isArchived={isArchived}
              onImageMouseEnter={onImageMouseEnter}
              onImageMouseLeave={onImageMouseLeave}
              onEdit={onEdit}
              onArchive={onArchive}
              onRestore={onRestore}
              onDelete={onDelete}
            />
          ))
        )}
      </tbody>
    </TableShell>
  );
}
