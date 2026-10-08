import Icon from "@/components/ui/Icon/Icon";
import styles from "./BulkImport.module.css";

export default function BulkImport({ fileInputRef, isParsingFile, onFileUpload, onUploadClick }) {
  return (
    <div className={styles.importSection}>
      <div className={styles.importHeader}>
          <div className={styles.importTitle}>
            <Icon name="icon-f583f931" size={16} />
            Bulk Import Data
          </div>
          <p className={styles.importDescription}>Automatically extract SKU metrics from marketplace reports.</p>
      </div>
      <div className={styles.importActions}>
          <input 
            type="file" 
            accept=".xlsx" 
            style={{ display: "none" }} 
            ref={fileInputRef} 
            onChange={onFileUpload} 
          />
          <button 
            className={styles.uploadBtn} 
            onClick={onUploadClick} 
            type="button"
            disabled={isParsingFile}
          >
            {isParsingFile ? (
               <><span className={styles.spinnerSmall}></span> Parsing…</>
            ) : (
               <>
                 <Icon name="icon-f583f931" size={16} />
                 Upload Flipkart .xlsx
               </>
            )}
          </button>
      </div>
    </div>
  );
}
