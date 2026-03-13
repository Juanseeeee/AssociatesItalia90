import fs from 'fs';
try {
  fs.writeFileSync('test-simple.txt', 'IT WORKS');
  console.log('Success');
} catch (e) {
  console.error(e);
}
