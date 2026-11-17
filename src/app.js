import { arcade } from "../sdk/arcade.js";

// Replace this example UI freely. Keep platform calls behind the SDK.
const examples = [
  {
    symbol: "NOVA",
    name: "Nova Example Co.",
    price: "$120.00",
    change: "+2.4%",
  },
  {
    symbol: "ORBT",
    name: "Orbit Example Labs",
    price: "$84.50",
    change: "−1.1%",
  },
  {
    symbol: "PINE",
    name: "Pine Example Works",
    price: "$62.00",
    change: "+0.8%",
  },
];
let selected = examples[0].symbol;
let period = "1M";
const byId = (id) => document.getElementById(id);
byId("source").value =
  "Fictional example: Nova Example Co. reported revenue of USD 120 million for 2025, compared with USD 100 million for 2024. Supply interruptions could adversely affect operations.";
function draw() {
  const company = examples.find((x) => x.symbol === selected);
  for (const key of ["symbol", "company", "price", "change"])
    byId(key).textContent = key === "company" ? company.name : company[key];
  byId("watchlist").replaceChildren();
  for (const item of examples.filter((x) =>
    `${x.symbol} ${x.name}`
      .toLowerCase()
      .includes(byId("search").value.toLowerCase()),
  )) {
    const button = document.createElement("button");
    button.className = `watch-item${item.symbol === selected ? " active" : ""}`;
    button.setAttribute("aria-pressed", String(item.symbol === selected));
    for (const [tag, value] of [
      ["strong", item.symbol],
      ["small", item.name],
      ["span", `${item.price} · ${item.change}`],
    ]) {
      const text = document.createElement(tag);
      text.textContent = value;
      button.append(text);
    }
    button.addEventListener("click", () => {
      selected = item.symbol;
      draw();
    });
    byId("watchlist").append(button);
  }
  byId("bars").replaceChildren();
  for (let i = 0; i < 24; i++) {
    const bar = document.createElement("div");
    bar.className = "bar";
    bar.style.setProperty(
      "--height",
      String(30 + ((i * 13 + selected.length * 7 + period.charCodeAt(1)) % 65)),
    );
    byId("bars").append(bar);
  }
}
function tab(notes) {
  byId("notes-panel").hidden = !notes;
  byId("explain-panel").hidden = notes;
  byId("notes-tab").setAttribute("aria-selected", String(notes));
  byId("explain-tab").setAttribute("aria-selected", String(!notes));
}
byId("search").addEventListener("input", draw);
byId("reset-watchlist").addEventListener("click", () => {
  selected = examples[0].symbol;
  byId("search").value = "";
  draw();
});
byId("notes-tab").addEventListener("click", () => tab(true));
byId("explain-tab").addEventListener("click", () => tab(false));
byId("research-tab").addEventListener("click", () => {
  tab(false);
  byId("source").focus();
});
byId("workspace-tab").addEventListener("click", () => {
  tab(false);
  window.scrollTo(0, 0);
});
document.querySelectorAll("[data-period]").forEach((button) =>
  button.addEventListener("click", () => {
    period = button.dataset.period;
    document
      .querySelectorAll("[data-period]")
      .forEach((x) => x.setAttribute("aria-pressed", String(x === button)));
    draw();
  }),
);
byId("explain").addEventListener("click", async () => {
  byId("error").textContent = "";
  byId("explain").disabled = true;
  try {
    const result = await arcade.ai.generate({ source: byId("source").value });
    byId("result").textContent = result.text;
  } catch (error) {
    byId("error").textContent = error.message;
  } finally {
    byId("explain").disabled = false;
  }
});
arcade
  .ready()
  .then(() => {
    byId("connection").textContent = "Local platform connected · Mock AI only";
  })
  .catch((error) => {
    byId("connection").textContent = error.message;
  });
draw();
