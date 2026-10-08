import Button from "@/components/ui/Button/Button";
import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./BulkImport.module.css";

export default function BulkImport({ fileInputRef, isParsingFile, onFileUpload, onUploadClick }) {
  return (
    <Card as="section" padding="lg" className={styles.root}>
      <div className={styles.text}>
        <h2 className={styles.title}>
          <Icon name="icon-f583f931" size={18} />
          Bulk Import Data
        </h2>
        <p className={styles.description}>Automatically extract SKU metrics from marketplace reports.</p>
      </div>
      <input
        type="file"
        accept=".xlsx"
        hidden
        ref={fileInputRef}
        onChange={onFileUpload}
      />
      <Button
        variant="secondary"
        className={styles.upload}
        onClick={onUploadClick}
        loading={isParsingFile}
        leftIcon={<Icon name="icon-f583f931" size={16} />}
      >
        {isParsingFile ? "Parsing…" : "Upload Flipkart .xlsx"}
      </Button>
    </Card>
  );
}
