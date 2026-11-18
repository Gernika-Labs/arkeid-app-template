# Arkeid app template

A clean React + TypeScript starter for building your own Arkeid app. It opens with **Welcome to Arkeid** and a short setup guide. There is no example product, sample dashboard or business logic to delete.

Included: Vite, strict TypeScript, Tailwind CSS v4, source-owned shadcn-style components, shared light/dark design tokens, the typed Arkeid SDK, platform manifest, AI instructions and a separate local mock platform.

## Start locally

Requires Node **22.12+**. Use this repository as a GitHub template or clone it:

```sh
git clone https://github.com/Gernika-Labs/arkeid-app-template.git
cd arkeid-app-template
npm ci
npm run dev
```

Open **http://127.0.0.1:4173**. Your app is compiled by Vite and shown on port 4174 inside a sandboxed frame. The parent playground owns the floating wallet and mock payment confirmation. Both servers bind only to loopback. Opening localhost redirects to the canonical address.

The playground uses the full viewport. A short local-mock notice appears on entry and fades after four seconds. Open the small tools icon for test controls. Drag that icon to snap the tools/wallet dock to any corner, or use **Tools position** in the panel; only that UI preference is stored in the parent playground’s local storage. The app cannot read it. Escape closes the tools panel, and motion preferences are respected.

Vite watches your source files and rebuilds on changes; the playground reloads the app after a successful build. This deliberately uses compiled assets rather than injecting Vite's development client into the sandbox. A reload resets app state; the mock wallet stays until the parent playground is refreshed. Ctrl+C stops both servers and the watcher.

If ports 4173/4174 are occupied:

```sh
ARKEID_DEV_PORT=4273 npm run dev
```

From the Arkeid monorepo, install this starter's dependencies with `npm --prefix starters/custom-app ci`, then run `pnpm creator:dev`.

## Not sure where to start?

Copy the [Help me shape my app prompt](START_HERE.md) into Claude Code or your preferred AI coding assistant with this project open. It asks one question at a time, helps define the smallest useful app, and asks you to confirm a project brief before building. The same prompt is available under **Make it yours** on the welcome page and in Arkeid’s creator dashboard. Copying is free and makes no AI call in Arkeid; your coding assistant’s usage terms apply.

## Build your app

| File                     | Start here                                                                  |
| ------------------------ | --------------------------------------------------------------------------- |
| `src/App.tsx`            | Replace the welcome page with your own interface                            |
| `src/styles/tokens.css`  | Global colors, light/dark semantics, typography and radius                  |
| `src/styles/globals.css` | Tailwind imports, theme mappings and base styles                            |
| `src/components/ui/`     | Reusable Button and Card components following shadcn's source-owned pattern |
| `src/lib/utils.ts`       | Shared `cn()` class composition helper                                      |
| `components.json`        | shadcn CLI configuration and `@/` aliases                                   |
| `sdk/arcade.ts`          | Typed platform bridge; no provider or wallet credentials                    |
| `arcade.manifest.json`   | App identity, capability and resource limits                                |
| `harness/`               | Local platform simulator; not part of your app design                       |

Add UI components as needed using the configured shadcn CLI:

```sh
npx shadcn@latest add input textarea dialog
```

Use semantic classes such as `bg-background`, `text-foreground`, `bg-primary` and `text-muted-foreground` so components share the global tokens. The `.dark` token set is included; add your own theme toggle if your app needs one. There is no external font request or opinionated product layout.

## Use platform features when you need them

The welcome page makes no AI calls and does not request a play. Add the SDK to your own action:

```ts
import { arcade } from "../sdk/arcade";

const result = await arcade.ai.generate({ source: "Your task input" });
// Render result.text using React text content.
```

The local SDK requests a play from the parent. Only the separate Arkeid confirmation authorizes the mock debit. Cancellation spends nothing; every additional play requires a new confirmation. **Test controls** in the parent simulate successful delivery, provider failure, moderation rejection, cost-cap failure and a locked wallet. The wallet shows its activity and can download a delivered result.

No API keys, real AI, payment account or Arkeid backend are connected. All tokens, results and failures are simulated. The SDK currently supports `ai.generate` with at most 3,000 source characters and one call per confirmed play. Arbitrary networking, provider keys, wallet access and backend execution are not capabilities of this starter.

## Validate and package

```sh
npm run check
npm test
npm run build
```

`check` runs TypeScript and contract checks. Tests build the app and cover mock consent/debits/refunds plus startup routes and isolation headers. `build` typechecks, bundles React/Tailwind with Vite and records SHA-256 hashes in `dist/bundle.manifest.json`. It does not deploy or publish. Browser verification is still required; pattern checks cannot certify arbitrary JavaScript security.

This is **arkeid.custom-app.dev.v1**, a local development contract. The current marketplace publisher accepts recipes, not custom-app bundles yet. Production hosting, review and a server-backed SDK adapter remain separate work. Never replace the mock ledger with real payment logic.

## Working with AI coding tools

AGENTS.md, CLAUDE.md and platform.constraints.json describe the platform boundary. Example instruction:

> Read the repository instructions. Build my app in React and TypeScript from the attached design. Reuse the shadcn components and global tokens. Keep wallet, payment and provider credentials out of the app. Use only declared SDK capabilities. Run check, test and build, and report unsupported requirements instead of bypassing restrictions. Do not deploy.

Screenshots, HTML exports, PDFs, Markdown and briefs can guide your coding agent. This starter does not itself interpret design files; in-app paid AI generation remains separate unfinished work.
