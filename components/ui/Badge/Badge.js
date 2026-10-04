import styles from "./Badge.module.css";
import cx from "../cx";

const tones = ["neutral", "success", "warning", "danger", "info", "accent"];
const paymentStatusTones = {
  Pending: "warning",
  Paid: "success",
  "Partially Paid": "warning",
  Cancelled: "neutral",
};

export default function Badge({
  as = "span",
  tone = "neutral",
  status,
  className,
  children,
  ref,
  ...rest
}) {
  const Component = as;
  const resolvedTone = paymentStatusTones[status] || (tones.includes(tone) ? tone : "neutral");

  return (
    <Component
      {...rest}
      ref={ref}
      className={cx(styles.root, styles[resolvedTone], className)}
    >
      {children}
    </Component>
  );
}