"use client";
import { useState } from "react";

// Hovered image popover state and positioning.
export default function useImagePreview() {
  // Hovered Image Popover State
  const [hoveredImage, setHoveredImage] = useState(null);

  const handleImageMouseEnter = (e, item) => {
    if (!item?.imageUrl) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const previewWidth = 220;
    const previewHeight = 230;

    let left = rect.right + 12;
    if (left + previewWidth > window.innerWidth) {
      left = rect.left - previewWidth - 12;
    }

    let top = rect.top + rect.height / 2 - previewHeight / 2;
    if (top < 10) top = 10;
    if (top + previewHeight > window.innerHeight - 10) {
      top = window.innerHeight - previewHeight - 10;
    }

    setHoveredImage({
      url: item.imageUrl,
      title: item.inventoryId || "Inventory Item",
      left,
      top,
    });
  };

  const handleImageMouseLeave = () => {
    setHoveredImage(null);
  };

  return { hoveredImage, handleImageMouseEnter, handleImageMouseLeave };
}
