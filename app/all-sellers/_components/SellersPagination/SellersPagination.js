import Button from "@/components/ui/Button/Button";
import Select from "@/components/ui/Select/Select";
import styles from "./SellersPagination.module.css";

export default function SellersPagination({
  currentPage,
  pageSize,
  totalItems,
  totalPages,
  onPageSizeChange,
  onPrevPage,
  onNextPage,
}) {
  return (
    <nav className={styles.root} aria-label="Pagination">
      <div className={styles.left}>
        <span className={styles.info}>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
        <div className={styles.pageSize}>
          <label htmlFor="pageSizeSelect" className={styles.label}>Per page:</label>
          <div className={styles.pageSizeSelect}>
            <Select id="pageSizeSelect" value={pageSize} onChange={onPageSizeChange}>
              {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>
      </div>
      <div className={styles.controls}>
        <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={onPrevPage}>Previous</Button>
        <span className={styles.display}>Page {currentPage} of {totalPages}</span>
        <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={onNextPage}>Next</Button>
      </div>
    </nav>
  );
}
