import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Table from "@/components/ui/Table/Table";
import styles from "./TableShell.module.css";

export default function TableShell({ isArchived, loading, isEmpty, columns, children }) {
  const loadingLabel = isArchived ? "Loading archived records..." : "Fetching history logs...";
  const emptyLabel = isArchived ? "No archived purchase records." : "No purchase records found matching your filters.";

  return (
    <Table
      className={styles.root}
      loading={loading}
      loadingRows={6}
      columns={columns}
      caption={loading ? loadingLabel : undefined}
      empty={!loading && isEmpty ? <EmptyState title={emptyLabel} /> : undefined}
    >
      {children}
    </Table>
  );
}
