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
    <div className={styles.pagination}>
      <div className={styles.paginationLeft}>
        <span className={styles.pageInfo}>
          Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems}
        </span>
        <div className={styles.pageSizeWrapper}>
          <label htmlFor="pageSizeSelect" className={styles.pageSizeLabel}>Per page:</label>
          <select
            id="pageSizeSelect"
            className={styles.pageSizeSelect}
            value={pageSize}
            onChange={onPageSizeChange}
          >
            {[20, 50, 100].map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>
      <div className={styles.pageControls}>
        <button className={styles.pageBtn} disabled={currentPage === 1} onClick={onPrevPage}>Previous</button>
        <span className={styles.pageDisplay}>Page {currentPage} of {totalPages}</span>
        <button className={styles.pageBtn} disabled={currentPage >= totalPages} onClick={onNextPage}>Next</button>
      </div>
    </div>
  );
}
