import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import PageHeader from "@/components/ui/PageHeader/PageHeader";

export default function InvoicesHeader({ onExport }) {
  return (
    <PageHeader
      title="All B2B Invoices"
      subtitle="Manage, edit, search, and export all generated sales invoices."
      actions={
        <>
          <Button
            variant="secondary"
            leftIcon={<Icon name="download-invoices-excel-report" size={15} />}
            onClick={onExport}
            title="Download Invoices Excel Report"
          >
            Download Excel
          </Button>
          <Button href="/create-b2b-invoice" leftIcon={<Icon name="add-another-product" size={16} />}>
            Create New Invoice
          </Button>
        </>
      }
    />
  );
}
