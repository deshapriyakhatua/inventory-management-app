import * as XLSX from 'xlsx';

/**
 * Parses specific columns from the 'SKU-level P&L' sheet starting from row 3.
 * @param {Buffer | ArrayBuffer} fileBuffer - The Excel file data as a buffer.
 * @returns {Array<Object>} Array of row objects containing only the requested columns.
 */
export function parseSKULevelPL(fileBuffer) {
  // 1. Read the workbook from the buffer
  const workbook = XLSX.read(fileBuffer, { type: 'buffer' });

  const sheetName = 'SKU-level P&L';
  const worksheet = workbook.Sheets[sheetName];

  if (!worksheet) {
    throw new Error(`Sheet "${sheetName}" not found in the workbook.`);
  }

  // Column Mapping (Letter -> Frontend Schema Key)
  const targetColumns = {
    'A': 'skuId',
    'C': 'grossUnits',
    'E': 'logisticsReturns',
    'F': 'customerReturns',
    'G': 'cancellations',
    'H': 'netUnits',
    'L': 'netSales',
    'M': 'totalExpenses',
    'AH': 'otherBenefits',
    'AL': 'projectedBankSettlement'
  };

  // Helper to accurately map column letters to 0-based array indexes
  const getColIndex = (letter) => {
    let column = 0;
    for (let i = 0; i < letter.length; i++) {
      column = column * 26 + (letter.charCodeAt(i) - 64);
    }
    return column - 1;
  };

  // Build the index mapping map
  const columnIndexMap = {};
  Object.entries(targetColumns).forEach(([letter, key]) => {
    columnIndexMap[key] = getColIndex(letter);
  });

  // Convert worksheet to a 2D array matrix
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  const parsedData = [];
  
  // 2. Direct iteration starting from Excel Row 3 (Index 2)
  const START_ROW_INDEX = 2; 

  for (let i = START_ROW_INDEX; i < rawRows.length; i++) {
    const row = rawRows[i];
    
    // Skip completely empty rows if they exist
    if (!row || row.length === 0) continue;

    const rowData = {};
    let hasData = false;

    // Extract values based on our column map
    Object.entries(columnIndexMap).forEach(([key, colIdx]) => {
      const val = row[colIdx];
      
      if (val === undefined || val === null || String(val).trim() === '-' || String(val).trim() === '') {
        rowData[key] = key === 'skuId' ? '' : 0; 
      } else {
        if (key === 'skuId') {
            rowData[key] = String(val).trim();
            hasData = true;
        } else {
            // Automatically convert metric data to numerical types for frontend math/graphs
            const numVal = Number(val);
            rowData[key] = !isNaN(numVal) && typeof val !== 'boolean' ? numVal : val;
            hasData = true;
        }
      }
    });

    if (hasData) {
      parsedData.push(rowData);
    }
  }

  return parsedData;
}