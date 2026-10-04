import styles from "./EmptyState.module.css";
import cx from "../cx";

export default function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...rest
}) {
  return (
    <section {...rest} className={cx(styles.root, className)}>
      {icon && <div aria-hidden="true" className={styles.icon}>{icon}</div>}
      <h2 className={styles.title}>{title}</h2>
      {description && <p className={styles.description}>{description}</p>}
      {action && <div className={styles.action}>{action}</div>}
    </section>
  );
}