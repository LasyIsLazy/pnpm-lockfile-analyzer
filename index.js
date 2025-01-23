import { parse } from './parse.js';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const [folderPath] = process.argv.slice(2);
if (!folderPath) {
  throw new Error('You should pass an argument as folder path');
}
parse(folderPath);
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const pageFolder = path.join(__dirname, 'page');

const server = await createServer({
  root: pageFolder,
});

const { httpServer } = await server.listen();
if (httpServer.address()) {
  const { port } = httpServer.address();
  console.log(`Server start on: http://localhost:${port}`);
} else {
  console.error('Server start failed');
}
