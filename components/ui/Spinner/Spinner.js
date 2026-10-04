import styles from "./Spinner.module.css";
import cx from "../cx";

const sizes = ["sm", "md", "lg"];

export default function Spinner({
  size = "md",
  label = "Loading",
  className,
  ref,
  ...rest
}) {
  const sizeClass = `size${sizes.includes(size) ? size[0].toUpperCase() + size.slice(1) : "Md"}`;

  return (
    <span
      {...rest}
      ref={ref}
      role="status"
      aria-label={label}
      className={cx(styles.root, styles[sizeClass], className)}
    >
      <span aria-hidden="true" className={styles.indicator} />
    </span>
  );
}