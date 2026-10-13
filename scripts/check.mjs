/** Syntax, local asset references and source/output consistency. */
import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? filesIn(target) : target;
  }));
  return files.flat().sort();
}

for (const directory of ["src", "tests", "scripts"]) {
  for (const file of await filesIn(path.join(root, directory))) {
    if (!/\.(cjs|mjs|js)$/.test(file)) continue;
    const result = spawnSync(process.execPath, ["--check", file], { stdio: "inherit" });
    if (result.error) throw result.error;
    assert.equal(result.status, 0, `Syntax error: ${file}`);
  }
}

const source = path.join(root, "src");
const output = path.join(root, "dist");
const sources = await filesIn(source);
const outputs = await filesIn(output);
assert.deepEqual(outputs.map((file) => path.relative(output, file)), sources.map((file) => path.relative(source, file)),
  "dist file list is stale; run node scripts/build.mjs");

for (const file of sources) {
  const relative = path.relative(source, file);
  assert.ok((await readFile(file)).equals(await readFile(path.join(output, relative))),
    `dist/${relative} is stale; run node scripts/build.mjs`);
  if (!/\.(html|css)$/.test(file)) continue;
  const text = await readFile(file, "utf8");
  const references = file.endsWith(".html")
    ? [...text.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1])
    : [...text.matchAll(/url\(['"]?([^'"\)]+)['"]?\)/g)].map((match) => match[1]);
  for (const reference of references) {
    assert.ok(!/^(https?:|\/\/)/.test(reference), `Unexpected external dependency: ${reference}`);
    assert.ok((await stat(path.resolve(path.dirname(file), reference))).isFile(), `Missing asset: ${reference}`);
  }
}

console.log("PASS: JavaScript syntax, local assets and exact src/dist parity");
