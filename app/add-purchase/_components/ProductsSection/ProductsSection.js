import Badge from "@/components/ui/Badge/Badge";
import Button from "@/components/ui/Button/Button";
import Icon from "@/components/ui/Icon/Icon";
import FormSection from "../FormSection/FormSection";
import LineItemCard from "../LineItemCard/LineItemCard";
import styles from "./ProductsSection.module.css";

export default function ProductsSection({
  items,
  sellerSelected,
  mappingsLoading,
  mappings,
  getItemErrors,
  onRemoveItem,
  onSkuChange,
  onItemChange,
  onItemBlur,
  onOpenPicker,
  onAddItem,
}) {
  return (
    <FormSection
      icon="icon-9172bca2"
      title="Products"
      aside={<Badge tone="accent">{items.length} item{items.length !== 1 ? "s" : ""}</Badge>}
    >
      {!sellerSelected && (
        <div className={styles.hint}>
          <Icon name="icon-fe5d7d4f" size={18} />
          Select a seller above to start adding products.
        </div>
      )}

      <div className={styles.items}>
        {items.map((item, index) => (
          <LineItemCard
            key={item.id}
            item={item}
            index={index}
            canRemove={items.length > 1}
            sellerSelected={sellerSelected}
            mappingsLoading={mappingsLoading}
            mappings={mappings}
            errors={getItemErrors(item)}
            onRemove={() => onRemoveItem(item.id)}
            onSkuChange={value => onSkuChange(item.id, value)}
            onChange={(field, value) => onItemChange(item.id, field, value)}
            onBlurField={field => onItemBlur(item.id, field)}
            onOpenPicker={() => onOpenPicker(item.id)}
          />
        ))}
      </div>

      <Button
        variant="secondary"
        className={styles.addItem}
        onClick={onAddItem}
        disabled={!sellerSelected}
        leftIcon={<Icon name="add-another-product" size={16} />}
      >
        Add Another Product
      </Button>
    </FormSection>
  );
}
