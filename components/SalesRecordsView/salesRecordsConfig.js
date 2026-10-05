export const ALL_COLUMNS = [
    { key: "skuId", label: "SKU ID" },
    { key: "month", label: "Month" },
    { key: "year", label: "Year" },
    { key: "salesChannel", label: "Channel" },
    { key: "grossUnits", label: "Gross Units" },
    { key: "logisticsReturns", label: "Log Returns" },
    { key: "customerReturns", label: "Cust Returns" },
    { key: "cancellations", label: "Cancellations" },
    { key: "netUnits", label: "Net Units" },
    { key: "netSales", label: "Net Sales (₹)" },
    { key: "totalExpenses", label: "Expenses (₹)" },
    { key: "otherBenefits", label: "Benefits (₹)" },
    { key: "projectedBankSettlement", label: "Settlement (₹)" },
    { key: "timestamp", label: "Recorded At" },
];

export const DEFAULT_VISIBLE = [
    "skuId", "month", "year", "salesChannel",
    "grossUnits", "netUnits", "netSales", "projectedBankSettlement",
];

export const MONTHS = [
    { value: "1", label: "January" }, { value: "2", label: "February" }, { value: "3", label: "March" },
    { value: "4", label: "April" }, { value: "5", label: "May" }, { value: "6", label: "June" },
    { value: "7", label: "July" }, { value: "8", label: "August" }, { value: "9", label: "September" },
    { value: "10", label: "October" }, { value: "11", label: "November" }, { value: "12", label: "December" },
];

export const SALES_CHANNELS = ["Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other"];

export const CURRENCY_KEYS = ["netSales", "totalExpenses", "otherBenefits", "projectedBankSettlement"];

// Right-aligned, tabular-number columns
export const NUMERIC_KEYS = ["grossUnits", "logisticsReturns", "customerReturns", "cancellations", "netUnits", ...CURRENCY_KEYS];

export const PAGE_SIZES = [100, 250, 500, 1000, 2000, 5000];

export const formatDate = (dateStr) => {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-IN", {
            year: "numeric", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit",
        });
    } catch { return dateStr; }
};

export const getMonthName = (monthNumber) => {
    if (!monthNumber) return "—";
    const found = MONTHS.find(m => m.value === String(monthNumber));
    return found ? found.label : monthNumber;
};

export const formatCurrency = (val) => {
    if (val == null || isNaN(Number(val))) return "—";
    return `₹${Number(val).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const generateYearOptions = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => currentYear - 4 + i);
};
