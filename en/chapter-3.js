(() => {
  const form = document.querySelector("#scenario");
  const byId = (id) => document.getElementById(id);
  const fieldIds = ["foreignIncome", "homeRate", "sourceRate"];
  const money = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "CNY",
    maximumFractionDigits: 0,
  }).format;
  const percent = (value) => `${value.toFixed(1)}%`;
  const text = (id, value) => {
    byId(id).textContent = value;
  };

  const labels = [
    ["No relief", "Both countries tax in full"],
    ["Deduction", "Foreign tax reduces the tax base"],
    ["Ordinary credit", "Credit capped at the limit"],
    ["Full exemption", "No residence tax on this income"],
  ];

  function clearResults() {
    TaxPixel.clear("relief");
    ["sourceTax", "creditLimit", "actualCredit", "excessCredit"].forEach((id) =>
      text(id, "—"),
    );
    byId("method-bars").replaceChildren();
    byId("methodBody").replaceChildren();
    text("credit-formula", "Actual credit = min(source tax, credit limit)");
  }

  function update() {
    const fields = fieldIds.map(byId);
    fields.forEach((field) => {
      field.setAttribute(
        "aria-invalid",
        String(field.value.trim() === "" || !field.validity.valid),
      );
    });
    let error = "";
    if (fields.some((field) => field.value.trim() === "")) {
      error = "Complete all three inputs.";
    } else if (fields.some((field) => !field.validity.valid)) {
      error = "Check the amount and rates. Tax rates must be whole numbers from 0 to 60.";
    }
    const errorNode = byId("form-error");
    errorNode.hidden = !error;
    errorNode.textContent = error;
    if (error) {
      clearResults();
      return;
    }

    const [income, homeRate, sourceRate] = fields.map((field) => Number(field.value));
    const home = homeRate / 100;
    const source = sourceRate / 100;
    const sourceTax = income * source;
    const residenceBaseTax = income * home;
    const limit = residenceBaseTax;
    const credit = Math.min(sourceTax, limit);
    const excess = Math.max(0, sourceTax - limit);
    const methods = [
      { source: sourceTax, home: residenceBaseTax },
      { source: sourceTax, home: Math.max(0, (income - sourceTax) * home) },
      { source: sourceTax, home: Math.max(0, residenceBaseTax - credit) },
      { source: sourceTax, home: 0 },
    ].map((method, index) => {
      const total = method.source + method.home;
      return {
        ...method,
        name: labels[index][0],
        note: labels[index][1],
        total,
        after: income - total,
        effective: income === 0 ? 0 : (total / income) * 100,
      };
    });

    text("sourceTax", money(sourceTax));
    text("creditLimit", money(limit));
    text("actualCredit", money(credit));
    text("excessCredit", money(excess));
    text(
      "credit-formula",
      `Actual credit = min(${money(sourceTax)}, ${money(limit)}) = ${money(credit)}; excess = ${money(excess)}`,
    );

    const scale = Math.max(1, ...methods.map((method) => method.total));
    byId("method-bars").innerHTML = methods
      .map((method) => {
        const sourceWidth = (method.source / scale) * 100;
        const homeWidth = (method.home / scale) * 100;
        return `<div class="sim-bar-row">
          <span class="sim-bar-label">${method.name}<small>${method.note}</small></span>
          <div class="sim-track" role="img" aria-label="${method.name}: source tax ${money(method.source)}, residence tax ${money(method.home)}">
            <span class="source-segment" style="width:${sourceWidth}%"></span>
            <span class="home-segment" style="width:${homeWidth}%"></span>
          </div>
          <strong>${money(method.total)}<small>Effective rate ${percent(method.effective)}</small></strong>
        </div>`;
      })
      .join("");
    byId("methodBody").innerHTML = methods
      .map(
        (method) => `<tr>
          <td>${method.name}</td>
          <td>${money(method.source)}</td>
          <td>${money(method.home)}</td>
          <td>${money(method.total)}</td>
          <td class="${method.after < 0 ? "negative" : ""}">${money(method.after)}</td>
          <td>${percent(method.effective)}</td>
        </tr>`,
      )
      .join("");

    TaxPixel.update("relief", { income, homeRate, sourceRate, methods });
  }

  form.addEventListener("input", update);
  byId("neutrality-method").addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(() => {
    byId("neutrality-method").value = "2";
    update();
  }, 0));
  update();
})();
