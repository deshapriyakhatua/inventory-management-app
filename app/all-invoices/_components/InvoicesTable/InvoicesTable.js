import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Table from "@/components/ui/Table/Table";
import InvoiceRow from "../InvoiceRow/InvoiceRow";
import styles from "./InvoicesTable.module.css";

const COLUMNS = 9;

export default function InvoicesTable({ invoices, loading, showArchived, openMenuId, menuHandlers }) {
  // Skeleton rows only while nothing is listed yet; refetches keep the current rows visible.
  const isInitialLoading = loading && invoices.length === 0;

  return (
    <Table
      className={styles.root}
      loading={isInitialLoading}
      loadingRows={6}
      columns={COLUMNS}
      caption={isInitialLoading ? "Loading invoices..." : undefined}
      empty={!loading && invoices.length === 0 ? <EmptyState title="No invoices found matching criteria." /> : undefined}
    >
      <Table.Head>
        <Table.Row hover={false}>
          <Table.Cell as="th">Invoice #</Table.Cell>
          <Table.Cell as="th">Date</Table.Cell>
          <Table.Cell as="th">Customer</Table.Cell>
          <Table.Cell as="th">Items</Table.Cell>
          <Table.Cell as="th" numeric>Grand Total</Table.Cell>
          <Table.Cell as="th" numeric>Received</Table.Cell>
          <Table.Cell as="th" numeric>Balance</Table.Cell>
          <Table.Cell as="th">Status</Table.Cell>
          <Table.Cell as="th" className={styles.actionsColumn}>Actions</Table.Cell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        {invoices.map((inv) => (
          <InvoiceRow
            key={inv._id}
            inv={inv}
            showArchived={showArchived}
            isMenuOpen={openMenuId === inv._id}
            menuHandlers={menuHandlers}
          />
        ))}
      </Table.Body>
    </Table>
  );
}
