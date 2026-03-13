
import net from 'net';

const checkPort = (port) => {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.on('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('error', () => {
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
};

(async () => {
  const backend = await checkPort(3001);
  const frontend = await checkPort(5173);
  console.log(JSON.stringify({ backend, frontend }));
})();
