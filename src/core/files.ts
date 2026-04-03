import { promises as fs } from "node:fs";
import path from "node:path";

const RULE_EXTENSIONS = new Set([".yml", ".yaml", ".json"]);

export async function readTextFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, "utf8");
}

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDirectory(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export async function collectRuleFiles(inputPath: string): Promise<string[]> {
  const resolved = path.resolve(inputPath);
  const stat = await fs.stat(resolved);

  if (stat.isFile()) {
    return RULE_EXTENSIONS.has(path.extname(resolved)) ? [resolved] : [];
  }

  if (!stat.isDirectory()) {
    return [];
  }

  const results: string[] = [];
  const queue = [resolved];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      continue;
    }

    const entries = await fs.readdir(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        queue.push(fullPath);
        continue;
      }

      if (entry.isFile() && RULE_EXTENSIONS.has(path.extname(entry.name))) {
        results.push(fullPath);
      }
    }
  }

  return results.sort();
}
