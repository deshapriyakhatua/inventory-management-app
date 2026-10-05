import cx from "@/components/ui/cx";
import styles from "./StatusDot.module.css";

// Listing status → semantic tone (unknown/missing statuses stay neutral)
const STATUS_TONES = {
    active: "success",
    inactive: "warning",
    blocked: "danger",
    archived: "neutral",
};

export function statusTone(status) {
    return STATUS_TONES[status?.toLowerCase()] || "neutral";
}

const toneClass = (status) => {
    const tone = statusTone(status);
    return styles[`tone${tone[0].toUpperCase()}${tone.slice(1)}`];
};

export default function StatusDot({ status, size = "md", className, children }) {
    const dot = <span aria-hidden="true" className={cx(styles.dot, size === "lg" && styles.sizeLg, size === "sm" && styles.sizeSm)} />;
    if (children == null) {
        return <span className={cx(styles.root, toneClass(status), className)}>{dot}</span>;
    }
    return (
        <span className={cx(styles.root, styles.withLabel, toneClass(status), className)}>
            {dot}
            {children}
        </span>
    );
}
