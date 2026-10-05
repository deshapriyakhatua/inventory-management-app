"use client";

import Image from "next/image";
import EmptyState from "@/components/ui/EmptyState/EmptyState";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import Input from "@/components/ui/Input/Input";
import Modal from "@/components/ui/Modal/Modal";
import Spinner from "@/components/ui/Spinner/Spinner";
import cx from "@/components/ui/cx";
import styles from "./InventoryPickerModal.module.css";

export default function InventoryPickerModal({
  open,
  onClose,
  searchRef,
  search,
  onSearchChange,
  loading,
  inventory,
  selectedInventoryId,
  onPick,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Select Inventory Item"
      description="Choose which internal inventory this purchase maps to."
    >
      <div className={styles.root}>
        <Input
          ref={searchRef}
          type="text"
          aria-label="Search by inventory ID"
          placeholder="Search by inventory ID..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          data-autofocus
          leading={<Icon name="icon-9c4a10ac" size={16} />}
          trailing={search ? (
            <IconButton
              name="remove-this-product"
              size="sm"
              aria-label="Clear search"
              onClick={() => onSearchChange("")}
            />
          ) : null}
        />

        {loading ? (
          <div className={styles.status}>
            <Spinner label="Loading inventory" />
            <span>Loading inventory...</span>
          </div>
        ) : inventory.length === 0 ? (
          <EmptyState
            icon={<Icon name="icon-9c4a10ac" size={40} />}
            title="No inventory items found."
          />
        ) : (
          <div className={styles.grid}>
            {inventory.map(inv => {
              const isSelected = selectedInventoryId === inv.inventoryId;
              return (
                <button
                  key={inv._id}
                  type="button"
                  className={cx(styles.card, isSelected && styles.cardSelected)}
                  onClick={() => onPick(inv)}
                  aria-pressed={isSelected}
                >
                  <span className={styles.media}>
                    {inv.imageUrl
                      ? <Image src={inv.imageUrl} alt={inv.inventoryId} fill sizes="10rem" className={styles.image} unoptimized />
                      : <span className={styles.noImage}>No Image</span>
                    }
                    {isSelected && (
                      <span className={styles.tick}>
                        <Icon name="icon-5ab11cbf" size={12} />
                      </span>
                    )}
                  </span>
                  <span className={styles.cardId}>{inv.inventoryId}</span>
                  {inv.currentStock !== undefined && (
                    <span className={cx(styles.stock, inv.currentStock <= 10 && styles.stockLow)}>
                      Stock: {inv.currentStock ?? 0}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </Modal>
  );
}
