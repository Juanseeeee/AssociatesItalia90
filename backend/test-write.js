const fs = require('fs');
console.log('Writing test file...');
try {
  fs.writeFileSync('test_output.txt', 'Hello from Node.js!');
  console.log('File written successfully.');
} catch (e) {
  console.error('Error writing file:', e);
}
