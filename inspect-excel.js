const XLSX = require('xlsx');
const path = require('path');

const files = [
  'Lista de Precios PRODUCTOS - KERANAI PRODUCTOS.xlsx',
  'Lista de Precios SERVICIOS- KERANAI AGENCIA DISEÑO DIGITAL.xlsx'
];

const basePath = 'D:\\TRABAJOS\\AGENCIA K\\KERANAI\\PRESUPUESTOS';

files.forEach(fileName => {
  const filePath = path.join(basePath, fileName);
  console.log(`=== Inspecting: ${fileName} ===`);
  try {
    const workbook = XLSX.readFile(filePath);
    const sheetNames = workbook.SheetNames;
    console.log(`Sheets: ${sheetNames.join(', ')}`);
    
    // Read the first sheet
    const sheet = workbook.Sheets[sheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    console.log(`Rows count: ${data.length}`);
    console.log('First 7 rows:');
    data.slice(0, 7).forEach((row, idx) => {
      console.log(`  Row ${idx}:`, row);
    });
  } catch(e) {
    console.error(`Error reading ${fileName}:`, e.message);
  }
  console.log('\n');
});
