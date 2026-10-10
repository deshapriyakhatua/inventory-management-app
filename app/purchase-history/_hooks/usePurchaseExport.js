"use client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { buildPurchaseHistoryWorkbook } from "@/app/purchase-history/purchaseHistoryExport";

// Excel export + clipboard copy helper.
export default function usePurchaseExport({ showArchived, archivedProcessedGroups, processedGroups, archivedPurchases, filteredItems }) {
  // ── Multi-Sheet Excel Export (Summary, Grouped, Flat List) ────────
  const exportGroupedToExcel = () => {
    const targetGroups = showArchived ? archivedProcessedGroups : processedGroups;
    const targetItems = showArchived ? archivedPurchases : filteredItems;

    if (!targetGroups || targetGroups.length === 0) {
      toast.error("No purchase data available to export.", { id: "app-feedback", duration: 3000 });
      return;
    }

    const workbook = buildPurchaseHistoryWorkbook(targetGroups, targetItems, showArchived);

    // Write file
    const fileName = `Purchase_History_Report_${showArchived ? "Archived_" : ""}${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Successfully generated Excel report: ${fileName}`, { id: "app-feedback", duration: 3000 });
  };

  // ── Copy helper ──────────────────────────────────────────────────
  const copyToClipboard = (text, label = "Text") => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`Copied ${label} "${text}" to clipboard!`, { id: "app-feedback", duration: 3000 });
  };

  return { exportGroupedToExcel, copyToClipboard };
}
