import { readdir } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const tests = (await readdir(new URL("../tests/", import.meta.url)))
  .filter((name) => name.endsWith(".test.cjs"))
  .sort()
  .map((name) => `tests/${name}`);
const result = spawnSync(process.execPath, ["--test", ...tests], { cwd: root, stdio: "inherit" });
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
