export const UNIT = 1_000_000;

/** Local test simulator only. Production authorization and money live on ARKEID's server. */
export class MockPlatform {
  constructor({ priceUnits = 1_500_000, inputMaxCharacters = 3000 } = {}) {
    if (
      !Number.isSafeInteger(priceUnits) ||
      priceUnits <= 0 ||
      !Number.isSafeInteger(inputMaxCharacters) ||
      inputMaxCharacters < 1 ||
      inputMaxCharacters > 3000
    )
      throw new Error("Invalid platform limits");
    this.priceUnits = priceUnits;
    this.inputMaxCharacters = inputMaxCharacters;
    this.balance = 10 * UNIT;
    this.ledger = [];
    this.requests = new Map();
    this.pending = null;
    this.locked = false;
  }
  request(message) {
    const keys = Object.keys(message);
    if (
      keys.some((k) => !["id", "source"].includes(k)) ||
      typeof message.id !== "string" ||
      !/^[0-9a-f-]{36}$/.test(message.id) ||
      typeof message.source !== "string" ||
      !message.source.trim() ||
      message.source.length > this.inputMaxCharacters
    )
      throw new Error("Unsupported request or invalid source.");
    if (this.requests.has(message.id)) {
      const previous = this.requests.get(message.id);
      if (previous.source !== message.source)
        throw new Error("Request ID reused with different input");
      return previous;
    }
    if (this.pending) throw new Error("Another play is awaiting confirmation.");
    const request = {
      id: message.id,
      source: message.source,
      status: "pending",
      priceUnits: this.priceUnits,
    };
    this.requests.set(request.id, request);
    this.pending = request.id;
    return request;
  }
  cancel(id) {
    const request = this.requests.get(id);
    if (!request || request.status !== "pending") return request;
    request.status = "cancelled";
    request.error = "Play cancelled. No tokens spent.";
    this.pending = null;
    return request;
  }
  confirm(id, scenario = "success") {
    const request = this.requests.get(id);
    if (!request) throw new Error("Unknown request");
    if (request.status !== "pending") return request;
    if (
      !["success", "provider-error", "cost-cap", "moderation"].includes(
        scenario,
      )
    )
      throw new Error("Unknown test scenario");
    if (this.locked || this.balance < request.priceUnits) {
      request.status = "blocked";
      request.error = this.locked
        ? "Wallet locked. No tokens spent."
        : "Not enough demo tokens. No tokens spent.";
      this.pending = null;
      return request;
    }
    this.balance -= request.priceUnits;
    this.ledger.push({
      type: "play_debit",
      requestId: id,
      units: -request.priceUnits,
    });
    if (scenario !== "success") {
      this.balance += request.priceUnits;
      this.ledger.push({
        type: "refund",
        requestId: id,
        units: request.priceUnits,
      });
      request.status = "refunded";
      request.error = `Simulated ${scenario}. Your demo tokens were returned.`;
    } else {
      request.status = "delivered";
      request.text = `LOCAL MOCK RESULT — no model was called.\n\nThe app submitted this source:\n“${request.source.slice(0, 240)}”\n\nReplace the sample interface and task with your own. This text tests delivery only; it is not a financial explanation or advice.`;
    }
    this.pending = null;
    return request;
  }
}
