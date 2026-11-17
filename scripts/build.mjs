import {
  writeFile,
  readdir,
  lstat,
  readFile,
  copyFile,
} from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { ROOT, checkProject } from "./project.mjs";
import { compileApp } from "./compile.mjs";
try {
  const result = await checkProject();
  if (!result.ok) throw new Error(result.errors.join("\n"));
  await compileApp();
  const out = join(ROOT, "dist");
  await copyFile(
    join(ROOT, "arcade.manifest.json"),
    join(out, "arcade.manifest.json"),
  );
  const hashes = {};
  async function walk(dir, prefix = "") {
    for (const name of await readdir(dir)) {
      const file = join(dir, name);
      const stat = await lstat(file);
      if (stat.isSymbolicLink())
        throw new Error("Build output cannot contain symlinks");
      if (stat.isDirectory()) await walk(file, prefix + name + "/");
      else
        hashes[prefix + name] = createHash("sha256")
          .update(await readFile(file))
          .digest("hex");
    }
  }
  await walk(out);
  await writeFile(
    join(out, "bundle.manifest.json"),
    JSON.stringify(
      {
        contract: result.manifest.contract,
        app: result.manifest.id,
        version: result.manifest.version,
        files: hashes,
        publishable: false,
        note: "Custom-app development artifact. Production hosting, review and server-backed SDK integration remain required.",
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    "Built React/TypeScript app in dist/. No deployment or publication was performed.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
