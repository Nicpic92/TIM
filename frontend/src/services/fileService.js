import * as XLSX from 'xlsx';

/**
 * Utility to read an XLSX file and convert it to a JSON object array.
 * Uses a robust two-pass method to ensure accurate header detection.
 * @param {File} file The file object from a file input.
 * @returns {Promise<Array<object>>} A promise that resolves with the sheet data.
 */
function parseXlsxFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];

        // First pass: Read the first row to get headers.
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, range: 0 });

        if (!rawData || rawData.length === 0 || !rawData[0]) {
          return reject(new Error("File is empty or contains no readable data."));
        }
        
        // Clean headers: handle nulls, trailing spaces, etc.
        const cleanHeaders = rawData[0]
          .map(h => (h != null ? String(h).trim() : null))
          .filter(h => h && h.length > 0);

        if (cleanHeaders.length === 0) {
          return reject(new Error("Could not detect any valid column headers in the first row."));
        }
        
        // Second pass: Convert the rest of the sheet to JSON using the clean headers.
        const processedData = XLSX.utils.sheet_to_json(sheet, {
          header: cleanHeaders, 
          range: 1 // Start data from the second row
        });
        
        resolve(processedData);
      } catch (err) {
        console.error("Error parsing XLSX file:", err);
        reject(new Error("Failed to parse the XLSX file. Please ensure it's a valid format."));
      }
    };

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      reject(new Error("An error occurred while reading the file."));
    };

    reader.readAsArrayBuffer(file);
  });
}

export const fileService = {
  parseXlsxFile,
};
