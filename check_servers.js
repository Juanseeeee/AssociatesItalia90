
const http = require('http');
const fs = require('fs');

const results = [];

function log(msg) {
  results.push(msg);
  fs.writeFileSync('c:\\Users\\juans\\Documents\\trae_projects\\AssociatesItalia90\\check_results.txt', results.join('\n'));
}

function checkPort(port, name) {
  const options = {
    hostname: 'localhost',
    port: port,
    path: '/',
    method: 'GET',
    timeout: 2000
  };

  const req = http.request(options, (res) => {
    log(`${name} (Port ${port}) is running. Status: ${res.statusCode}`);
  });

  req.on('error', (e) => {
    log(`${name} (Port ${port}) is NOT running or not reachable. Error: ${e.message}`);
  });

  req.on('timeout', () => {
    req.destroy();
    log(`${name} (Port ${port}) timed out.`);
  });

  req.end();
}

checkPort(3001, 'Backend');
checkPort(5173, 'Frontend');
