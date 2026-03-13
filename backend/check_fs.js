
import fs from 'fs';
try {
  fs.writeFileSync('test_fs.txt', 'FileSystem is working');
  console.log('File written successfully');
} catch (err) {
  console.error('Error writing file:', err);
}
