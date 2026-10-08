import { rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDirectory = resolve(projectRoot, "dist");

if (dirname(distDirectory) !== projectRoot) {
  throw new Error("Refusing to clean a directory outside the project root.");
}

await rm(distDirectory, { recursive: true, force: true });
