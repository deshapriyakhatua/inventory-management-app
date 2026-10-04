import styles from "./Checkbox.module.css";
import cx from "../cx";

export default function Checkbox({
  disabled = false,
  className,
  ref,
  ...rest
}) {
  return (
    <span className={cx(styles.root, className)}>
      <input
        {...rest}
        ref={ref}
        type="checkbox"
        disabled={disabled}
        className={styles.control}
      />
      <span aria-hidden="true" className={styles.box} />
    </span>
  );
}