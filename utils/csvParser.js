import Papa from 'papaparse';

/**
 * A generic CSV parser for Next.js/React
 * @param {File} file - The file from the input field
 * @param {Function} transformFn - (Optional) A function to format each row
 * @returns {Promise<Array>} - Resolves to an array of objects
 */
export const parseCSV = (file, transformFn = null) => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      // dynamicTyping: true, // Automatically converts numbers/booleans (optional)
      complete: (results) => {
        let data = results.data;

        // If a transform function is provided, run it on every row
        if (transformFn && typeof transformFn === 'function') {
          data = data.map(transformFn);
        }

        resolve(data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};