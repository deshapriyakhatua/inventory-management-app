import styles from "./Select.module.css";
import cx from "../cx";

export default function Select({
  disabled = false,
  className,
  ref,
  children,
  ...rest
}) {
  return (
    <span className={cx(styles.root, disabled && styles.isDisabled)}>
      <select
        {...rest}
        ref={ref}
        disabled={disabled}
        className={cx(styles.control, className)}
      >
        {children}
      </select>
      <span aria-hidden="true" className={styles.chevron} />
    </span>
  );
}