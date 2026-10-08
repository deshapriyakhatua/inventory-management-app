import Button from "@/components/ui/Button/Button";
import styles from "./PurchasePagination.module.css";

export default function PurchasePagination({ currentPage, totalPages, onPrev, onNext }) {
  return (
    <nav className={styles.root} aria-label="Pagination">
      <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={onPrev}>Prev</Button>
      <span className={styles.display}>Page {currentPage} of {totalPages}</span>
      <Button variant="secondary" size="sm" disabled={currentPage === totalPages} onClick={onNext}>Next</Button>
    </nav>
  );
}
