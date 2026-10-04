import styles from "./Input.module.css";
import cx from "../cx";

export default function Input({
  type = "text",
  variant = "default",
  leading,
  trailing,
  disabled = false,
  className,
  style,
  ref,
  ...rest
}) {
  const isFile = type === "file" || variant === "file";
  const inputType = isFile ? "file" : type;

  if (leading || trailing) {
    return (
      <span className={cx(styles.root, disabled && styles.isDisabled)}>
        {leading && <span className={styles.slot}>{leading}</span>}
        <input
          {...rest}
          ref={ref}
          type={inputType}
          disabled={disabled}
          className={cx(styles.control, className)}
          style={style}
        />
        {trailing && <span className={styles.slot}>{trailing}</span>}
      </span>
    );
  }

  return (
    <input
      {...rest}
      ref={ref}
      type={inputType}
      disabled={disabled}
      className={cx(styles.control, isFile && styles.file, className)}
      style={style}
    />
  );
}