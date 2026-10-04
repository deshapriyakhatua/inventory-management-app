import styles from "./Card.module.css";
import cx from "../cx";

const variants = ["flat", "raised"];
const paddings = ["sm", "md", "lg"];

export default function Card({
  as = "div",
  variant = "flat",
  padding = "md",
  className,
  children,
  ref,
  ...rest
}) {
  const Component = as;
  const resolvedVariant = variants.includes(variant) ? variant : "flat";
  const resolvedPadding = paddings.includes(padding) ? padding : "md";

  return (
    <Component
      {...rest}
      ref={ref}
      className={cx(styles.root, styles[resolvedVariant], styles[`padding${resolvedPadding[0].toUpperCase()}${resolvedPadding.slice(1)}`], className)}
    >
      {children}
    </Component>
  );
}