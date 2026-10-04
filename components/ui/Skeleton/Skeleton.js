import styles from "./Skeleton.module.css";
import cx from "../cx";

const variants = ["text", "circle", "rect"];

export default function Skeleton({
  variant = "rect",
  width,
  height,
  className,
  style,
  ref,
  ...rest
}) {
  const variantClass = variants.includes(variant) ? variant : "rect";

  return (
    <span
      {...rest}
      ref={ref}
      aria-hidden="true"
      className={cx(styles.root, styles[variantClass], className)}
      style={{ width, height, ...style }}
    />
  );
}