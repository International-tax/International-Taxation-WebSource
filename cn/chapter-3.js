(() => {
  const form = document.querySelector("#scenario");
  const byId = (id) => document.getElementById(id);
  const fieldIds = ["foreignIncome", "homeRate", "sourceRate"];
  const moneyFormat = new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 0,
  });
  const money = (value) => `¥${moneyFormat.format(value)}`;
  const percent = (value) => `${value.toFixed(1)}%`;
  const text = (id, value) => {
    byId(id).textContent = value;
  };

  const labels = [
    ["不予减除", "两国独立征税"],
    ["扣除法", "外国税从税基扣除"],
    ["普通抵免", "限额内抵减居民国税"],
    ["全额免税", "居民国不征该笔所得"],
  ];

  function clearResults() {
    TaxPixel.clear("relief");
    ["sourceTax", "creditLimit", "actualCredit", "excessCredit"].forEach((id) =>
      text(id, "—"),
    );
    byId("method-bars").replaceChildren();
    byId("methodBody").replaceChildren();
    text("credit-formula", "实际抵免 = min（来源国税，抵免限额）");
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
      error = "请填写全部三个参数。";
    } else if (fields.some((field) => !field.validity.valid)) {
      error = "请检查金额与税率范围；税率须为 0–60 的整数。";
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
      `实际抵免 = min（${money(sourceTax)}，${money(limit)}）= ${money(credit)}；超限额 = ${money(excess)}`,
    );

    const scale = Math.max(1, ...methods.map((method) => method.total));
    byId("method-bars").innerHTML = methods
      .map((method) => {
        const sourceWidth = (method.source / scale) * 100;
        const homeWidth = (method.home / scale) * 100;
        return `<div class="sim-bar-row">
          <span class="sim-bar-label">${method.name}<small>${method.note}</small></span>
          <div class="sim-track" role="img" aria-label="${method.name}：来源国税 ${money(method.source)}，居民国税 ${money(method.home)}">
            <span class="source-segment" style="width:${sourceWidth}%"></span>
            <span class="home-segment" style="width:${homeWidth}%"></span>
          </div>
          <strong>${money(method.total)}<small>有效税率 ${percent(method.effective)}</small></strong>
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
