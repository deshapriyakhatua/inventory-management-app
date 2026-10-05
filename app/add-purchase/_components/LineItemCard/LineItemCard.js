"use client";

import Image from "next/image";
import Button from "@/components/ui/Button/Button";
import FormField from "@/components/ui/FormField/FormField";
import Icon from "@/components/ui/Icon/Icon";
import Input from "@/components/ui/Input/Input";
import Select from "@/components/ui/Select/Select";
import cx from "@/components/ui/cx";
import styles from "./LineItemCard.module.css";

/* Drops the `required` prop FormField injects, since it is not valid on a <button>. */
function PickerTrigger({ item, onClick, required: _required, ...rest }) {
  return (
    <button
      {...rest}
      type="button"
      className={cx(styles.picker, item.inventoryId && styles.pickerFilled)}
      onClick={onClick}
      title="Click to select from inventory"
    >
      {item.imageUrl ? (
        <Image src={item.imageUrl} alt="Preview" width={32} height={32} className={styles.pickerImage} unoptimized />
      ) : (
        <span className={styles.pickerIcon}>
          <Icon name="icon-b99b6c9f" size={16} />
        </span>
      )}
      <span className={item.inventoryId ? styles.pickerValue : styles.pickerPlaceholder}>
        {item.inventoryId || "Click to select inventory..."}
      </span>
      <span className={styles.pickerIcon}>
        <Icon name="click-to-select-from-inventory" size={14} />
      </span>
    </button>
  );
}

export default function LineItemCard({
  item,
  index,
  canRemove,
  sellerSelected,
  mappingsLoading,
  mappings,
  errors,
  onRemove,
  onSkuChange,
  onChange,
  onBlurField,
  onOpenPicker,
}) {
  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <span className={styles.label}>Product {index + 1}</span>
        {canRemove && (
          <Button
            variant="ghost"
            size="sm"
            className={styles.removeButton}
            onClick={onRemove}
            title="Remove this product"
            leftIcon={<Icon name="remove-this-product" size={14} />}
          >
            Remove
          </Button>
        )}
      </div>

      <div className={styles.grid}>
        <FormField label="Seller SKU" required>
          <Select
            value={item.sellerProductId}
            onChange={e => onSkuChange(e.target.value)}
            disabled={!sellerSelected || mappingsLoading}
          >
            <option value="">
              {mappingsLoading ? "Loading SKUs..." : "-- Select Mapped SKU --"}
            </option>
            {/* Shown when inventory was picked without a matching seller SKU */}
            {item.sellerProductId === "NA" && (
              <option value="NA">NA (no mapping)</option>
            )}
            {mappings.map(m => (
              <option key={m.sellerProductId} value={m.sellerProductId}>
                {m.sellerProductId}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Internal Inventory ID" required error={errors.inventoryId}>
          <PickerTrigger item={item} onClick={onOpenPicker} />
        </FormField>

        <FormField label="Quantity" required error={errors.quantity}>
          <Input
            type="number"
            min="1"
            placeholder="e.g. 50"
            value={item.quantity}
            onChange={e => onChange("quantity", e.target.value)}
            onBlur={() => onBlurField("quantity")}
          />
        </FormField>

        <FormField label="Unit Price" required error={errors.price}>
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            leading="₹"
            value={item.price}
            onChange={e => onChange("price", e.target.value)}
            onBlur={() => onBlurField("price")}
          />
        </FormField>

        <FormField label="Shipping Fee">
          <Input
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            leading="₹"
            value={item.shippingFee}
            onChange={e => onChange("shippingFee", e.target.value)}
          />
        </FormField>

        <FormField label="Tax (%)">
          <Input
            type="number"
            min="0"
            max="100"
            step="0.01"
            placeholder="e.g. 18"
            value={item.taxPercentage}
            onChange={e => onChange("taxPercentage", e.target.value)}
          />
        </FormField>
      </div>
    </div>
  );
}
