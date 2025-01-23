#!/usr/bin/env node
import { parse } from './parse.js';
import { createServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import manifest from './package.json' assert { type: 'json' };

const [folderPath] = process.argv.slice(2);
if (folderPath === '--version') {
  console.log(manifest.version);
  process.exit(0);
}
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
