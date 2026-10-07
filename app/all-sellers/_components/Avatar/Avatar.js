export default function Avatar({ name, className }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  const hue = [...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
  return (
    <div
      className={className}
      style={{ background: `hsl(${hue}, 55%, 35%)` }}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}
