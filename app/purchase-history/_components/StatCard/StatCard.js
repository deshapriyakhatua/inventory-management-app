import Icon from "@/components/ui/Icon/Icon";
import styles from "./StatCard.module.css";

export default function StatCard({ iconName, iconStyle, label, value }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIconWrapper} style={iconStyle}>
        <Icon name={iconName} size={22} />
      </div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value}</span>
      </div>
    </div>
  );
}
