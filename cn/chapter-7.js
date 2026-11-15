(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const fields = ["gross", "domestic", "treaty", "residence"].map(byId);
  const number = new Intl.NumberFormat("zh-CN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
  const money = (value) => `¥${number.format(value)}`;
  const rate = (value) => `${number.format(value)}%`;
  const text = (id, value) => {
    byId(id).textContent = value;
  };
  const share = (amount, total) => (total === 0 ? 0 : (amount / total) * 100);
  const width = (id, value) => {
    byId(id).style.width = `${value}%`;
  };

  function clearResults() {
    TaxPixel.clear("withholding");
    [
      "sourceTax",
      "residenceTax",
      "credit",
      "topup",
      "afterTax",
      "domesticRate",
      "treatyRate",
      "effectiveRate",
      "flowGross",
      "flowSourceTax",
      "flowRate",
      "flowReceipt",
      "flowTopup",
      "flowCredit",
      "formula",
      "grossBarTotal",
      "residenceBarTotal",
    ].forEach((id) => text(id, "—"));
    [
      "grossSourceBar",
      "grossTopupBar",
      "grossAfterBar",
      "residenceCreditBar",
      "residenceTopupBar",
    ].forEach((id) => width(id, 0));
    byId("grossBar").setAttribute("aria-label", "请先填写有效的计算参数");
    byId("residenceBar").setAttribute("aria-label", "请先填写有效的计算参数");
    const status = byId("treaty-status");
    status.className = "sim-status neutral";
    status.textContent = "等待有效参数";
    text("summary-note", "修正输入后，将重新显示税额、资金流向和税负构成。");
  }

  function update() {
    let hasEmpty = false;
    let hasInvalid = false;
    fields.forEach((field) => {
      const empty = field.value.trim() === "";
      const invalid =
        empty || !field.validity.valid || !Number.isFinite(field.valueAsNumber);
      field.setAttribute("aria-invalid", String(invalid));
      hasEmpty ||= empty;
      hasInvalid ||= invalid;
    });

    let error = "";
    if (hasEmpty) error = "请填写税前所得和全部税率。";
    else if (hasInvalid)
      error = "所得不得小于 0；税率须在 0% 至 100% 之间，并按输入步长填写。";
    const errorNode = byId("form-error");
    errorNode.hidden = !error;
    errorNode.textContent = error;
    if (error) {
      clearResults();
      return;
    }

    const gross = byId("gross").valueAsNumber;
    const domestic = byId("domestic").valueAsNumber;
    const treaty = byId("treaty").valueAsNumber;
    const residence = byId("residence").valueAsNumber;
    const qualified = byId("qualify").value === "yes";
    const incomeType = document.querySelector(
      'input[name="incomeType"]:checked',
    ).value;
    const isInterest = incomeType === "interest";
    const effectiveRate = qualified ? Math.min(domestic, treaty) : domestic;
    const sourceTax = gross * effectiveRate / 100;
    const residenceTax = gross * residence / 100;
    const credit = Math.min(sourceTax, residenceTax);
    const topup = Math.max(0, residenceTax - credit);
    const receipt = gross - sourceTax;
    const afterTax = gross - sourceTax - topup;
    TaxPixel.update("withholding", { gross, qualified, isInterest, effectiveRate, sourceTax, residenceTax, credit, topup, receipt, afterTax });

    text("sourceTax", money(sourceTax));
    text("residenceTax", money(residenceTax));
    text("credit", money(credit));
    text("topup", money(topup));
    text("afterTax", money(afterTax));
    text("domesticRate", rate(domestic));
    text("treatyRate", qualified ? rate(treaty) : "不适用");
    text("effectiveRate", rate(effectiveRate));

    const status = byId("treaty-status");
    if (!qualified) {
      status.className = "sim-status review";
      status.textContent = "按国内税率扣税";
      text(
        "summary-note",
        `未适用协定待遇，按来源国国内税率 ${rate(domestic)} 预提；实际抵免仍以来源国税与居民国税的较小者为限。`,
      );
    } else if (treaty < domestic) {
      status.className = "sim-status";
      status.textContent = "协定上限降低扣税";
      text(
        "summary-note",
        `符合协定条件，实际预提率取国内税率 ${rate(domestic)} 与协定上限 ${rate(treaty)} 的较低值 ${rate(effectiveRate)}。`,
      );
    } else {
      status.className = "sim-status neutral";
      status.textContent = "国内税率不高于协定上限";
      text(
        "summary-note",
        `符合协定条件，但国内税率 ${rate(domestic)} 不高于协定上限 ${rate(treaty)}，因此按 ${rate(effectiveRate)} 预提。`,
      );
    }

    text("flowGross", money(gross));
    text("flowGrossNote", `来源国支付税前${isInterest ? "利息" : "股息"}`);
    text("flowSourceTax", money(sourceTax));
    text("flowRate", `实际预提率 ${rate(effectiveRate)}`);
    text("flowReceipt", money(receipt));
    text("flowTopup", money(topup));
    text(
      "flowCredit",
      `抵免前税额 ${money(residenceTax)}，已抵免 ${money(credit)}`,
    );
    text(
      "formula",
      `预提 = ${money(gross)} × ${rate(effectiveRate)} = ${money(sourceTax)}；抵免 = min(${money(sourceTax)}, ${money(residenceTax)}) = ${money(credit)}；补征 = ${money(residenceTax)} − ${money(credit)} = ${money(topup)}`,
    );

    width("grossSourceBar", share(sourceTax, gross));
    width("grossTopupBar", share(topup, gross));
    width("grossAfterBar", share(afterTax, gross));
    width("residenceCreditBar", share(credit, residenceTax));
    width("residenceTopupBar", share(topup, residenceTax));
    text("grossBarTotal", money(gross));
    text("residenceBarTotal", money(residenceTax));
    byId("grossBar").setAttribute(
      "aria-label",
      `税前所得 ${money(gross)}：来源国税 ${money(sourceTax)}，居民国补征 ${money(topup)}，税后所得 ${money(afterTax)}`,
    );
    byId("residenceBar").setAttribute(
      "aria-label",
      `居民国抵免前税额 ${money(residenceTax)}：实际抵免 ${money(credit)}，居民国补征 ${money(topup)}`,
    );

    text(
      "checkTitle",
      isInterest
        ? "利息：债务、来源与受益所有人"
        : "股息：分配、持股与受益所有人",
    );
    text(
      "checkText",
      isInterest
        ? "核实真实债务、利息定性和负担主体；另查受益所有人及来源国免税规定。"
        : "核实分配企业、股东身份和持股比例；另查受益所有人及协定持股期限。",
    );
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
})();
