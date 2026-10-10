"use client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

// Owns the "download filtered SKUs as Excel" export.
export default function useListingsExport({ getFilteredListings, selectedMarketplace }) {
    const handleDownloadExcel = () => {
        const filteredData = getFilteredListings();

        if (!filteredData || filteredData.length === 0) {
            toast.error("No filtered listings to download.", { id: "app-feedback", duration: 3000 });
            return;
        }

        const isMyntra = selectedMarketplace === "Myntra" || filteredData.some(item => item.marketplace === "Myntra" || Boolean(item.styleId));

        const dataToExport = filteredData.map(item => {
            const row = { "SKU ID": item.skuId };
            if (isMyntra) {
                row["Style ID"] = item.styleId || "";
            }
            return row;
        });

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);

        const colWidths = [{ wch: 25 }];
        if (isMyntra) {
            colWidths.push({ wch: 25 });
        }
        worksheet["!cols"] = colWidths;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "SKU List");

        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10);
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        const timestampStr = `${hours}-${minutes}-${seconds}`;

        const marketplaceSuffix = selectedMarketplace ? `_${selectedMarketplace}` : "";
        const fileName = `SKU_List${marketplaceSuffix}_${dateStr}_${timestampStr}.xlsx`;

        XLSX.writeFile(workbook, fileName);
        toast.success(`Excel sheet with all ${filteredData.length} filtered entries downloaded successfully.`, { id: "app-feedback", duration: 3000 });
    };

    return { handleDownloadExcel };
}
