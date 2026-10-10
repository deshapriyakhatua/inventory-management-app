import Button from "@/components/ui/Button/Button";
import Checkbox from "@/components/ui/Checkbox/Checkbox";
import Icon from "@/components/ui/Icon/Icon";
import PageHeader from "@/components/ui/PageHeader/PageHeader";
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
  const isPreview = activeTab === "preview";

  return (
    <PageHeader
      className={styles.headerRow}
      title="Create B2B Invoice"
      subtitle="Generate exact-match Tax Invoices (.pdf) for B2B selling."
      actions={
        <div className={styles.actionHeaderButtons}>
          <Button
            variant="secondary"
            leftIcon={<Icon name="icon-d5851a0c" size={18} />}
            onClick={onOpenCompanyModal}
          >
            Company & Bank Info
          </Button>

          <Button
            variant="secondary"
            aria-pressed={isPreview}
            leftIcon={<Icon name={isPreview ? "remove-this-product" : "view-graphical"} size={18} />}
            onClick={isPreview ? onShowForm : onShowPreview}
          >
            {isPreview ? "Close Preview" : "PDF Preview"}
          </Button>

          {isPreview && (
            <>
              <label className={styles.qrToggle}>
                <Checkbox checked={showQrCode} onChange={onShowQrCodeChange} />
                <span>Print QR Code</span>
              </label>

              <Button
                leftIcon={<Icon name="download-invoices-excel-report" size={18} />}
                loading={isDownloadingPdf}
                onClick={onDownloadPdf}
              >
                {isDownloadingPdf ? "Generating PDF..." : "Download PDF"}
              </Button>
            </>
          )}
        </div>
      }
    />
  );
}
