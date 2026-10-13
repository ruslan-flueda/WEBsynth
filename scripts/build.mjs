/** Copy the readable static app into dist; no dependencies or bundler required. */
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const source = new URL("../src/", import.meta.url);
const output = new URL("../dist/", import.meta.url);

// Confirm the source exists before replacing generated output.
await readdir(source);
await mkdir(output, { recursive: true });
for (const name of await readdir(output)) {
  await rm(new URL(name, output), { recursive: true, force: true });
}
await cp(source, output, { recursive: true });
console.log(`Built ${fileURLToPath(output)}`);
