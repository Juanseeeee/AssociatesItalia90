const http = require('http');
const fs = require('fs');

console.log('Testing backend health on port 3003...');
const logFile = 'health_result.txt';

const req = http.get('http://localhost:3003/', (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    const msg = `STATUS: ${res.statusCode}\nBODY: ${data}`;
    console.log(msg);
    fs.writeFileSync(logFile, msg);
  });
});

req.on('error', (e) => {
  const msg = `Problem with request: ${e.message}`;
  console.error(msg);
  fs.writeFileSync(logFile, msg);
});

req.end();
