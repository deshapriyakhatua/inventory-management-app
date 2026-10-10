import Image from "next/image";
import styles from "./CursorImageTooltip.module.css";

// Floating Cursor Image Tooltip. left/top are runtime cursor coordinates (dynamic inline style).
export default function CursorImageTooltip({ hoveredImage }) {
  return (
    <div
      className={styles.root}
      style={{
        left: `${Math.min(hoveredImage.x + 20, typeof window !== "undefined" ? window.innerWidth - 250 : 800)}px`,
        top: `${Math.min(hoveredImage.y + 20, typeof window !== "undefined" ? window.innerHeight - 270 : 600)}px`,
      }}
    >
      <Image
        src={hoveredImage.url}
        alt={hoveredImage.id}
        width={220}
        height={220}
        className={styles.image}
        unoptimized
      />
      {hoveredImage.id && (
        <div className={styles.tag}>{hoveredImage.id}</div>
      )}
    </div>
  );
}
