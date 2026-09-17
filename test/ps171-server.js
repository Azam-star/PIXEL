'use strict';

/**
 * PS171 Deterministic Local Test Server
 * Zero-dependency static server for offline testing and benchmarks.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8181;
const TESTBED_PATH = path.resolve(__dirname, 'fixtures/ps171-testbed.html');

function startServer(port = PORT) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/index.html' || req.url.startsWith('/ps171')) {
        try {
          const html = fs.readFileSync(TESTBED_PATH, 'utf8');
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end('Error loading testbed: ' + err.message);
        }
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
      }
    });

    server.listen(port, '127.0.0.1', () => {
      resolve(server);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Already running on this port, fine for test reuse
        resolve(null);
      } else {
        reject(err);
      }
    });
  });
}

if (require.main === module) {
  startServer().then(server => {
    if (server) {
      console.log(`[PS171 Server] Running locally at http://127.0.0.1:${PORT}`);
    } else {
      console.log(`[PS171 Server] Port ${PORT} already active.`);
    }
  });
}

module.exports = { startServer, PORT, TESTBED_PATH };
