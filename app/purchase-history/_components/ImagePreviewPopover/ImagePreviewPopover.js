import Image from "next/image";
import styles from "./ImagePreviewPopover.module.css";

export default function ImagePreviewPopover({ image }) {
  return (
    <div
      className={styles.root}
      style={{ top: `${image.top}px`, left: `${image.left}px` }}
    >
      <div className={styles.card}>
        <Image src={image.url} alt={image.title} width={204} height={204} className={styles.image} />
        <div className={styles.title}>{image.title}</div>
      </div>
    </div>
  );
}
