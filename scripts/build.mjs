import { mkdir, copyFile, writeFile, lstat } from "node:fs/promises";
import { join, dirname } from "node:path";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { ROOT, checkProject } from "./project.mjs";

async function directory(path) {
  const old = await lstat(path).catch(() => null);
  if (old && (!old.isDirectory() || old.isSymbolicLink()))
    throw new Error(`Unsafe output directory: ${path}`);
  await mkdir(path, { recursive: true });
}
try {
  const result = await checkProject();
  if (!result.ok) throw new Error(result.errors.join("\n"));
  const out = join(ROOT, "dist");
  await directory(out);
  const hashes = {};
  for (const file of result.files) {
    const parts = dirname(file)
      .split("/")
      .filter((p) => p !== ".");
    let targetDir = out;
    for (const part of parts) {
      targetDir = join(targetDir, part);
      await directory(targetDir);
    }
    const target = join(out, file);
    if ((await lstat(target).catch(() => null))?.isSymbolicLink())
      throw new Error(`Unsafe output file: ${file}`);
    await copyFile(join(ROOT, file), target);
    hashes[file] = createHash("sha256")
      .update(await readFile(target))
      .digest("hex");
  }
  const bundlePath = join(out, "bundle.manifest.json");
  if ((await lstat(bundlePath).catch(() => null))?.isSymbolicLink())
    throw new Error("Unsafe bundle manifest path");
  await writeFile(
    bundlePath,
    JSON.stringify(
      {
        contract: result.manifest.contract,
        app: result.manifest.id,
        version: result.manifest.version,
        files: hashes,
        publishable: false,
        note: "Local custom-app prototype. Production hosting, review and server-backed SDK integration remain required.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Built local custom-app artifact in dist/. File hashes are recorded; no deployment or publication was performed.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
