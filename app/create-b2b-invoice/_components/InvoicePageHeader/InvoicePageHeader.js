import Icon from "@/components/ui/Icon/Icon";
import styles from "./InvoicePageHeader.module.css";

export default function InvoicePageHeader({
  activeTab,
  showQrCode,
  isDownloadingPdf,
  onOpenCompanyModal,
  onShowForm,
  onShowPreview,
  onShowQrCodeChange,
  onDownloadPdf,
}) {
  return (
    <div className={styles.headerRow}>
      <div className={styles.titleGroup}>
        <h1 className={styles.title}>Create B2B Invoice</h1>
        <p className={styles.subtitle}>
          Generate exact-match Tax Invoices (.pdf) for B2B selling.
        </p>
      </div>

      <div className={styles.actionHeaderButtons}>
        <button
          type="button"
          className={styles.companySettingsBtn}
          onClick={onOpenCompanyModal}
        >
          <Icon name="icon-d5851a0c" size={18} />
          Company & Bank Info
        </button>

        {activeTab === "preview" ? (
          <button
            type="button"
            className={styles.tabBtn}
            onClick={onShowForm}
          >
            <Icon name="remove-this-product" size={18} />
            Close Preview
          </button>
        ) : (
          <button
            type="button"
            className={styles.tabBtn}
            onClick={onShowPreview}
          >
            <Icon name="view-graphical" size={18} />
            PDF Preview
          </button>
        )}

        {activeTab === "preview" && (
          <>
            <label style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "#e4e4e7", fontSize: "13px", cursor: "pointer", marginRight: "8px", userSelect: "none" }}>
              <input
                type="checkbox"
                checked={showQrCode}
                onChange={onShowQrCodeChange}
                style={{ width: "16px", height: "16px", cursor: "pointer", accentColor: "#ec4899" }}
              />
              <span>Print QR Code</span>
            </label>

            <button
              type="button"
              className={styles.downloadPdfBtn}
              onClick={onDownloadPdf}
              disabled={isDownloadingPdf}
            >
              <Icon name="download-invoices-excel-report" size={18} />
              {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
