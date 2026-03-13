import express from 'express';
const app = express();
app.get('/', (req, res) => res.send('Hello'));
const fs = require('fs');
fs.writeFileSync('c:/Users/juans/Documents/trae_projects/AssociatesItalia90/backend/server_test_out.txt', 'Server starting...');
app.listen(3002, () => {
  console.log('Server running on 3002');
  fs.appendFileSync('c:/Users/juans/Documents/trae_projects/AssociatesItalia90/backend/server_test_out.txt', '\nServer running on 3002');
});
