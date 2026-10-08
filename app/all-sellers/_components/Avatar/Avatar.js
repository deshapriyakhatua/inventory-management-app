import cx from "@/components/ui/cx";
import styles from "./Avatar.module.css";

const TONES = [styles.tone1, styles.tone2, styles.tone3, styles.tone4, styles.tone5, styles.tone6];

export default function Avatar({ name, size = "md", className }) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("");
  // Same name always lands on the same chart colour
  const tone = TONES[[...name].reduce((acc, c) => acc + c.charCodeAt(0), 0) % TONES.length];
  return (
    <div
      className={cx(styles.root, size === "lg" && styles.sizeLg, tone, className)}
      aria-hidden="true"
    >
      {initials || "?"}
    </div>
  );
}
