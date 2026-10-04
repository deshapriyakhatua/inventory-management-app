import styles from "./PageShell.module.css";
import cx from "../cx";

export default function PageShell({
  as = "div",
  className,
  children,
  ref,
  ...rest
}) {
  const Component = as;

  return (
    <Component {...rest} ref={ref} className={cx(styles.root, className)}>
      {children}
    </Component>
  );
}