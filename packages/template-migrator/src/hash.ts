import { createHash } from "crypto";
import { readFileSync, existsSync } from "fs";

export function hashContent(content: string): string {
  return createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function hashFile(filePath: string): string | null {
  if (!existsSync(filePath)) return null;
  return hashContent(readFileSync(filePath, "utf8"));
}
