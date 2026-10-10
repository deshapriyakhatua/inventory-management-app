import styles from "./CursorImageTooltip.module.css";

// Floating Cursor Image Tooltip
export default function CursorImageTooltip({ hoveredImage }) {
  return (
    <div
      className={styles.cursorImageTooltip}
      style={{
        left: `${Math.min(hoveredImage.x + 20, typeof window !== "undefined" ? window.innerWidth - 250 : 800)}px`,
        top: `${Math.min(hoveredImage.y + 20, typeof window !== "undefined" ? window.innerHeight - 270 : 600)}px`,
      }}
    >
      <img
        src={hoveredImage.url}
        alt={hoveredImage.id}
        className={styles.cursorTooltipImg}
      />
      {hoveredImage.id && (
        <div className={styles.cursorTooltipTag}>{hoveredImage.id}</div>
      )}
    </div>
  );
}
