import { build } from "vite";
import { lstat } from "node:fs/promises";
import { join } from "node:path";
import { ROOT } from "./project.mjs";

export async function compileApp(watch = false) {
  const out = await lstat(join(ROOT, "dist")).catch(() => null);
  if (out && (out.isSymbolicLink() || !out.isDirectory()))
    throw new Error("dist must be a real directory");
  return build({
    root: ROOT,
    configFile: join(ROOT, "vite.config.ts"),
    build: { outDir: join(ROOT, "dist"), watch: watch ? {} : null },
  });
}
