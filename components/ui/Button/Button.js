import Link from "next/link";
import ButtonStyles from "./Button.module.css";
import cx from "../cx";

const variants = ["primary", "secondary", "ghost", "danger"];
const sizes = ["sm", "md", "lg"];

export default function Button({
  as = "button",
  href,
  type = "button",
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  className,
  children,
  onClick,
  ref,
  ...rest
}) {
  const Component = href ? Link : as;
  const isLink = Component === Link || Component === "a";
  const isUnavailable = disabled || loading;

  function handleClick(event) {
    if (isUnavailable) {
      event.preventDefault();
      return;
    }
    onClick?.(event);
  }

  return (
    <Component
      {...rest}
      ref={ref}
      href={href}
      type={isLink ? undefined : type}
      disabled={isLink ? undefined : isUnavailable}
      aria-disabled={isLink && isUnavailable ? true : undefined}
      aria-busy={loading || undefined}
      onClick={handleClick}
      className={cx(
        ButtonStyles.root,
        ButtonStyles[variants.includes(variant) ? variant : "primary"],
        ButtonStyles[`size${sizes.includes(size) ? size[0].toUpperCase() + size.slice(1) : "Md"}`],
        className,
      )}
    >
      <span className={cx(ButtonStyles.content, loading && ButtonStyles.contentHidden)}>
        {leftIcon && <span className={ButtonStyles.icon}>{leftIcon}</span>}
        {children != null && <span>{children}</span>}
        {rightIcon && <span className={ButtonStyles.icon}>{rightIcon}</span>}
      </span>
      {loading && <span aria-hidden="true" className={ButtonStyles.loadingIndicator} />}
    </Component>
  );
}