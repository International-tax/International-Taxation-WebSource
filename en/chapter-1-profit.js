(() => {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const defaults = { "pre-profit": 40, fee: 20, "high-rate": 25, "low-rate": 0 };
  const inputIds = Object.keys(defaults);
  const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
  const percent = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
  const cacheKey = "chapter-1-profit-crossref-v1";
  let lastValid = { ...defaults };

  const amount = (value) => number.format(value);
  const rate = (value) => `${percent.format(value)}%`;

  function setError(id, message) {
    const input = $(id);
    input.setAttribute("aria-invalid", String(Boolean(message)));
    $(`${id}-error`).textContent = message;
  }

  function readInputs() {
    const values = {};
    const preValue = $("pre-profit").valueAsNumber;
    if (Number.isFinite(preValue) && preValue >= 0) {
      $("fee").max = String(Math.min(100000, preValue));
    }
    let valid = true;
    for (const id of inputIds) {
      const input = $(id);
      const value = input.valueAsNumber;
      let message = "";
      if (input.value.trim() === "" || !Number.isFinite(value)) {
        message = "Enter a number.";
      } else if (!input.validity.valid || value < 0 || value > Number(input.max)) {
        message = `Enter a value from 0 to ${number.format(Number(input.max))}.`;
      }
      setError(id, message);
      if (message) valid = false;
      values[id] = value;
    }
    if (Number.isFinite(values.fee) && Number.isFinite(values["pre-profit"]) && values.fee > values["pre-profit"]) {
      setError("fee", "The related-party fee cannot exceed Country A profit before the fee.");
      valid = false;
    }
    return valid ? values : null;
  }

  function render(values) {
    const pre = values["pre-profit"];
    const fee = values.fee;
    const highRate = values["high-rate"] / 100;
    const lowRate = values["low-rate"] / 100;
    const remaining = pre - fee;
    const highTax = remaining * highRate;
    const lowTax = fee * lowRate;
    const totalTax = highTax + lowTax;
    const etr = pre > 0 ? (totalTax / pre) * 100 : 0;
    const topUpRate = Math.max(0, 15 - values["low-rate"]);
    const topUpTax = fee * (topUpRate / 100);
    TaxPixel.update("profit", { pre, fee, remaining, highRate: values["high-rate"], lowRate: values["low-rate"], highTax, lowTax, etr, topUpTax });
    const highRemainingWidth = pre > 0 ? (remaining / pre) * 100 : 0;
    const feeWidth = pre > 0 ? (fee / pre) * 100 : 0;
    const gaugeWidth = Math.min(100, values["low-rate"] / 30 * 100);

    $("high-profit").textContent = amount(remaining);
    $("high-remaining-label").textContent = amount(remaining);
    $("high-tax").textContent = amount(highTax);
    $("low-profit").textContent = amount(fee);
    $("low-tax").textContent = amount(lowTax);
    $("fee-flow").textContent = amount(fee);
    $("high-remaining-bar").style.width = `${highRemainingWidth}%`;
    $("high-fee-bar").style.width = `${feeWidth}%`;
    $("low-profit-bar").style.width = `${feeWidth}%`;
    $("base-reduction").textContent = amount(fee);
    $("tax-loss").textContent = amount(fee * highRate);
    $("total-tax").textContent = amount(totalTax);
    $("group-etr").textContent = rate(etr);
    $("topup-rate").textContent = rate(topUpRate);
    $("topup-tax").textContent = amount(topUpTax);
    $("topup-formula").textContent = `${amount(fee)} × max(0, 15% − ${rate(values["low-rate"])}) = ${amount(topUpTax)}`;
    $("etr-fill").style.width = `${gaugeWidth}%`;
    $("etr-marker").style.left = `${gaugeWidth}%`;
    $("etr-gauge").setAttribute("aria-label", `Low-tax jurisdiction ETR: ${rate(values["low-rate"])}; top-up benchmark: 15%`);
    $("topup-status").textContent = fee === 0 ? "No low-tax profit" : topUpRate > 0 ? "Low-tax top-up due" : "Low-tax ETR reaches 15%";
    $("topup-status").classList.toggle("review", topUpTax > 0);
    $("sim-explain").textContent = topUpRate > 0
      ? `Simplified GloBE teaching model: the low-tax top-up rate is ${rate(topUpRate)}, not an additional 15%. In practice, first test whether the service is real and priced at arm’s length.`
      : "The low-tax ETR reaches 15%, so this simplified model produces no top-up. In practice, still test whether the service is real and priced at arm’s length.";
    lastValid = { ...values };
  }

  function update() {
    const values = readInputs();
    if (values) render(values);
    else {
      TaxPixel.clear("profit");
      ["high-profit", "high-remaining-label", "high-tax", "low-profit", "low-tax", "fee-flow", "base-reduction", "tax-loss", "total-tax", "group-etr", "topup-rate", "topup-tax", "topup-formula", "topup-status", "sim-explain"].forEach((id) => { $(id).textContent = "—"; });
      ["high-remaining-bar", "high-fee-bar", "low-profit-bar", "etr-fill"].forEach((id) => { $(id).style.width = "0%"; });
      $("etr-marker").style.left = "0%";
      $("etr-gauge").setAttribute("aria-label", "Waiting for valid inputs");
    }
  }

  inputIds.forEach((id) => $(id).addEventListener("input", update));
  $("parameter-controls").addEventListener("submit", (event) => event.preventDefault());
  $("reset").addEventListener("click", () => {
    inputIds.forEach((id) => {
      $(id).value = defaults[id];
      setError(id, "");
    });
    $("fee").max = "100000";
    render({ ...defaults });
  });

  function readCache() {
    try {
      const data = JSON.parse(localStorage.getItem(cacheKey));
      return data && Array.isArray(data.works) && typeof data.checked === "string" ? data : null;
    } catch {
      return null;
    }
  }

  function showPapers(data) {
    $("papers").replaceChildren();
    for (const work of data.works) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = `https://doi.org/${encodeURI(work.doi)}`;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = work.title;
      item.append(link, document.createElement("small"));
      item.querySelector("small").textContent = work.date;
      $("papers").append(item);
    }
  }

  async function fetchTerm(term, fromDate, today) {
    const params = new URLSearchParams({
      "query.title": term,
      filter: `type:journal-article,from-pub-date:${fromDate},until-pub-date:${today}`,
      rows: "25",
      sort: "published",
      order: "desc",
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`https://api.crossref.org/works?${params}`, { signal: controller.signal });
      if (!response.ok) throw new Error("Crossref request failed");
      const result = await response.json();
      return result.message.items;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function updatePapers() {
    const cached = readCache();
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const earlier = new Date(now);
    earlier.setFullYear(earlier.getFullYear() - 2);
    const fromDate = earlier.toISOString().slice(0, 10);
    $("refresh").disabled = true;
    $("refresh").setAttribute("aria-busy", "true");
    $("status").textContent = "Searching Crossref…";
    try {
      const batches = await Promise.all([
        fetchTerm("profit shifting", fromDate, today),
        fetchTerm("global minimum tax", fromDate, today),
      ]);
      const unique = new Map();
      for (const work of batches.flat()) {
        const title = work.title?.[0];
        const parts = work.published?.["date-parts"]?.[0];
        if (!title || !work.DOI || !parts || !/profit[- ]shifting|global minimum tax|pillar (?:two|2).*tax/i.test(title)) continue;
        const date = parts.map((part, index) => index ? String(part).padStart(2, "0") : String(part)).join("-");
        unique.set(work.DOI, { title, doi: work.DOI, date });
      }
      const works = [...unique.values()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
      const data = { works, checked: today };
      showPapers(data);
      try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
      $("status").textContent = `Search completed ${today}: ${works.length} articles shown.`;
    } catch {
      if (cached) {
        showPapers(cached);
        $("status").textContent = `Crossref is unavailable. Showing the local cache from ${cached.checked}.`;
      } else {
        $("status").textContent = "Crossref is unavailable; you may be offline. The studies and core calculations above still work.";
      }
    } finally {
      $("refresh").disabled = false;
      $("refresh").removeAttribute("aria-busy");
    }
  }

  $("refresh").addEventListener("click", updatePapers);
  const cached = readCache();
  if (cached) {
    showPapers(cached);
    $("status").textContent = `Local cache from ${cached.checked}; search again to refresh.`;
  }
  render(lastValid);
})();
