import Icon from "@/components/ui/Icon/Icon";
import styles from "./FormSection.module.css";

export default function FormSection({ icon, title, aside, children }) {
  return (
    <section className={styles.root}>
      <div className={styles.header}>
        <Icon name={icon} size={18} />
        <h2 className={styles.title}>{title}</h2>
        {aside && <div className={styles.aside}>{aside}</div>}
      </div>
      {children}
    </section>
  );
}
