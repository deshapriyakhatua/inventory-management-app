import styles from "./Textarea.module.css";
import cx from "../cx";

export default function Textarea({
  rows = 3,
  disabled = false,
  className,
  ref,
  ...rest
}) {
  return (
    <textarea
      {...rest}
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={cx(styles.root, className)}
    />
  );
}