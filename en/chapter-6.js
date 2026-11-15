(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const number = new Intl.NumberFormat("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const money = (value, currency = "CNY") => `${number.format(value)} ${currency}`;
  const text = (id, value) => { byId(id).textContent = value; };

  const calendarCells = Array.from({ length: 24 }, () => {
    const cell = document.createElement("span");
    byId("calendar-band").append(cell);
    return cell;
  });

  function clearWork() {
    TaxPixel.clear("labor");
    ["domesticIncome", "foreignIncome", "foreignPct", "calendar-summary", "workFormula"].forEach((id) => text(id, "—"));
    byId("work-source-labels").replaceChildren();
    byId("domesticBar").style.width = "0%";
    byId("foreignBar").style.width = "0%";
    calendarCells.forEach((cell) => { cell.className = ""; });
    byId("calendar-band").setAttribute("aria-label", "Enter valid compensation");
  }

  function updateWork() {
    const salaryInput = byId("salary");
    const invalid = salaryInput.value.trim() === "" || !salaryInput.validity.valid;
    salaryInput.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      clearWork();
      return "Enter compensation of at least 0 in steps of CNY 1,000.";
    }
    const total = Number(byId("totalDays").value);
    byId("domesticDays").max = total;
    if (Number(byId("domesticDays").value) > total) byId("domesticDays").value = total;
    const domestic = Number(byId("domesticDays").value);
    const foreign = total - domestic;
    const salary = Number(salaryInput.value);
    const domesticShare = domestic / total;
    const foreignShare = foreign / total;
    const domesticIncome = salary * domesticShare;
    const foreignIncome = salary - domesticIncome;
    TaxPixel.update("labor", { total, domestic, foreign, salary, domesticIncome, foreignIncome });

    text("totalDaysOut", `${total} days`);
    text("domesticDaysOut", `${domestic} days`);
    text("domesticIncome", money(domesticIncome));
    text("foreignIncome", money(foreignIncome));
    text("foreignPct", `${(foreignShare * 100).toFixed(1)}%`);
    text("calendar-summary", `${domestic} days home · ${foreign} days foreign`);
    text("workFormula", `Home source = ${money(salary)} × ${domestic} ÷ ${total} = ${money(domesticIncome)}; foreign source = ${money(foreignIncome)}`);
    byId("domesticBar").style.width = `${domesticShare * 100}%`;
    byId("foreignBar").style.width = `${foreignShare * 100}%`;
    byId("work-source-bar").setAttribute("aria-label", `Home source ${money(domesticIncome)}, ${(domesticShare * 100).toFixed(1)}%; foreign source ${money(foreignIncome)}, ${(foreignShare * 100).toFixed(1)}%`);
    byId("calendar-band").setAttribute("aria-label", `Of ${total} service days: ${domestic} at home and ${foreign} abroad`);
    const domesticCells = Math.round(domesticShare * calendarCells.length);
    calendarCells.forEach((cell, index) => { cell.className = index < domesticCells ? "domestic" : "foreign"; });

    const labels = [
      `Home ${domestic} days · ${money(domesticIncome)}`,
      `Foreign ${foreign} days · ${money(foreignIncome)}`,
    ];
    byId("work-source-labels").replaceChildren(...labels.map((value) => {
      const label = document.createElement("span");
      label.textContent = value;
      return label;
    }));
    return "";
  }

  function update() {
    const error = updateWork();
    text("form-error", error);
    byId("form-error").hidden = !error;
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
})();
