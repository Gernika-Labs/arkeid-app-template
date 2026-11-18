import { PLATFORM_ORIGIN } from "virtual:arkeid-config";
export type GenerateInput = { source: string };
export type GenerateResult = { text: string };
type Pending = {
  resolve: (result: GenerateResult) => void;
  reject: (error: Error) => void;
  timer: ReturnType<typeof setTimeout>;
};
let channel: string | undefined;
const pending = new Map<string, Pending>();
let readyResolve: () => void;
const ready = new Promise<void>((resolve) => {
  readyResolve = resolve;
});
window.addEventListener("message", (event: MessageEvent) => {
  if (
    event.source !== parent ||
    event.origin !== PLATFORM_ORIGIN ||
    !event.data ||
    typeof event.data !== "object"
  )
    return;
  const data = event.data as Record<string, unknown>;
  if (
    data.type === "arkeid:init" &&
    typeof data.channel === "string" &&
    /^[a-f0-9]{32}$/.test(data.channel) &&
    !channel
  ) {
    channel = data.channel;
    readyResolve();
    return;
  }
  if (
    data.type !== "arkeid:response" ||
    data.channel !== channel ||
    typeof data.id !== "string"
  )
    return;
  const request = pending.get(data.id);
  if (!request) return;
  pending.delete(data.id);
  clearTimeout(request.timer);
  if (data.ok === true && typeof data.text === "string")
    request.resolve({ text: data.text });
  else
    request.reject(
      new Error(typeof data.error === "string" ? data.error : "Request failed"),
    );
});
parent.postMessage({ type: "arkeid:ready" }, PLATFORM_ORIGIN);
async function awaitReady(): Promise<void> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      ready,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error("Open this app through the local ARKEID playground."),
            ),
          5000,
        );
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
/** Local onboarding helper; the parent copies its fixed prompt, never app-provided text. */
export async function copyDiscoveryPrompt(): Promise<void> {
  await awaitReady();
  const id = crypto.randomUUID();
  await new Promise<GenerateResult>((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Copy timed out"));
    }, 8000);
    pending.set(id, { resolve, reject, timer });
    parent.postMessage(
      { type: "arkeid:copy-starter-prompt", channel, id },
      PLATFORM_ORIGIN,
    );
  });
}

export const arcade = Object.freeze({
  ready: awaitReady,
  ai: Object.freeze({
    async generate({ source }: GenerateInput): Promise<GenerateResult> {
      if (typeof source !== "string" || !source.trim() || source.length > 3000)
        throw new Error("Provide 1–3,000 characters of source text.");
      await awaitReady();
      const id = crypto.randomUUID();
      return new Promise<GenerateResult>((resolve, reject) => {
        const timer = setTimeout(() => {
          pending.delete(id);
          reject(
            new Error(
              "The platform did not respond. No automatic retry was made.",
            ),
          );
        }, 120000);
        pending.set(id, { resolve, reject, timer });
        parent.postMessage(
          {
            type: "arkeid:request",
            channel,
            id,
            capability: "ai.generate",
            source,
          },
          PLATFORM_ORIGIN,
        );
      });
    },
  }),
});
