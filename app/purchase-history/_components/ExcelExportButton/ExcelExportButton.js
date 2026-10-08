import Icon from "@/components/ui/Icon/Icon";
import styles from "./ExcelExportButton.module.css";

export default function ExcelExportButton({ onClick }) {
  return (
    <button
      className={styles.downloadExcelBtn}
      onClick={onClick}
      title="Download Grouped Purchase History Excel Sheet"
    >
      <Icon name="download-invoices-excel-report" size={15} />
      Download Excel
    </button>
  );
}
