import { useId } from "react";
import styles from "./ChoiceGroup.module.css";

/* Labelled group for button-based pickers (FormField only wraps a single control). */
export default function ChoiceGroup({ label, action, error, children }) {
    const labelId = useId();
    const errorId = useId();

    return (
        <div
            role="group"
            aria-labelledby={labelId}
            aria-describedby={error ? errorId : undefined}
            className={styles.root}
        >
            <div className={styles.header}>
                <span id={labelId} className={styles.label}>{label}</span>
                {action}
            </div>
            {children}
            {error && <span id={errorId} className={styles.error} role="alert">{error}</span>}
        </div>
    );
}
