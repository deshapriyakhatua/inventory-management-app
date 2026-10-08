import Table from "@/components/ui/Table/Table";
import TableShell from "../TableShell/TableShell";
import HeaderCell from "../HeaderCell/HeaderCell";
import GroupRow from "../GroupRow/GroupRow";
import styles from "./GroupedTable.module.css";

export default function GroupedTable({
  groups,
  isArchived,
  loading = false,
  expandedGroups,
  sortConfig,
  onSort,
  onToggleGroup,
  onCopy,
  onImageMouseEnter,
  onImageMouseLeave,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
}) {
  const sortProps = { sortConfig, onSort };

  return (
    <TableShell isArchived={isArchived} loading={loading} isEmpty={groups.length === 0} columns={9}>
      <Table.Head>
        <Table.Row hover={false}>
          <HeaderCell className={styles.toggleColumn}></HeaderCell>
          <HeaderCell sortKey="invoiceNo" {...sortProps}>Invoice No</HeaderCell>
          <HeaderCell sortKey="sellerId" {...sortProps}>Seller</HeaderCell>
          <HeaderCell sortKey="orderedOn" {...sortProps}>Order Date</HeaderCell>
          <HeaderCell sortKey="itemCount" {...sortProps}>Items</HeaderCell>
          <HeaderCell sortKey="quantity" numeric {...sortProps}>Total Qty</HeaderCell>
          <HeaderCell sortKey="total" numeric {...sortProps}>Total Cost</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell className={styles.detailsColumn}>Details</HeaderCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {groups.map((group) => (
          <GroupRow
            key={group.groupKey}
            group={group}
            isArchived={isArchived}
            isExpanded={!!expandedGroups[group.groupKey]}
            onToggle={onToggleGroup}
            onCopy={onCopy}
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
