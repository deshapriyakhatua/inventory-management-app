import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";

// Shared search input of the single and multi-select inventory modals.
// data-autofocus makes it the Modal's initial focus target (page.js also focuses inputRef).
export default function InventorySearchBar({ inputRef, value, onChange, onClear }) {
  return (
    <Input
      ref={inputRef}
      type="text"
      aria-label="Search by Inventory ID or category..."
      placeholder="Search by Inventory ID or category..."
      value={value}
      onChange={onChange}
      data-autofocus
      leading={<Icon name="icon-9c4a10ac" size={16} />}
      trailing={value ? (
        <IconButton
          name="remove-this-product"
          size="sm"
          aria-label="Clear search"
          onClick={onClear}
        />
      ) : null}
    />
  );
}
