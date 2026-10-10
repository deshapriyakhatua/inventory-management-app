import styles from "./EditFormSection.module.css";

// Titled section of the edit invoice form. `grid` lays children out as a 1 → 2 column FormField grid (640px).
export default function EditFormSection({ title, grid = true, children }) {
  return (
    <section className={styles.root}>
      <h3 className={styles.title}>{title}</h3>
      <div className={grid ? styles.grid : styles.stack}>{children}</div>
    </section>
  );
}
