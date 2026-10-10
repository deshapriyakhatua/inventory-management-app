import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import Table from "@/components/ui/Table/Table";
import RecentInvoiceRow from "../RecentInvoiceRow/RecentInvoiceRow";
import styles from "./RecentInvoicesSection.module.css";

const COLUMNS = 8;

// History Section. `.recentSection` stays on the root: the module's @media print block hides it.
export default function RecentInvoicesSection({
  recentInvoices,
  isLoadingHistory,
  onRefresh,
  onOpenGraphicalModal,
  onOpenPdfModal,
  onOpenPaymentQrModal,
}) {
  const isEmpty = recentInvoices.length === 0;
  // Skeleton rows only while nothing is listed yet; refreshes keep the current rows visible.
  const isInitialLoading = isLoadingHistory && isEmpty;

  return (
    <Card as="section" padding="lg" className={styles.recentSection}>
      <div className={styles.header}>
        <h2 className={styles.title}>Recent B2B Invoices ({recentInvoices.length})</h2>
        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Icon name="refresh" size={16} />}
          onClick={onRefresh}
          loading={isLoadingHistory}
        >
          Refresh History
        </Button>
      </div>

      <Table
        className={styles.table}
        loading={isInitialLoading}
        loadingRows={4}
        columns={COLUMNS}
        caption={isInitialLoading ? "Loading invoices..." : undefined}
        empty={!isLoadingHistory && isEmpty ? <EmptyState title="No B2B invoices generated yet." /> : undefined}
      >
        <Table.Head>
          <Table.Row hover={false}>
            <Table.Cell as="th">Invoice #</Table.Cell>
            <Table.Cell as="th">Date</Table.Cell>
            <Table.Cell as="th">Customer</Table.Cell>
            <Table.Cell as="th">Items</Table.Cell>
            <Table.Cell as="th" numeric>Grand Total</Table.Cell>
            <Table.Cell as="th" numeric>Balance</Table.Cell>
            <Table.Cell as="th">Status</Table.Cell>
            <Table.Cell as="th">Action</Table.Cell>
          </Table.Row>
        </Table.Head>
        <Table.Body>
          {recentInvoices.map((inv) => (
            <RecentInvoiceRow
              key={inv._id}
              inv={inv}
              onOpenGraphicalModal={onOpenGraphicalModal}
              onOpenPdfModal={onOpenPdfModal}
              onOpenPaymentQrModal={onOpenPaymentQrModal}
            />
          ))}
        </Table.Body>
      </Table>
    </Card>
  );
}
