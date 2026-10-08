// ─── Constants ───────────────────────────────────────────────────────────────
export const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const SALES_CHANNELS = [
  "Amazon", "Flipkart", "Shopsy", "Myntra", "Meesho", "Ajio", "Website", "Other",
];

export const COMPARE_FIELDS = [
  { key: "salesChannel", label: "Sales Channel" },
  { key: "grossUnits", label: "Gross Units" },
  { key: "logisticsReturns", label: "Logistics Returns" },
  { key: "customerReturns", label: "Customer Returns" },
  { key: "cancellations", label: "Cancellations" },
  { key: "netUnits", label: "Net Units" },
  { key: "netSales", label: "Net Sales (₹)" },
  { key: "totalExpenses", label: "Total Expenses (₹)" },
  { key: "otherBenefits", label: "Other Benefits (₹)" },
  { key: "projectedBankSettlement", label: "Proj. Bank Settlement (₹)" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
let _rowCounter = 0;
const newRowId = () => `row_${++_rowCounter}_${Date.now()}`;

export const emptyRow = () => ({
  id: newRowId(),
  skuId: "",
  salesChannel: "",
  grossUnits: "",
  logisticsReturns: "",
  customerReturns: "",
  cancellations: "",
  netUnits: "",
  netUnitsManual: false,
  netSales: "",
  totalExpenses: "",
  otherBenefits: "",
  projectedBankSettlement: "",
  pickerOpen: false,
  pickerSearch: "",
});

export const computeNetUnits = (row) => {
  const g = parseFloat(row.grossUnits) || 0;
  const l = parseFloat(row.logisticsReturns) || 0;
  const c = parseFloat(row.customerReturns) || 0;
  const ca = parseFloat(row.cancellations) || 0;
  return g - l - c - ca;
};

export const hasNetMismatch = (row) => {
  if (!row.netUnitsManual || row.netUnits === "") return false;
  const computed = computeNetUnits(row);
  const entered = parseFloat(row.netUnits);
  return !isNaN(entered) && computed !== entered;
};
