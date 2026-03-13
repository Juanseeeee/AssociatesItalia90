
const fs = require('fs');
try {
  fs.writeFileSync('c:\\Users\\juans\\Documents\\trae_projects\\AssociatesItalia90\\test_write.txt', 'test content');
  console.log('File written successfully');
} catch (err) {
  console.error('Error writing file:', err);
}
