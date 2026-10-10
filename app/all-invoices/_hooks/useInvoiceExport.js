"use client";

import { toast } from "sonner";
import * as XLSX from "xlsx";

import { buildInvoicesWorkbook } from "@/app/all-invoices/allInvoicesExport";

// Multi-sheet Excel export wrapper.
export default function useInvoiceExport({ invoices, showArchived }) {
  // ── Multi-Sheet Excel Export (Summary, Grouped, Raw Data) ──────────
  const exportInvoicesToExcel = () => {
    if (!invoices || invoices.length === 0) {
      toast.error("No invoices available to export.");
      return;
    }

    const workbook = buildInvoicesWorkbook(invoices, showArchived);

    // Write file
    const fileName = `All_Invoices_Report_${showArchived ? "Archived_" : ""}${new Date().toISOString().split("T")[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    toast.success(`Successfully downloaded Excel report: ${fileName}`);
  };

  return { exportInvoicesToExcel };
}
