
const fs = require('fs');
const path = require('path');
const file = path.join('c:', 'Users', 'juans', 'Documents', 'trae_projects', 'AssociatesItalia90', 'debug_log.txt');
try {
  fs.writeFileSync(file, 'Debug Log Success');
  console.log('Wrote to ' + file);
} catch (e) {
  console.error(e);
}
