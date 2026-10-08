import Card from "@/components/ui/Card/Card";
import Icon from "@/components/ui/Icon/Icon";
import cx from "@/components/ui/cx";
import styles from "./StatCard.module.css";

const TONE_CLASS = {
  accent: styles.toneAccent,
  chart: styles.toneChart,
  success: styles.toneSuccess,
  warning: styles.toneWarning,
};

export default function StatCard({ iconName, tone = "accent", label, value }) {
  return (
    <Card className={styles.root}>
      <span aria-hidden="true" className={cx(styles.icon, TONE_CLASS[tone])}>
        <Icon name={iconName} size={22} />
      </span>
      <div className={styles.info}>
        <span className={styles.label}>{label}</span>
        <span className={styles.value}>{value}</span>
      </div>
    </Card>
  );
}
