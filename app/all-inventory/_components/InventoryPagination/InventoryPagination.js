import Button from "@/components/ui/Button/Button";
import Select from "@/components/ui/Select/Select";
import styles from "./InventoryPagination.module.css";

export default function InventoryPagination({
    currentPage,
    pageSize,
    totalItems,
    onPageSizeChange,
    onPrevPage,
    onNextPage,
}) {
    const totalPages = Math.ceil(totalItems / pageSize) || 1;

    return (
        <nav className={styles.root} aria-label="Pagination">
            <div className={styles.left}>
                <span className={styles.info}>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </span>

                <div className={styles.pageSize}>
                    <label htmlFor="pageSizeSelect" className={styles.label}>Rows per page:</label>
                    <div className={styles.pageSizeSelect}>
                        <Select id="pageSizeSelect" value={pageSize} onChange={onPageSizeChange}>
                            {[20, 50, 100, 500, 5000].map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </Select>
                    </div>
                </div>
            </div>
            <div className={styles.controls}>
                <Button variant="secondary" size="sm" disabled={currentPage === 1} onClick={onPrevPage}>
                    Previous
                </Button>
                <span className={styles.display}>Page {currentPage} of {totalPages}</span>
                <Button variant="secondary" size="sm" disabled={currentPage >= totalPages} onClick={onNextPage}>
                    Next
                </Button>
            </div>
        </nav>
    );
}
