import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const LIMIT_BYTES = 64 * 1024 * 1024;
const root = ".open-next";

if (!existsSync(root)) {
  console.error("Missing .open-next. Run npm run cf-build first.");
  process.exit(1);
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const next = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "cache") continue;
      walk(next, files);
    } else {
      files.push(next);
    }
  }
  return files;
}

const files = walk(root);
const parts = files.map((path) => {
  const buffer = readFileSync(path);
  return {
    path,
    uncompressedBytes: buffer.length,
    gzipBytes: gzipSync(buffer).length,
  };
});

const workerJs = parts.find((part) => part.path === join(root, "worker.js"));
const uncompressedBytes = parts.reduce((sum, part) => sum + part.uncompressedBytes, 0);
const gzipBytes = parts.reduce((sum, part) => sum + part.gzipBytes, 0);
const workerUncompressed = workerJs?.uncompressedBytes ?? uncompressedBytes;
const workerGzip = workerJs?.gzipBytes ?? gzipBytes;

const report = {
  limitBytes: LIMIT_BYTES,
  workerJs: workerJs
    ? { uncompressedBytes: workerJs.uncompressedBytes, gzipBytes: workerJs.gzipBytes }
    : null,
  openNextExcludingAssets: { uncompressedBytes, gzipBytes },
  underLimit: workerUncompressed < LIMIT_BYTES && uncompressedBytes < LIMIT_BYTES,
};

console.log(JSON.stringify(report, null, 2));
console.log(
  `Worker script: ${(workerUncompressed / (1024 * 1024)).toFixed(2)} MiB uncompressed, ${(workerGzip / (1024 * 1024)).toFixed(2)} MiB gzip`,
);
console.log(
  `OpenNext (excl. assets): ${(uncompressedBytes / (1024 * 1024)).toFixed(2)} MiB uncompressed, ${(gzipBytes / (1024 * 1024)).toFixed(2)} MiB gzip`,
);

if (!report.underLimit) {
  console.error(`Worker exceeds the ${LIMIT_BYTES} byte uncompressed Workers limit.`);
  process.exit(1);
}
