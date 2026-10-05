import Card from "@/components/ui/Card/Card";
import cx from "@/components/ui/cx";
import styles from "./ChartCard.module.css";

export default function ChartCard({ title, empty, emptyText, size = "md", className, children }) {
  return (
    <Card padding="lg" className={cx(styles.root, className)}>
      <h2 className={styles.title}>{title}</h2>
      {empty ? (
        <p className={styles.empty}>{emptyText}</p>
      ) : (
        <div className={cx(styles.area, size === "pie" && styles.areaPie)}>{children}</div>
      )}
    </Card>
  );
}
