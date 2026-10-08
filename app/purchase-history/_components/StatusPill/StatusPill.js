import Badge from "@/components/ui/Badge/Badge";
import styles from "./StatusPill.module.css";

// tone: "received" | "partial" | "pending"
const BADGE_TONE = {
  received: "success",
  partial: "info",
  pending: "warning",
};

export default function StatusPill({ tone, children }) {
  return (
    <Badge tone={BADGE_TONE[tone] || "neutral"} className={styles.root}>
      <span aria-hidden="true" className={styles.dot} />
      {children}
    </Badge>
  );
}
