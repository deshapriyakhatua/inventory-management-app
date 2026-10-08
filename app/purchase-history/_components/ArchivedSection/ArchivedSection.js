import Icon from "@/components/ui/Icon/Icon";
import styles from "./ArchivedSection.module.css";

export default function ArchivedSection({ count, showExpandToggle, allExpanded, onToggleExpandAll, children }) {
  return (
    <div className={styles.archivedSection}>
      <div className={styles.archivedSectionHeader} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span className={styles.archivedSectionTitle}>
            <Icon name="archive-this-record" size={16} />
            Archived Records
            <span className={styles.archivedCount}>{count}</span>
          </span>
          <p className={styles.archivedSectionSubtitle}>These records are soft-deleted. Use "Delete Permanently" to remove them forever.</p>
        </div>

        {showExpandToggle && (
          <button
            className={styles.actionSecondaryBtn}
            onClick={onToggleExpandAll}
          >
            {allExpanded ? "Collapse All Archived" : "Expand All Archived"}
          </button>
        )}
      </div>

      {children}
    </div>
  );
}
