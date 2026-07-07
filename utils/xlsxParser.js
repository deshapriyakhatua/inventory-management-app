import * as XLSX from 'xlsx';

/**
 * Helper to accurately map Excel column letters to 0-based array indexes.
 */
const getColIndex = (letter) => {
  let column = 0;
  for (let i = 0; i < letter.length; i++) {
    column = column * 26 + (letter.charCodeAt(i) - 64);
  }
  return column - 1;
};

/**
 * Aggregates all metrics directly from the 'Orders P&L' sheet grouped by SKU and Channel.
 * @param {Buffer | ArrayBuffer} fileBuffer - The Excel file data as a buffer.
 * @returns {Array<Object>} Aggregated metrics per SKU per Sales Channel.
 */
export function parseSKULevelPL(fileBuffer) {
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  const sheetName = 'Orders P&L';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in the workbook.`);
  }

  // Convert worksheet to a 2D array matrix
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  // 1. Define Column Layout for 'Orders P&L'
  const colIndexMap = {
    skuId: getColIndex('D'),                  // Seller SKU
    salesChannel: getColIndex('F'),           // Channel of sale (Flipkart/Shopsy)
    grossUnits: getColIndex('J'),             // Standard layout metrics
    logisticsReturns: getColIndex('L'),       // Note: Double check if these letters map exactly 
    customerReturns: getColIndex('M'),        // to your specific Orders P&L sheet columns.
    cancellations: getColIndex('N'),          
    netUnits: getColIndex('O'),               
    netSales: getColIndex('V'),               
    totalExpenses: getColIndex('AB'),          
    otherBenefits: getColIndex('AU'),         
    projectedBankSettlement: getColIndex('AX') 
  };

  // Safe numerical extractor helper
  const getNum = (row, idx) => {
    const val = row[idx];
    if (val === undefined || val === null || String(val).trim() === '-' || String(val).trim() === '') {
      return 0;
    }
    const num = Number(val);
    return !isNaN(num) ? num : 0;
  };

  // 2. Aggregate rows using a map
  const aggregationMap = {};

  // Assuming data starts on Row 3 (Index 2). Adjust to 1 if headers are on row 1.
  const START_ROW_INDEX = 2; 

  for (let i = START_ROW_INDEX; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!row || row.length === 0) continue;

    const skuId = row[colIndexMap.skuId] ? String(row[colIndexMap.skuId]).trim() : '';
    const salesChannel = row[colIndexMap.salesChannel] ? String(row[colIndexMap.salesChannel]).trim() : 'Unknown';

    // If there's no valid SKU, skip the transactional row
    if (!skuId) continue;

    // Create a unique compound key combining SKU and Platform Channel
    const compoundKey = `${skuId}_${salesChannel}`;

    // Initialize object if this unique combination hasn't been seen yet
    if (!aggregationMap[compoundKey]) {
      aggregationMap[compoundKey] = {
        skuId: skuId,
        salesChannel: salesChannel,
        grossUnits: 0,
        logisticsReturns: 0,
        customerReturns: 0,
        cancellations: 0,
        netUnits: 0,
        netSales: 0,
        totalExpenses: 0,
        otherBenefits: 0,
        projectedBankSettlement: 0
      };
    }

    // Accumulate the metric totals dynamically
    aggregationMap[compoundKey].grossUnits += getNum(row, colIndexMap.grossUnits);
    aggregationMap[compoundKey].logisticsReturns += getNum(row, colIndexMap.logisticsReturns);
    aggregationMap[compoundKey].customerReturns += getNum(row, colIndexMap.customerReturns);
    aggregationMap[compoundKey].cancellations += getNum(row, colIndexMap.cancellations);
    aggregationMap[compoundKey].netUnits += getNum(row, colIndexMap.netUnits);
    aggregationMap[compoundKey].netSales += getNum(row, colIndexMap.netSales);
    aggregationMap[compoundKey].totalExpenses += getNum(row, colIndexMap.totalExpenses);
    aggregationMap[compoundKey].otherBenefits += getNum(row, colIndexMap.otherBenefits);
    aggregationMap[compoundKey].projectedBankSettlement += getNum(row, colIndexMap.projectedBankSettlement);
  }

  // 3. Convert the map back to a clean array of objects for your Next.js application
  return Object.values(aggregationMap);
}