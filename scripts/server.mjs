import { readFile, lstat } from "node:fs/promises";
import { join, extname } from "node:path";
import { ROOT } from "./project.mjs";

export function contentPolicy(role, origins) {
  const common =
    "object-src 'none'; base-uri 'none'; form-action 'none'; font-src 'none'; img-src 'none';";
  return role === "app"
    ? `default-src 'none'; script-src ${origins.app}; style-src ${origins.app}; connect-src 'none'; frame-src 'none'; frame-ancestors ${origins.platform}; ${common}`
    : `default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-src ${origins.app}; frame-ancestors 'none'; ${common}`;
}
export async function localResponse(role, path, origins) {
  const headers = {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer",
    "Permissions-Policy":
      "camera=(), microphone=(), geolocation=(), payment=()",
    "Content-Security-Policy": contentPolicy(role, origins),
  };
  if (role === "app") headers["Access-Control-Allow-Origin"] = "*"; // Public local assets only, never credentials or APIs.
  if (role === "app" && path === "/sdk/config.js")
    return {
      status: 200,
      headers: { ...headers, "Content-Type": "text/javascript" },
      body: `export const PLATFORM_ORIGIN = ${JSON.stringify(origins.platform)};`,
    };
  if (role === "platform" && path === "/dev-config.json")
    return {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ appOrigin: origins.app }),
    };
  const file =
    role === "platform" && path === "/"
      ? "harness/index.html"
      : role === "app" && path === "/"
        ? "index.html"
        : path.slice(1);
  const allowed =
    role === "app"
      ? file === "index.html" ||
        /^(src|sdk)\/[a-zA-Z0-9_./-]+\.(js|css)$/.test(file)
      : file === "harness/index.html" ||
        /^harness\/[a-zA-Z0-9_-]+\.(js|css)$/.test(file) ||
        file === "arcade.manifest.json";
  if (
    !allowed ||
    file
      .split("/")
      .some(
        (part) =>
          !part || part === "." || part === ".." || part.startsWith("."),
      )
  )
    return { status: 404, headers, body: "Not found" };
  try {
    let current = ROOT;
    for (const part of file.split("/")) {
      current = join(current, part);
      if ((await lstat(current)).isSymbolicLink()) throw new Error("Symlink");
    }
    const body = await readFile(current);
    const type = {
      ".html": "text/html; charset=utf-8",
      ".js": "text/javascript; charset=utf-8",
      ".css": "text/css; charset=utf-8",
      ".json": "application/json",
    }[extname(file)];
    return { status: 200, headers: { ...headers, "Content-Type": type }, body };
  } catch {
    return { status: 404, headers, body: "Not found" };
  }
}
