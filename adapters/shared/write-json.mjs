import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export async function writeJson(targetPath, payload) {
  const resolved = path.resolve(targetPath);
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return resolved;
}
