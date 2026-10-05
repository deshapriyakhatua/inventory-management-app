import cx from "@/components/ui/cx";
import MarketplaceLogo from "@/components/MarketplaceLogo/MarketplaceLogo";
import ChoiceGroup from "../ChoiceGroup/ChoiceGroup";
import styles from "./MarketplacePicker.module.css";

const MARKETPLACES = ["Amazon", "Flipkart", "Myntra", "Meesho", "Ajio", "Shopsy", "Website", "Other"];

export default function MarketplacePicker({ value, onChange, disabled, error }) {
    return (
        <ChoiceGroup label="Select Marketplace" error={error}>
            <div className={styles.root}>
                {MARKETPLACES.map((mp) => (
                    <button
                        key={mp}
                        type="button"
                        aria-pressed={value === mp}
                        className={cx(styles.pill, value === mp && styles.pillActive)}
                        onClick={() => onChange(mp)}
                        disabled={disabled}
                    >
                        <MarketplaceLogo marketplace={mp} size={20} />
                        <span>{mp}</span>
                    </button>
                ))}
            </div>
        </ChoiceGroup>
    );
}
