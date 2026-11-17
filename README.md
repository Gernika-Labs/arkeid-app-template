# Runnable ARKEID custom-app starter

Build and test your own interface locally, including dashboards, navigation, charts and interactions. This is a standalone, zero-dependency JavaScript project using native browser modules and Node's built-in tools. You do not need the ARKEID monorepo, an API key or a payment account to run a copy.

## Run it

Requires Node 22.12 or newer. From this directory:

```sh
npm run dev
```

Open **http://127.0.0.1:4173**. No installation is needed because this starter has no dependencies. The app itself is served on port 4174 in a sandboxed frame; always open the playground at 4173 to use the SDK. Both servers bind only to loopback.

From the ARKEID monorepo root, `pnpm creator:dev` starts the same playground. If either port is occupied, choose another adjacent pair:

```sh
ARKEID_DEV_PORT=4273 npm run dev
```

Edit `src/app.js`, `src/app.css` and `index.html`, then refresh the browser. Files are served directly; there is no bundler or hot-module reload. Refreshing the playground resets the in-memory demo wallet and all app data. Ctrl+C stops both servers. You can later introduce your preferred frontend tooling, but changing the build system will require adapting the checker and eventual hosting contract; it is not supported automatically by this starter.

## What to try

1. Search/select fictional companies in the watchlist, change chart periods and switch between explanation and notes tabs.
2. Click **Explain excerpt**. The app calls `arcade.ai.generate({ source })` through the SDK.
3. The separate ARKEID harness shows the task and exact mock token price. Cancel or press Escape: nothing is spent.
4. Confirm: the mock wallet debits once and the app receives an explicitly labeled sample result. Open the floating wallet to inspect activity or download the result.
5. Request another explanation: it requires another explicit confirmation.
6. Open **Test controls** and simulate provider failure, moderation rejection or cost-cap failure. Each confirmed failed play refunds once. Try a locked wallet and insufficient balance (spend the initial 10 demo tokens).

No models, market feeds, Stripe accounts, real tokens or ARKEID servers are connected. Sample companies, prices and charts are fictional. This is not a port of Kuantu or an investment tool.

## Files you customize

| File                   | Purpose                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ |
| `index.html`           | Your complete app structure, navigation and panels                                                           |
| `src/app.js`           | Your interface behavior; call the SDK for platform capabilities                                              |
| `src/app.css`          | Your design, responsive layout, colors and typography                                                        |
| `arcade.manifest.json` | Identity, development contract, allowed capability, input/call limits and proposed mock price                |
| `sdk/arcade.js`        | Typed-by-convention local message bridge; no wallet or provider credentials                                  |
| `harness/`             | Platform simulation, wallet, confirmation and failure scenarios; not creator UI or production infrastructure |

Unlike the simpler recipe-theme starter, this starter allows your own frontend JavaScript. The current capability is `ai.generate`; arbitrary network access, provider keys, payment authorization, server execution and persistent storage are outside this initial local contract. Use system fonts and CSS/DOM visuals; external fonts/images and packages are not enabled in the default harness.

## Check, test and package

```sh
npm run check
npm run check -- --json
npm test
npm run build
```

The checker validates the manifest, file bounds, symlinks and JS syntax, and flags obvious forbidden API usage or possible provider keys. Pattern checks are incomplete and are not a security certification. It does not execute creator app code while checking. Tests cover the mock consent/debit/refund flow, isolation headers and static serving restrictions; browser verification remains necessary.

Build copies the permitted source files to `dist/` and records SHA-256 hashes in `dist/bundle.manifest.json`. It never deploys, registers or publishes an app. **This is `arkeid.custom-app.dev.v1`, a local development contract. The current marketplace publisher accepts recipe manifests, not this custom-app bundle yet.** Production hosting, review and a server-backed SDK adapter must be implemented and verified before publication. Do not upload this bundle as a recipe or replace mock balances with real money logic.

## Working with Claude Code or another agent

Open this directory in your coding tool. AGENTS.md, CLAUDE.md and platform.constraints.json explain the boundaries. Example:

> Keep ARKEID's SDK and consent boundary. Adapt the app in src/ and index.html to the attached design, preserving its layout and interactions. Explain which parts are mock data and which need unsupported platform capabilities. Run check, test and build. Do not add provider keys, direct network calls or payment logic, and do not deploy.

Design exports, screenshots, PDFs and Markdown can serve as implementation references for that coding agent. This starter does not itself import or interpret those formats, and the in-app paid AI design builder is separate unfinished work.
