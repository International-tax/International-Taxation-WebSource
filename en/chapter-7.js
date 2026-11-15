(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const fields = ["gross", "domestic", "treaty", "residence"].map(byId);
  const number = new Intl.NumberFormat("en", {
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
    byId("grossBar").setAttribute("aria-label", "Enter valid calculation inputs first");
    byId("residenceBar").setAttribute("aria-label", "Enter valid calculation inputs first");
    const status = byId("treaty-status");
    status.className = "sim-status neutral";
    status.textContent = "Waiting for valid inputs";
    text("summary-note", "Correct the inputs to restore the tax amounts, payment flow and tax charts.");
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
    if (hasEmpty) error = "Enter gross income and all three tax rates.";
    else if (hasInvalid)
      error = "Income cannot be negative. Rates must be between 0% and 100% and use the permitted increments.";
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
    text("treatyRate", qualified ? rate(treaty) : "Not applied");
    text("effectiveRate", rate(effectiveRate));

    const status = byId("treaty-status");
    if (!qualified) {
      status.className = "sim-status review";
      status.textContent = "Domestic rate applies";
      text(
        "summary-note",
        `Treaty relief is not applied, so the source domestic rate of ${rate(domestic)} applies. The credit remains limited to the lower of source tax and residence tax.`,
      );
    } else if (treaty < domestic) {
      status.className = "sim-status";
      status.textContent = "Treaty cap reduces withholding";
      text(
        "summary-note",
        `Treaty conditions are met, so the lower of the ${rate(domestic)} domestic rate and the ${rate(treaty)} treaty cap applies: ${rate(effectiveRate)}.`,
      );
    } else {
      status.className = "sim-status neutral";
      status.textContent = "Domestic rate is within the cap";
      text(
        "summary-note",
        `Treaty conditions are met, but the ${rate(domestic)} domestic rate does not exceed the ${rate(treaty)} treaty cap, so ${rate(effectiveRate)} applies.`,
      );
    }

    text("flowGross", money(gross));
    text("flowGrossNote", `Source country pays gross ${isInterest ? "interest" : "dividends"}`);
    text("flowSourceTax", money(sourceTax));
    text("flowRate", `Effective withholding rate: ${rate(effectiveRate)}`);
    text("flowReceipt", money(receipt));
    text("flowTopup", money(topup));
    text(
      "flowCredit",
      `Tax before credit: ${money(residenceTax)}; credit used: ${money(credit)}`,
    );
    text(
      "formula",
      `Withholding = ${money(gross)} × ${rate(effectiveRate)} = ${money(sourceTax)}; credit = min(${money(sourceTax)}, ${money(residenceTax)}) = ${money(credit)}; top-up = ${money(residenceTax)} − ${money(credit)} = ${money(topup)}`,
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
      `Gross income ${money(gross)}: source tax ${money(sourceTax)}, residence top-up ${money(topup)}, after-tax income ${money(afterTax)}`,
    );
    byId("residenceBar").setAttribute(
      "aria-label",
      `Residence tax before credit ${money(residenceTax)}: actual credit ${money(credit)}, residence top-up ${money(topup)}`,
    );

    text(
      "checkTitle",
      isInterest
        ? "Interest: debt, source and beneficial ownership"
        : "Dividends: distribution, shareholding and beneficial ownership",
    );
    text(
      "checkText",
      isInterest
        ? "Confirm genuine debt, interest character and who bears the cost; also check beneficial ownership and source-country exemptions."
        : "Confirm the distributing company, shareholder status and ownership percentage; also check beneficial ownership and treaty holding periods.",
    );
  }

  form.addEventListener("submit", (event) => event.preventDefault());
  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
})();
