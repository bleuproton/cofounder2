import http from 'http';
import { createReadStream, statSync, existsSync } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const dist = path.join(__dirname, 'dist');

const server = http.createServer((req, res) => {
  const reqPath = req.url.split('?')[0];
  let filePath = path.join(dist, reqPath === '/' ? '/index.html' : reqPath);
  if (!filePath.startsWith(dist)) {
    res.writeHead(403);
    return res.end('forbidden');
  }
  if (!existsSync(filePath)) {
    filePath = path.join(dist, 'index.html');
  }
  try {
    const stats = statSync(filePath);
    res.writeHead(200, {
      'Content-Length': stats.size,
      'Content-Type': filePath.endsWith('.html') ? 'text/html' : 'text/plain'
    });
    createReadStream(filePath).pipe(res);
  } catch (e) {
    res.writeHead(404);
    res.end('not found');
  }
});

const port = process.env.PORT || process.env.npm_config_port || 5173;
server.listen(port, '0.0.0.0', () => {
  console.log(`Preview server running at http://localhost:${port}`);
});
