import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";

export default function ExcelExportButton({ onClick }) {
  return (
    <Button
      variant="secondary"
      leftIcon={<Icon name="download-invoices-excel-report" size={15} />}
      onClick={onClick}
      title="Download Grouped Purchase History Excel Sheet"
    >
      Download Excel
    </Button>
  );
}
