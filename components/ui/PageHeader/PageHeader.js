import styles from "./PageHeader.module.css";
import cx from "../cx";

export default function PageHeader({
  title,
  subtitle,
  actions,
  className,
  ...rest
}) {
  return (
    <header {...rest} className={cx(styles.root, className)}>
      <div className={styles.content}>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}