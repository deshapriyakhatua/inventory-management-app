import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Input from "@/components/ui/Input/Input";
import styles from "./SkuFields.module.css";

export default function SkuFields({
    showStyleId,
    styleId,
    onStyleIdChange,
    skuId,
    onSkuIdChange,
    onSkuBlur,
    skuError,
    skuDisabled,
    disabled,
    onGenerate,
    generateDisabled,
    isGenerating,
}) {
    return (
        <div className={styles.root}>
            {showStyleId && (
                <FormField label="Style ID (Myntra)">
                    <Input
                        type="text"
                        id="styleId"
                        value={styleId}
                        onChange={onStyleIdChange}
                        placeholder="e.g., 29481052"
                        disabled={disabled}
                    />
                </FormField>
            )}

            <div className={styles.skuRow}>
                <FormField label="Product SKU ID" error={skuError}>
                    <Input
                        type="text"
                        id="skuId"
                        value={skuId}
                        onChange={onSkuIdChange}
                        onBlur={onSkuBlur}
                        placeholder="e.g., ER-01-0001"
                        disabled={skuDisabled}
                    />
                </FormField>
                <Button
                    variant="secondary"
                    className={styles.generateBtn}
                    onClick={onGenerate}
                    disabled={generateDisabled}
                >
                    {isGenerating ? "Generating..." : skuId ? "Regenerate SKU" : "Generate SKU"}
                </Button>
            </div>
        </div>
    );
}
