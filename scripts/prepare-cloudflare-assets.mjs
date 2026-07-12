import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const assetsIgnorePath = join(distDir, ".assetsignore");

await mkdir(distDir, { recursive: true });
await writeFile(assetsIgnorePath, "_worker.js\n", "utf8");

console.log(`Wrote ${assetsIgnorePath}`);
