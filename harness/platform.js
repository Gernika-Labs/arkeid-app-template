import { MockPlatform, UNIT } from "./mock-platform.js";
import { setupPlaygroundTools } from "./tools.js";

setupPlaygroundTools();

const byId = (id) => document.getElementById(id);
const manifest = await (await fetch("/arcade.manifest.json")).json();
const config = await (await fetch("/dev-config.json")).json();
const platform = new MockPlatform({
  priceUnits: manifest.proposedPriceUnits,
  inputMaxCharacters: manifest.inputMaxCharacters,
});
const frame = byId("app");
let channel = crypto.randomUUID().replaceAll("-", "");
let latestResult = "";
const tokens = (units) =>
  (units / UNIT).toLocaleString("en-US", { maximumFractionDigits: 2 });
function update() {
  byId("wallet-button").textContent =
    `${tokens(platform.balance)} tokens · Wallet`;
  byId("balance").textContent = `${tokens(platform.balance)} demo tokens`;
  byId("ledger").replaceChildren();
  for (const entry of platform.ledger) {
    const item = document.createElement("li");
    item.textContent = `${entry.type}: ${tokens(entry.units)} tokens`;
    byId("ledger").append(item);
  }
  byId("download").disabled = !latestResult;
}
function respond(request) {
  if (!request || request.status === "pending") return;
  frame.contentWindow.postMessage(
    {
      type: "arkeid:response",
      channel,
      id: request.id,
      ok: request.status === "delivered",
      text: request.text,
      error: request.error,
    },
    "*",
  );
  if (request.status === "delivered") latestResult = request.text;
  byId("status").textContent =
    request.status === "delivered"
      ? "Mock result delivered. Download it from your wallet."
      : request.error;
  update();
}
function cancel() {
  if (platform.pending) respond(platform.cancel(platform.pending));
  byId("confirmation").close();
}
window.addEventListener("message", (event) => {
  if (
    event.source !== frame.contentWindow ||
    event.origin !== "null" ||
    !event.data ||
    typeof event.data !== "object"
  )
    return;
  const data = event.data;
  if (data.type === "arkeid:ready") {
    frame.contentWindow.postMessage({ type: "arkeid:init", channel }, "*");
    return;
  }
  if (data.channel !== channel || data.type !== "arkeid:request") return;
  try {
    if (
      Object.keys(data).some(
        (k) => !["type", "channel", "id", "capability", "source"].includes(k),
      ) ||
      data.capability !== "ai.generate" ||
      !manifest.capabilities.includes(data.capability)
    )
      throw new Error("Unsupported capability or request field.");
    const request = platform.request({ id: data.id, source: data.source });
    if (request.status !== "pending") {
      respond(request);
      return;
    }
    byId("app-name").textContent = manifest.title;
    byId("price").textContent = `${tokens(request.priceUnits)} demo tokens`;
    byId("source-preview").textContent = request.source;
    byId("confirm").textContent =
      `Confirm · ${tokens(request.priceUnits)} tokens`;
    if (!byId("confirmation").open) byId("confirmation").showModal();
  } catch (error) {
    frame.contentWindow.postMessage(
      {
        type: "arkeid:response",
        channel,
        id: data.id,
        ok: false,
        error: error.message,
      },
      "*",
    );
  }
});
frame.addEventListener("load", () => {
  // Reloading the app cancels unresolved local requests without a debit.
  if (platform.pending) {
    platform.cancel(platform.pending);
    byId("confirmation").close();
  }
});
byId("confirm").addEventListener("click", () => {
  if (!platform.pending) return;
  respond(platform.confirm(platform.pending, byId("scenario").value));
  byId("confirmation").close();
});
byId("cancel").addEventListener("click", cancel);
byId("confirmation").addEventListener("cancel", (event) => {
  event.preventDefault();
  cancel();
});
byId("wallet-button").addEventListener("click", () => {
  update();
  byId("wallet").showModal();
});
byId("wallet-close").addEventListener("click", () => byId("wallet").close());
byId("locked").addEventListener("change", () => {
  platform.locked = byId("locked").checked;
});
byId("download").addEventListener("click", () => {
  const url = URL.createObjectURL(
    new Blob([latestResult], { type: "text/plain" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "mock-result.txt";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
frame.src = config.appOrigin;
let revision = config.revision;
setInterval(async () => {
  try {
    const current = await (
      await fetch("/dev-config.json", { cache: "no-store" })
    ).json();
    if (current.revision && current.revision !== revision) {
      revision = current.revision;
      if (platform.pending) {
        platform.cancel(platform.pending);
        byId("confirmation").close();
      }
      frame.src = config.appOrigin;
    }
  } catch {
    /* Keep the current app visible while the dev server rebuilds. */
  }
}, 1000);
update();
