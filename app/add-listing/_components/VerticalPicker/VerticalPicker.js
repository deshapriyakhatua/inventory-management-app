import Badge from "@/components/ui/Badge/Badge";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import IconButton from "@/components/ui/IconButton/IconButton";
import Skeleton from "@/components/ui/Skeleton/Skeleton";
import cx from "@/components/ui/cx";
import ChoiceGroup from "../ChoiceGroup/ChoiceGroup";
import styles from "./VerticalPicker.module.css";

export default function VerticalPicker({
    verticals,
    loading,
    verticalShort,
    vertical,
    onToggle,
    onRefresh,
    disabled,
    error,
}) {
    return (
        <ChoiceGroup
            label="Select Vertical Type"
            error={error}
            action={
                <IconButton
                    name="refresh"
                    size="sm"
                    aria-label="Refresh Verticals"
                    title="Refresh Verticals"
                    onClick={onRefresh}
                    disabled={loading}
                    loading={loading}
                />
            }
        >
            {loading ? (
                <div className={styles.root} aria-busy="true" aria-label="Loading verticals...">
                    {Array.from({ length: 6 }, (_, i) => (
                        <Skeleton key={i} className={styles.skeleton} />
                    ))}
                </div>
            ) : verticals.length > 0 ? (
                <div className={styles.root}>
                    {verticals.map((v) => {
                        const isSelected = verticalShort === v.verticalShort && vertical === v.verticalName;
                        return (
                            <button
                                key={v.verticalName}
                                type="button"
                                aria-pressed={isSelected}
                                className={cx(styles.pill, isSelected && styles.pillActive)}
                                onClick={() => onToggle(v, isSelected)}
                                disabled={disabled}
                            >
                                <Badge tone="accent">{v.verticalShort}</Badge>
                                <span className={styles.name}>{v.verticalName}</span>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <EmptyState title="No verticals available." />
            )}
        </ChoiceGroup>
    );
}
