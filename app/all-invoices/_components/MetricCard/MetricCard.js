import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./MetricCard.module.css";

const TONE_CLASS = {
  accent: styles.toneAccent,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
  danger: styles.toneDanger,
};

export default function MetricCard({ tone = "accent", iconName, label, children }) {
  return (
    <Card className={styles.root}>
      <span aria-hidden="true" className={cx(styles.icon, TONE_CLASS[tone])}>
        <Icon name={iconName} size={22} />
      </span>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{children}</span>
      </div>
    </Card>
  );
}
