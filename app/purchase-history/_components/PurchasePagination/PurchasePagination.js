import styles from "./PurchasePagination.module.css";

export default function PurchasePagination({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <div className={styles.pagination}>
      <button className={styles.pageBtn} disabled={currentPage === 1} onClick={onPrev}>Prev</button>
      <span className={styles.pageInfo}>Page {currentPage} of {totalPages}</span>
      <button className={styles.pageBtn} disabled={currentPage === totalPages} onClick={onNext}>Next</button>
    </div>
  );
}
