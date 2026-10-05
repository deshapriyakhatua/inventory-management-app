import Icon from "@/components/ui/Icon/Icon";
import Card from "@/components/ui/Card/Card";
import cx from "@/components/ui/cx";
import styles from "./StatCard.module.css";

const tones = [1, 2, 3, 4, 5, 6];
const valueTones = { success: styles.valueSuccess, danger: styles.valueDanger };

export default function StatCard({ icon, label, value, sub, tone = 1, valueTone }) {
  return (
    <Card className={cx(styles.root, styles[`tone${tones.includes(tone) ? tone : 1}`])}>
      <span aria-hidden="true" className={styles.icon}>
        <Icon name={icon} />
      </span>
      <div className={styles.body}>
        <span className={styles.label}>{label}</span>
        <span className={cx(styles.value, valueTones[valueTone])}>{value}</span>
        <span className={styles.sub}>{sub}</span>
      </div>
    </Card>
  );
}
