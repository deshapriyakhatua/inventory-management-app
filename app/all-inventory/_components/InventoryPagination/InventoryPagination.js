import styles from "./InventoryPagination.module.css";

export default function InventoryPagination({
    currentPage,
    pageSize,
    totalItems,
    onPageSizeChange,
    onPrevPage,
    onNextPage,
}) {
    return (
        <div className={styles.pagination}>
            <div className={styles.paginationLeft}>
                <span className={styles.pageInfo}>
                    Showing {Math.min((currentPage - 1) * pageSize + 1, totalItems)}–{Math.min(currentPage * pageSize, totalItems)} of {totalItems} entries
                </span>

                <div className={styles.pageSizeWrapper}>
                    <label htmlFor="pageSizeSelect" className={styles.pageSizeLabel}>Rows per page:</label>
                    <select
                        id="pageSizeSelect"
                        className={styles.pageSizeSelect}
                        value={pageSize}
                        onChange={onPageSizeChange}
                    >
                        {[20, 50, 100, 500, 5000].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>
            </div>
            <div className={styles.pageControls}>
                <button className={styles.pageBtn} disabled={currentPage === 1}
                    onClick={onPrevPage}>
                    Previous
                </button>
                <span className={styles.pageDisplay}>Page {currentPage} of {Math.ceil(totalItems / pageSize) || 1}</span>
                <button className={styles.pageBtn} disabled={currentPage >= (Math.ceil(totalItems / pageSize) || 1)}
                    onClick={onNextPage}>
                    Next
                </button>
            </div>
        </div>
    );
}
