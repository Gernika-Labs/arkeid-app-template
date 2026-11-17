import { createServer } from "node:http";
import { localResponse } from "./server.mjs";
import { checkProject } from "./project.mjs";
import { compileApp } from "./compile.mjs";

const port = Number(process.env.ARKEID_DEV_PORT ?? 4173);
if (!Number.isInteger(port) || port < 1024 || port > 65534)
  throw new Error(
    "ARKEID_DEV_PORT must be 1024–65534; the app uses the next port.",
  );
const origins = {
  platform: `http://127.0.0.1:${port}`,
  app: `http://127.0.0.1:${port + 1}`,
};
const checked = await checkProject();
if (!checked.ok) {
  console.error(checked.errors.join("\n"));
  process.exit(1);
}
const watcher = await compileApp(true);
await new Promise((resolve, reject) =>
  watcher.on("event", (event) => {
    if (event.code === "END") resolve();
    if (event.code === "ERROR") reject(event.error);
  }),
);
const servers = ["platform", "app"].map((role) =>
  createServer(async (req, res) => {
    const expected = new URL(origins[role]);
    if (req.headers.host !== expected.host) {
      if (req.headers.host === `localhost:${expected.port}`) {
        const location = new URL(req.url, origins[role]);
        res.writeHead(302, {
          Location: `${origins[role]}${location.pathname}${location.search}`,
          "Cache-Control": "no-store",
        });
      } else res.writeHead(421);
      res.end();
      return;
    }
    if (req.method !== "GET" && req.method !== "HEAD") {
      res.writeHead(405, { Allow: "GET, HEAD" });
      res.end();
      return;
    }
    try {
      const result = await localResponse(
        role,
        new URL(req.url, origins[role]).pathname,
        origins,
      );
      res.writeHead(result.status, result.headers);
      res.end(req.method === "HEAD" ? undefined : result.body);
    } catch {
      res.writeHead(500);
      res.end("Local server error");
    }
  }),
);
try {
  for (const [i, server] of servers.entries())
    await new Promise((resolve, reject) => {
      server.once("error", reject);
      server.listen(port + i, "127.0.0.1", resolve);
    });
} catch (error) {
  for (const server of servers) server.close();
  await watcher.close();
  console.error(
    `Could not start local playground: ${error.message}.${error.code === "EADDRINUSE" ? " Choose another ARKEID_DEV_PORT; the app also needs the next port." : " The environment must permit local loopback servers."}`,
  );
  process.exit(1);
}
console.log(
  `ARKEID creator playground: ${origins.platform}\nCustom app origin: ${origins.app}\nReact + TypeScript + Tailwind + shadcn · LOCAL MOCK ONLY\nEdit src/App.tsx or src/styles/tokens.css. Vite rebuilds and the playground reloads your app.\nNo API keys, real AI, payments or publication. Ctrl+C stops both servers.`,
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => {
    for (const server of servers) server.close();
    void watcher.close();
  });
