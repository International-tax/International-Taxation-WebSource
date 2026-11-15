(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const number = new Intl.NumberFormat("zh-CN", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  const money = (value, currency = "元") => `${number.format(value)} ${currency}`;
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
    byId("calendar-band").setAttribute("aria-label", "请输入有效报酬");
  }

  function updateWork() {
    const salaryInput = byId("salary");
    const invalid = salaryInput.value.trim() === "" || !salaryInput.validity.valid;
    salaryInput.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      clearWork();
      return "请输入不低于 0 的报酬总额，并按 1,000 元的步长填写。";
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

    text("totalDaysOut", `${total} 天`);
    text("domesticDaysOut", `${domestic} 天`);
    text("domesticIncome", money(domesticIncome));
    text("foreignIncome", money(foreignIncome));
    text("foreignPct", `${(foreignShare * 100).toFixed(1)}%`);
    text("calendar-summary", `${domestic} 天本国 · ${foreign} 天境外`);
    text("workFormula", `本国来源 = ${money(salary)} × ${domestic} ÷ ${total} = ${money(domesticIncome)}；境外来源 = ${money(foreignIncome)}`);
    byId("domesticBar").style.width = `${domesticShare * 100}%`;
    byId("foreignBar").style.width = `${foreignShare * 100}%`;
    byId("work-source-bar").setAttribute("aria-label", `本国来源 ${money(domesticIncome)}，${(domesticShare * 100).toFixed(1)}%；境外来源 ${money(foreignIncome)}，${(foreignShare * 100).toFixed(1)}%`);
    byId("calendar-band").setAttribute("aria-label", `全部 ${total} 个服务日：本国 ${domestic} 天，境外 ${foreign} 天`);
    const domesticCells = Math.round(domesticShare * calendarCells.length);
    calendarCells.forEach((cell, index) => { cell.className = index < domesticCells ? "domestic" : "foreign"; });

    const labels = [
      `本国 ${domestic} 天 · ${money(domesticIncome)}`,
      `境外 ${foreign} 天 · ${money(foreignIncome)}`,
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
