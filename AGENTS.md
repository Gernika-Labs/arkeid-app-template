# ARKEID custom-app development instructions

Read README.md and platform.constraints.json first. This is the runnable custom frontend starter, not the restricted recipe-theme starter.

- Customize index.html, src/app.js and src/app.css freely within the declared platform contract. Preserve accessible labels, keyboard operation, mobile layouts and honest sample-data labels.
- Use the SDK for supported platform capabilities. Do not add provider keys, direct network calls, arbitrary server execution, storage APIs, wallet credentials or payment/debit code to creator UI.
- A request for a play is not authorization. ARKEID owns the external confirmation and wallet; the app may not imitate or bypass them. Every new play requires separate confirmation. No gambling or valuable randomized rewards.
- Do not weaken the sandbox, CSP, bridge message validation or checks to make an unsupported feature appear to work. Report missing platform capabilities and keep them disabled or clearly mocked.
- The local harness is a simulator, not production infrastructure. Do not connect its in-memory ledger or mocked AI to real payments or provider services.
- Run npm run check, npm test and npm run build. If tooling cannot execute, report exactly what remains unverified. Never claim that passing local checks guarantees approval or security.
- Do not install packages, call paid services, publish or deploy unless the user separately authorizes those actions. No API key is required to develop/test this starter.
