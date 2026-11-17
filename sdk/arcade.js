import { PLATFORM_ORIGIN } from "./config.js";

let channel;
const pending = new Map();
let readyResolve;
const ready = new Promise((resolve) => {
  readyResolve = resolve;
});
window.addEventListener("message", (event) => {
  if (
    event.source !== parent ||
    event.origin !== PLATFORM_ORIGIN ||
    !event.data ||
    typeof event.data !== "object"
  )
    return;
  if (
    event.data.type === "arkeid:init" &&
    typeof event.data.channel === "string" &&
    /^[a-f0-9]{32}$/.test(event.data.channel) &&
    !channel
  ) {
    channel = event.data.channel;
    readyResolve();
    return;
  }
  if (event.data.type !== "arkeid:response" || event.data.channel !== channel)
    return;
  const request = pending.get(event.data.id);
  if (!request) return;
  pending.delete(event.data.id);
  clearTimeout(request.timer);
  if (event.data.ok && typeof event.data.text === "string")
    request.resolve({ text: event.data.text });
  else
    request.reject(
      new Error(
        typeof event.data.error === "string"
          ? event.data.error
          : "Request failed",
      ),
    );
});
parent.postMessage({ type: "arkeid:ready" }, PLATFORM_ORIGIN);

export const arcade = Object.freeze({
  async ready() {
    let timer;
    try {
      await Promise.race([
        ready,
        new Promise((_, reject) => {
          timer = setTimeout(
            () =>
              reject(
                new Error("Open this app through the local ARKEID harness."),
              ),
            5000,
          );
        }),
      ]);
    } finally {
      clearTimeout(timer);
    }
  },
  ai: Object.freeze({
    async generate({ source }) {
      if (typeof source !== "string" || !source.trim() || source.length > 3000)
        throw new Error("Provide 1–3,000 characters of source text.");
      await arcade.ready();
      const id = crypto.randomUUID();
      return new Promise((resolve, reject) => {
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
