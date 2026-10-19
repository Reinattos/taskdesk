import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('./dist', import.meta.url));
const port = Number(process.env.PORT || 5173);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function resolvePath(url) {
  const requested = decodeURIComponent(new URL(url, `http://127.0.0.1:${port}`).pathname);
  const cleanPath = normalize(requested).replace(/^(\.\.[/\\])+/, '');
  const filePath = join(root, cleanPath === '/' ? 'index.html' : cleanPath);
  if (existsSync(filePath) && statSync(filePath).isFile()) return filePath;
  return join(root, 'index.html');
}

createServer((request, response) => {
  const filePath = resolvePath(request.url || '/');
  response.setHeader('Content-Type', contentTypes[extname(filePath)] || 'application/octet-stream');
  createReadStream(filePath)
    .on('error', () => {
      response.statusCode = 500;
      response.end('Erro ao servir o TaskDesk.');
    })
    .pipe(response);
}).listen(port, '127.0.0.1', () => {
  console.log(`TaskDesk rodando em http://127.0.0.1:${port}/`);
});
