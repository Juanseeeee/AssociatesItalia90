
const net = require('net');
const fs = require('fs');

const logFile = 'ports_status.txt';
fs.writeFileSync(logFile, 'Checking ports...\n');

const checkPort = (port, name) => {
  const client = new net.Socket();
  client.setTimeout(2000);
  
  client.on('connect', () => {
    fs.appendFileSync(logFile, `${name} is running on port ${port}\n`);
    client.destroy();
  });
  
  client.on('timeout', () => {
    fs.appendFileSync(logFile, `${name} port ${port} check timed out\n`);
    client.destroy();
  });
  
  client.on('error', (err) => {
    fs.appendFileSync(logFile, `${name} is NOT running on port ${port} (${err.message})\n`);
  });
  
  client.connect(port, '127.0.0.1');
};

checkPort(3001, 'Backend');
checkPort(5173, 'Frontend');
