import TableShell from "../TableShell/TableShell";
import HeaderCell from "../HeaderCell/HeaderCell";
import GroupRow from "../GroupRow/GroupRow";
import styles from "./GroupedTable.module.css";

export default function GroupedTable({
  groups,
  isArchived,
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
  return (
    <TableShell>
      <thead>
        <tr>
          <HeaderCell style={{ width: "45px" }}></HeaderCell>
          <HeaderCell sortKey="invoiceNo" sortConfig={sortConfig} onSort={onSort}>Invoice No</HeaderCell>
          <HeaderCell sortKey="sellerId" sortConfig={sortConfig} onSort={onSort}>Seller</HeaderCell>
          <HeaderCell sortKey="orderedOn" sortConfig={sortConfig} onSort={onSort}>Order Date</HeaderCell>
          <HeaderCell sortKey="itemCount" sortConfig={sortConfig} onSort={onSort}>Items</HeaderCell>
          <HeaderCell sortKey="quantity" sortConfig={sortConfig} onSort={onSort}>Total Qty</HeaderCell>
          <HeaderCell sortKey="total" sortConfig={sortConfig} onSort={onSort}>Total Cost</HeaderCell>
          <HeaderCell>Status</HeaderCell>
          <HeaderCell style={{ textAlign: "right", paddingRight: "1.5rem" }}>Details</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {groups.length === 0 ? (
          <tr>
            <td colSpan="9" className={styles.noData}>
              {isArchived ? "No archived purchase records." : "No purchase records found matching your filters."}
            </td>
          </tr>
        ) : (
          groups.map((group) => (
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
          ))
        )}
      </tbody>
    </TableShell>
  );
}
