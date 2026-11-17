# Arkeid app starter instructions

Read README.md, arcade.manifest.json and platform.constraints.json first. This is a neutral React + TypeScript + Tailwind + shadcn starter, not a finance app or a restricted recipe-theme package.

- Build the requested app in src/App.tsx and reusable components. Do not introduce an unrelated example product. Keep the initial welcome page minimal until an app is requested.
- Use strict TypeScript, the @/ alias, source-owned shadcn components and semantic global tokens in src/styles/tokens.css. Add needed UI dependencies/components within the authorized task; do not weaken platform boundaries.
- Call supported platform capabilities through sdk/arcade.ts. Never put provider secrets, direct network calls, wallet credentials or debit/credit logic in creator UI.
- A request is not payment consent. The parent owns wallet and confirmation. No automatic continuation or spending. No gambling or valuable randomized rewards.
- Preserve CSP, iframe sandbox and message source/origin/channel checks. Report unsupported capabilities rather than disabling restrictions or pretending mocked features are live.
- The local platform is a simulator: no real providers, payments or production money logic. Never connect the in-memory mock ledger to actual money.
- Run npm run check, npm test and npm run build. Report blocked checks accurately. Compatibility is not approval or security certification.
- Do not call paid services, publish, deploy or expose secrets without authorization.
