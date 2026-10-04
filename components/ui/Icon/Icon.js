import { icons } from "./icons";

export default function Icon({
  name,
  size = 20,
  width = size,
  height = size,
  title,
  className,
  style,
  ref,
  ...iconProps
}) {
  const glyph = icons[name];
  if (!glyph) return null;

  const content = typeof glyph === "function" ? glyph(iconProps) : glyph;

  return (
    <svg
      ref={ref}
      width={width}
      height={height}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
      aria-hidden={title ? undefined : true}
      role={title ? "img" : undefined}
    >
      {title && <title>{title}</title>}
      {content}
    </svg>
  );
}