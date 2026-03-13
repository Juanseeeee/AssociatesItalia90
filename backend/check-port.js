const net = require('net');
const fs = require('fs');
const client = new net.Socket();
client.connect(3001, '127.0.0.1', function() {
	fs.writeFileSync('port_status.txt', 'Connected');
	client.destroy();
});
client.on('error', function(e) {
	fs.writeFileSync('port_status.txt', 'Failed: ' + e.message);
});
