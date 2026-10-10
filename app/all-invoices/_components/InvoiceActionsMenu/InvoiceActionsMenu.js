"use client";

import { useLayoutEffect, useRef } from "react";
import Icon from "@/components/ui/Icon/Icon";
import IconButton from "@/components/ui/IconButton/IconButton";
import cx from "@/components/ui/cx";
import styles from "./InvoiceActionsMenu.module.css";

const MENU_GAP = 6;

// The menu is position: fixed and placed from the trigger's rect so the Table's scroll
// viewport cannot clip it; it flips upward when there is no room below.
function placeMenu(trigger, menu) {
  const rect = trigger.getBoundingClientRect();
  const { clientWidth, clientHeight } = document.documentElement;
  const spaceBelow = clientHeight - rect.bottom;
  const openUp = spaceBelow < menu.offsetHeight + MENU_GAP && rect.top > spaceBelow;
  menu.style.right = `${clientWidth - rect.right}px`;
  menu.style.top = openUp ? "auto" : `${rect.bottom + MENU_GAP}px`;
  menu.style.bottom = openUp ? `${clientHeight - rect.top + MENU_GAP}px` : "auto";
  menu.dataset.placement = openUp ? "top" : "bottom";
}

// 3-dot dropdown for one invoice row. The wrapper keeps the `data-action-menu`
// attribute that page.js's document click-outside listener relies on.
export default function InvoiceActionsMenu({
  inv,
  showArchived,
  isOpen,
  onToggle,
  onGraphical,
  onPdf,
  onPaymentQr,
  onEdit,
  onArchive,
  onRestore,
  onPermanentDelete,
}) {
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  useLayoutEffect(() => {
    if (!isOpen) return undefined;
    const place = () => {
      if (triggerRef.current && menuRef.current) placeMenu(triggerRef.current, menuRef.current);
    };
    place();
    window.addEventListener("scroll", place, true);
    window.addEventListener("resize", place);
    return () => {
      window.removeEventListener("scroll", place, true);
      window.removeEventListener("resize", place);
    };
  }, [isOpen]);

  const showPaymentQr =
    inv.paymentStatus === "Pending" ||
    inv.paymentStatus === "Partially Paid" ||
    (inv.balanceAmount !== undefined
      ? inv.balanceAmount > 0
      : (inv.grandTotal || 0) - (inv.receivedAmount || 0) > 0);

  return (
    <div className={styles.root} data-action-menu>
      <IconButton
        ref={triggerRef}
        name="actions"
        size="sm"
        variant="ghost"
        onClick={(e) => onToggle(e, inv._id)}
        title="Actions"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
      />

      {isOpen && (
        <div ref={menuRef} className={styles.menu} role="menu">
          <button type="button" role="menuitem" className={styles.item} onClick={() => onGraphical(inv)}>
            <Icon name="view-graphical" size={15} />
            View (Graphical)
          </button>
          <button type="button" role="menuitem" className={styles.item} onClick={() => onPdf(inv)}>
            <Icon name="pdf-preview" size={15} />
            PDF Preview
          </button>
          {showPaymentQr && (
            <button type="button" role="menuitem" className={styles.item} onClick={() => onPaymentQr(inv)}>
              <Icon name="payment-qr-balance" size={15} />
              Payment QR (Balance)
            </button>
          )}
          {!showArchived ? (
            <>
              <button type="button" role="menuitem" className={styles.item} onClick={() => onEdit(inv)}>
                <Icon name="edit-inventory" size={15} />
                Edit Invoice
              </button>
              <div role="separator" className={styles.divider} />
              <button
                type="button"
                role="menuitem"
                className={cx(styles.item, styles.danger)}
                onClick={() => onArchive(inv)}
              >
                <Icon name="trash" size={15} />
                Archive
              </button>
            </>
          ) : (
            <>
              <button type="button" role="menuitem" className={styles.item} onClick={() => onRestore(inv)}>
                <Icon name="restore-invoice" size={15} />
                Restore Invoice
              </button>
              <div role="separator" className={styles.divider} />
              <button
                type="button"
                role="menuitem"
                className={cx(styles.item, styles.danger)}
                onClick={() => onPermanentDelete(inv)}
              >
                <Icon name="trash" size={15} />
                Delete Permanently
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
