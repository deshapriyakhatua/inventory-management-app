import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import styles from "./ArchivedSection.module.css";

export default function ArchivedSection({ count, showExpandToggle, allExpanded, onToggleExpandAll, children }) {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <div className={styles.content}>
          <h2 className={styles.title}>
            <Icon name="archive-this-record" size={16} />
            Archived Records
            <Badge tone="danger">{count}</Badge>
          </h2>
          <p className={styles.subtitle}>These records are soft-deleted. Use &quot;Delete Permanently&quot; to remove them forever.</p>
        </div>

        {showExpandToggle && (
          <Button variant="secondary" onClick={onToggleExpandAll} aria-expanded={allExpanded}>
            {allExpanded ? "Collapse All Archived" : "Expand All Archived"}
          </Button>
        )}
      </div>

      {children}
    </section>
  );
}
