import Button from "../Button/Button";
import buttonStyles from "../Button/Button.module.css";
import Icon from "../Icon/Icon";
import cx from "../cx";

export default function IconButton({
  name,
  icon,
  size = "md",
  variant = "ghost",
  "aria-label": ariaLabel,
  className,
  ...rest
}) {
  if (!ariaLabel) {
    throw new Error("IconButton requires an aria-label.");
  }

  const glyph = icon ?? name;
  const iconSize = size === "sm" ? 16 : size === "lg" ? 24 : 20;

  return (
    <Button
      {...rest}
      size={size}
      variant={variant}
      className={cx(buttonStyles.iconOnly, className)}
      aria-label={ariaLabel}
    >
      {typeof glyph === "string" ? <Icon name={glyph} size={iconSize} /> : glyph}
    </Button>
  );
}