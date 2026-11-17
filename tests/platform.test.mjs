import test from "node:test";
import assert from "node:assert/strict";
import { MockPlatform } from "../harness/mock-platform.js";
import { validateManifest, checkProject } from "../scripts/project.mjs";
import { localResponse, contentPolicy } from "../scripts/server.mjs";
import { readFile } from "node:fs/promises";

const request = () => ({
  id: crypto.randomUUID(),
  source: "Example source passage.",
});

test("requesting and cancelling a play never spends tokens", () => {
  const p = new MockPlatform();
  const r = p.request(request());
  assert.equal(p.balance, 10000000);
  assert.equal(p.ledger.length, 0);
  assert.equal(p.cancel(r.id).status, "cancelled");
  assert.equal(p.balance, 10000000);
  assert.equal(p.confirm(r.id).status, "cancelled");
  assert.equal(p.ledger.length, 0);
});
test("each confirmed play charges once and requires a separate confirmation for another play", () => {
  const p = new MockPlatform();
  const r = p.request(request());
  assert.equal(p.confirm(r.id).status, "delivered");
  assert.equal(p.confirm(r.id).status, "delivered");
  assert.equal(p.balance, 8500000);
  assert.equal(p.ledger.length, 1);
  p.request(request());
  assert.equal(p.balance, 8500000);
});
for (const scenario of ["provider-error", "cost-cap", "moderation"])
  test(`${scenario} refunds the last play exactly once`, () => {
    const p = new MockPlatform();
    const r = p.request(request());
    assert.equal(p.confirm(r.id, scenario).status, "refunded");
    p.confirm(r.id, scenario);
    assert.equal(p.balance, 10000000);
    assert.deepEqual(
      p.ledger.map((x) => x.units),
      [-1500000, 1500000],
    );
  });
test("locked or insufficient wallets cannot spend and concurrent requests cannot skip confirmation", () => {
  const p = new MockPlatform();
  p.locked = true;
  const r = p.request(request());
  assert.throws(() => p.request(request()), /awaiting confirmation/);
  assert.equal(p.confirm(r.id).status, "blocked");
  assert.equal(p.ledger.length, 0);
  p.locked = false;
  p.balance = 1;
  assert.equal(p.confirm(p.request(request()).id).status, "blocked");
  assert.equal(p.balance, 1);
});
test("source limits and unsupported price/capability fields are rejected", () => {
  const p = new MockPlatform();
  assert.throws(() => p.request({ ...request(), source: "" }));
  assert.throws(() => p.request({ ...request(), source: "x".repeat(3001) }));
  assert.throws(() => p.request({ ...request(), priceUnits: 1 }));
  assert.throws(() => p.request({ ...request(), capability: "wallet.debit" }));
});

test("a duplicate request ID cannot replace the source after confirmation", () => {
  const p = new MockPlatform();
  const message = request();
  p.request(message);
  p.confirm(message.id);
  assert.throws(
    () => p.request({ ...message, source: "Different source" }),
    /different input/,
  );
  assert.equal(p.balance, 8500000);
  assert.equal(p.ledger.length, 1);
});
test("starter checks pass without running the app; incompatible manifest changes fail", async () => {
  const checked = await checkProject();
  assert.equal(checked.ok, true, checked.errors.join("\n"));
  assert.ok(checked.files.includes("src/App.tsx"));
  assert.ok(checked.files.includes("src/components/ui/button.tsx"));
  assert.ok(
    validateManifest({ ...checked.manifest, capabilities: ["wallet.debit"] })
      .length,
  );
  assert.ok(
    validateManifest({ ...checked.manifest, providerKey: "forbidden" }).length,
  );
  assert.ok(
    validateManifest({ ...checked.manifest, callsPerPlay: 100 }).length,
  );
});

test("the starter is a neutral typed React foundation with shared UI and tokens", async () => {
  const app = await readFile(
    new URL("../src/App.tsx", import.meta.url),
    "utf8",
  );
  assert.match(app, /Welcome to Arkeid/);
  assert.doesNotMatch(
    app,
    /watchlist|NOVA|ORBT|PINE|filing|Research workspace/i,
  );
  assert.match(app, /components\/ui\/button/);
  const css = await readFile(
    new URL("../src/styles/globals.css", import.meta.url),
    "utf8",
  );
  assert.match(css, /@import "tailwindcss"/);
  assert.match(css, /tokens.css/);
  const tokens = await readFile(
    new URL("../src/styles/tokens.css", import.meta.url),
    "utf8",
  );
  assert.match(tokens, /--primary:/);
  assert.match(tokens, /\.dark/);
  const ts = JSON.parse(
    await readFile(new URL("../tsconfig.json", import.meta.url), "utf8"),
  );
  assert.equal(ts.compilerOptions.strict, true);
  assert.equal(ts.compilerOptions.jsx, "react-jsx");
});
test("the local app cannot serve harness files, secrets or traversal paths", async () => {
  const origins = {
    app: "http://127.0.0.1:4174",
    platform: "http://127.0.0.1:4173",
  };
  for (const path of [
    "/harness/platform.js",
    "/.env",
    "/src/../harness/platform.js",
    "/scripts/dev.mjs",
    "/arcade.manifest.json",
  ])
    assert.equal((await localResponse("app", path, origins)).status, 404);
  const index = await localResponse("app", "/", origins);
  assert.equal(index.status, 200);
  assert.match(contentPolicy("app", origins), /connect-src 'none'/);
  assert.match(
    contentPolicy("app", origins),
    /frame-ancestors http:\/\/127.0.0.1:4173/,
  );
  const config = await localResponse("app", "/sdk/config.js", origins);
  assert.match(config.body, /4173/);
});

test("the playground root and every startup dependency are served successfully", async () => {
  const origins = {
    app: "http://127.0.0.1:4174",
    platform: "http://127.0.0.1:4173",
  };
  const root = await localResponse("platform", "/", origins);
  assert.equal(root.status, 200);
  assert.match(root.headers["Content-Type"], /text\/html/);
  assert.match(String(root.body), /id="app"/);
  for (const path of [
    "/harness/style.css",
    "/harness/platform.js",
    "/harness/mock-platform.js",
    "/arcade.manifest.json",
    "/dev-config.json",
  ])
    assert.equal(
      (await localResponse("platform", path, origins)).status,
      200,
      path,
    );
  const appIndex = await localResponse("app", "/", origins);
  assert.equal(appIndex.status, 200);
  assert.match(String(appIndex.body), /Welcome to Arkeid/);
  const assets = [
    ...String(appIndex.body).matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g),
  ].map((match) => match[1]);
  assert.ok(assets.length >= 2, "built script and stylesheet must be linked");
  for (const path of [...assets, "/sdk/config.js"])
    assert.equal((await localResponse("app", path, origins)).status, 200, path);
});
test("sandbox and confirmation controls live in the platform harness, separate from app markup", async () => {
  const harness = await readFile(
    new URL("../harness/index.html", import.meta.url),
    "utf8",
  );
  assert.match(harness, /sandbox="allow-scripts"/);
  assert.doesNotMatch(harness, /allow-same-origin/);
  assert.match(harness, /id="confirmation"/);
  const app = await readFile(new URL("../index.html", import.meta.url), "utf8");
  assert.doesNotMatch(app, /id="confirmation"|id="wallet-button"/);
});
