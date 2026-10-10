"use client";

import { useState, useEffect } from "react";

// 3-dot row action menu: open id, click-outside close, menu item handlers.
export default function useActionMenu({
  handleOpenGraphicalModal,
  handleOpenPdf,
  handleOpenPaymentQr,
  handleOpenEdit,
  handleArchive,
  handleRestore,
  handlePermanentDelete,
}) {
  // 3-Dot Dropdown Menu State
  const [openMenuId, setOpenMenuId] = useState(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest("[data-action-menu]")) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // ── JSX handlers (moved from inline arrows, identical bodies) ──────
  const handleToggleMenu = (e, id) => {
    e.stopPropagation();
    setOpenMenuId(openMenuId === id ? null : id);
  };
  const handleMenuGraphical = (inv) => { setOpenMenuId(null); handleOpenGraphicalModal(inv); };
  const handleMenuPdf = (inv) => { setOpenMenuId(null); handleOpenPdf(inv); };
  const handleMenuPaymentQr = (inv) => { setOpenMenuId(null); handleOpenPaymentQr(inv); };
  const handleMenuEdit = (inv) => { setOpenMenuId(null); handleOpenEdit(inv); };
  const handleMenuArchive = (inv) => { setOpenMenuId(null); handleArchive(inv._id, inv.invoiceNumber); };
  const handleMenuRestore = (inv) => { setOpenMenuId(null); handleRestore(inv._id, inv.invoiceNumber); };
  const handleMenuPermanentDelete = (inv) => { setOpenMenuId(null); handlePermanentDelete(inv._id, inv.invoiceNumber); };

  return {
    openMenuId,
    menuHandlers: {
      onToggle: handleToggleMenu,
      onGraphical: handleMenuGraphical,
      onPdf: handleMenuPdf,
      onPaymentQr: handleMenuPaymentQr,
      onEdit: handleMenuEdit,
      onArchive: handleMenuArchive,
      onRestore: handleMenuRestore,
      onPermanentDelete: handleMenuPermanentDelete,
    },
  };
}
