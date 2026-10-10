import Icon from "@/components/ui/Icon/Icon";
import Link from "next/link";
import styles from "./InvoicesHeader.module.css";

export default function InvoicesHeader({ onExport }) {
  return (
    <div className={styles.headerRow}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>All B2B Invoices</h1>
        <p className={styles.subtitle}>
          Manage, edit, search, and export all generated sales invoices.
        </p>
      </div>

      <div className={styles.headerActions}>
        <button
          type="button"
          className={styles.downloadExcelBtn}
          onClick={onExport}
          title="Download Invoices Excel Report"
        >
          <Icon name="download-invoices-excel-report" size={16} />
          Download Excel
        </button>

        <Link href="/create-b2b-invoice" className={styles.createBtn}>
          <Icon name="add-another-product" size={18} />
          Create New Invoice
        </Link>
      </div>
    </div>
  );
}
