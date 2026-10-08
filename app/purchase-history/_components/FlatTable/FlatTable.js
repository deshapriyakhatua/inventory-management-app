import Table from "@/components/ui/Table/Table";
import TableShell from "../TableShell/TableShell";
import HeaderCell from "../HeaderCell/HeaderCell";
import FlatRow from "../FlatRow/FlatRow";

export default function FlatTable({
  rows,
  isArchived,
  loading = false,
  sortConfig,
  onSort,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const sortProps = { sortConfig, onSort };

  return (
    <TableShell isArchived={isArchived} loading={loading} isEmpty={rows.length === 0} columns={13}>
      <Table.Head>
        <Table.Row hover={false}>
          <HeaderCell>Image</HeaderCell>
          <HeaderCell sortKey="orderedOn" {...sortProps}>Date Ordered</HeaderCell>
          <HeaderCell sortKey="sellerId" {...sortProps}>Seller</HeaderCell>
          <HeaderCell sortKey="sellerProductId" {...sortProps}>Seller SKU</HeaderCell>
          <HeaderCell sortKey="inventoryId" {...sortProps}>Internal ID</HeaderCell>
          <HeaderCell sortKey="quantity" numeric {...sortProps}>Qty</HeaderCell>
          <HeaderCell sortKey="price" numeric {...sortProps}>Unit Price</HeaderCell>
          <HeaderCell sortKey="finalUnitPrice" numeric {...sortProps}>Final Unit Price</HeaderCell>
          <HeaderCell sortKey="total" numeric {...sortProps}>Total</HeaderCell>
          <HeaderCell sortKey="invoiceNo" {...sortProps}>Invoice No</HeaderCell>
          <HeaderCell sortKey="receivedOn" {...sortProps}>Received On</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell>Actions</HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {rows.map((p) => (
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
        ))}
      </Table.Body>
    </TableShell>
  );
}
