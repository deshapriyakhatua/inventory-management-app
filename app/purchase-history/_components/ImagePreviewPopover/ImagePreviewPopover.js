import styles from "./ImagePreviewPopover.module.css";

export default function ImagePreviewPopover({ image }) {
  return (
    <div
      className={styles.floatingImagePreview}
      style={{ top: `${image.top}px`, left: `${image.left}px` }}
    >
      <div className={styles.floatingPreviewCard}>
        <img src={image.url} alt={image.title} className={styles.floatingPreviewImg} />
        <div className={styles.floatingPreviewTitle}>{image.title}</div>
      </div>
    </div>
  );
}
