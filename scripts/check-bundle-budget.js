import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';

const BUNDLE_BUDGET_BYTES = 300 * 1024;
const indexPath = new URL('../client/dist/index.html', import.meta.url);
const indexHtml = await readFile(indexPath, 'utf8');
const assetPaths = [...indexHtml.matchAll(/(?:href|src)="(\/assets\/[^"?]+)"/g)].map(
  ([, assetPath]) => assetPath,
);

const sizes = await Promise.all(
  assetPaths.map(async (assetPath) => {
    const asset = await readFile(new URL(`../client/dist${assetPath}`, import.meta.url));
    return gzipSync(asset).length;
  }),
);
const totalBytes = sizes.reduce((total, size) => total + size, 0);

if (totalBytes > BUNDLE_BUDGET_BYTES) {
  process.stderr.write(
    `Client first payload is ${totalBytes} bytes gzip, exceeding the ${BUNDLE_BUDGET_BYTES}-byte budget.\n`,
  );
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Client first payload is ${totalBytes} bytes gzip (budget: ${BUNDLE_BUDGET_BYTES} bytes).\n`,
  );
}
