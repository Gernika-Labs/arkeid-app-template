import { lstat, readdir, readFile } from "node:fs/promises";
import { resolve, join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const ROOT = fileURLToPath(new URL("../", import.meta.url));
export const CONTRACT = "arkeid.custom-app.dev.v1";

export function validateManifest(m) {
  const errors = [];
  if (!m || typeof m !== "object" || Array.isArray(m))
    return ["Manifest must be an object"];
  const allowed = [
    "contract",
    "id",
    "version",
    "title",
    "description",
    "entry",
    "capabilities",
    "inputMaxCharacters",
    "callsPerPlay",
    "proposedPriceUnits",
    "network",
  ];
  for (const key of Object.keys(m))
    if (!allowed.includes(key))
      errors.push(`Unsupported manifest field: ${key}`);
  if (m.contract !== CONTRACT) errors.push(`contract must be ${CONTRACT}`);
  if (!/^[a-z0-9-]{3,60}$/.test(m.id ?? ""))
    errors.push("id must be 3–60 lowercase letters/digits/hyphens");
  if (!Number.isSafeInteger(m.version) || m.version < 1)
    errors.push("version must be a positive integer");
  if (typeof m.title !== "string" || m.title.length < 3 || m.title.length > 80)
    errors.push("title must be 3–80 characters");
  if (
    typeof m.description !== "string" ||
    m.description.length < 10 ||
    m.description.length > 400
  )
    errors.push("description must be 10–400 characters");
  if (m.entry !== "index.html") errors.push("entry must be index.html");
  if (
    !Array.isArray(m.capabilities) ||
    m.capabilities.length !== 1 ||
    m.capabilities[0] !== "ai.generate"
  )
    errors.push("only ai.generate is supported by this local bridge");
  if (
    !Number.isSafeInteger(m.inputMaxCharacters) ||
    m.inputMaxCharacters < 1 ||
    m.inputMaxCharacters > 3000
  )
    errors.push("inputMaxCharacters must be 1–3000");
  if (m.callsPerPlay !== 1)
    errors.push("the local bridge supports one call per confirmed play");
  if (
    !Number.isSafeInteger(m.proposedPriceUnits) ||
    m.proposedPriceUnits < 500000 ||
    m.proposedPriceUnits > 20000000
  )
    errors.push(
      "proposedPriceUnits must be 500000–20000000; this is a mock quote, not production approval",
    );
  if (m.network !== "platform-bridge-only")
    errors.push("network must be platform-bridge-only");
  return errors;
}

export async function projectFiles(root = ROOT) {
  const files = ["index.html", "arcade.manifest.json"];
  async function walk(relative) {
    const dir = join(root, relative);
    if ((await lstat(dir)).isSymbolicLink())
      throw new Error(`Symlinks are not supported: ${relative}`);
    for (const name of await readdir(dir)) {
      if (name.startsWith("."))
        throw new Error(`Hidden app files are not supported: ${name}`);
      const path = `${relative}/${name}`;
      const entry = await lstat(join(root, path));
      if (entry.isSymbolicLink())
        throw new Error(`Symlinks are not supported: ${path}`);
      if (entry.isDirectory()) await walk(path);
      else if (
        entry.isFile() &&
        [".js", ".ts", ".tsx", ".css"].includes(extname(name))
      )
        files.push(path);
      else throw new Error(`Unsupported app file: ${path}`);
      if (files.length > 150) throw new Error("Maximum 150 app files");
    }
  }
  await walk("src");
  await walk("sdk");
  let total = 0;
  for (const file of files) {
    const stat = await lstat(join(root, file));
    if (stat.isSymbolicLink() || !stat.isFile() || stat.size > 250000)
      throw new Error(`Invalid or oversized app file: ${file}`);
    total += stat.size;
  }
  if (total > 2000000) throw new Error("App exceeds 2 MB");
  return files;
}

export async function checkProject(root = ROOT) {
  const files = await projectFiles(root);
  const manifest = JSON.parse(
    await readFile(join(root, "arcade.manifest.json"), "utf8"),
  );
  const errors = validateManifest(manifest);
  for (const file of files) {
    const source = await readFile(join(root, file), "utf8");
    if (file.endsWith(".js")) {
      const parsed = spawnSync(
        process.execPath,
        ["--check", resolve(root, file)],
        { encoding: "utf8" },
      );
      if (parsed.status !== 0)
        errors.push(
          `JavaScript syntax error in ${file}: ${parsed.stderr?.trim() || "could not check syntax"}`,
        );
    }
    if (file.startsWith("src/") && /\.(js|ts|tsx)$/.test(file)) {
      if (
        /\b(fetch|XMLHttpRequest|WebSocket|EventSource|eval|Function)\s*\(|document\s*\.\s*cookie|\b(?:localStorage|sessionStorage)\b|\bparent\s*\.\s*postMessage/.test(
          source,
        )
      )
        errors.push(
          `${file}: use the SDK; direct network, credentials, storage and dynamic code are outside this starter contract`,
        );
    }
    if (/\bsk-[a-zA-Z0-9_-]{20,}\b/.test(source))
      errors.push(`${file}: possible provider secret; remove it`);
  }
  return {
    ok: errors.length === 0,
    errors,
    manifest,
    files,
    warnings: [
      "Local compatibility checks only. Pattern checks are not a complete JavaScript/security audit. This development contract is not accepted by the marketplace publisher yet.",
    ],
  };
}
