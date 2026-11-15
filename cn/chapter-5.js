(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const placeNames = { us: "美国", china: "中国内地", singapore: "新加坡", other: "其他国家或地区" };
  const text = (id, value) => { byId(id).textContent = value; };
  const percent = (value) => `${Number(value).toFixed(0)}%`;

  function setMapNode(id, value, isChina) {
    const node = byId(id);
    node.querySelector("strong").textContent = value;
    node.classList.toggle("china-link", isChina);
  }

  function clearEnterprise() {
    TaxPixel.clear("enterprise");
    ["usMetric", "chinaMetric", "dualMetric", "inversionMetric", "ownership-status", "residence-summary", "ownership-formula", "inversion-detail"].forEach((id) => text(id, "—"));
    byId("ownership-ruler").setAttribute("aria-label", "请先填写有效的延续所有权比例");
  }

  function updateEnterprise() {
    const ownershipNumber = byId("ownershipNumber");
    const invalid = ownershipNumber.value.trim() === "" || !ownershipNumber.validity.valid;
    ownershipNumber.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      text("form-error", "请输入 0 至 100 的整数所有权比例。");
      byId("form-error").hidden = false;
      clearEnterprise();
      return;
    }
    byId("form-error").hidden = true;

    const inc = byId("incorp").value;
    const strategy = byId("strategy").value;
    const management = byId("management").value;
    const records = byId("records").value;
    const rubber = byId("rubber").checked;
    const usResident = inc === "us";
    const managementClue = (strategy === "china" && management === "china") || (strategy === "china" && records === "china" && rubber);
    const chinaResident = inc === "china" || managementClue;

    setMapNode("incorp-node", placeNames[inc], inc === "china");
    setMapNode("strategy-node", placeNames[strategy], strategy === "china");
    setMapNode("management-node", placeNames[management], management === "china");
    setMapNode("records-node", placeNames[records], records === "china");
    setMapNode("approval-node", rubber ? `形式批准 · ${placeNames[strategy]}决策` : "实质审批", rubber && strategy === "china");
    byId("approval-node").classList.toggle("formal-link", rubber);
    byId("management-map").setAttribute("aria-label", `注册地${placeNames[inc]}；战略决策${placeNames[strategy]}；高管履职${placeNames[management]}；账簿档案${placeNames[records]}；${rubber ? "董事会主要为形式批准" : "董事会实质审批"}。`);

    text("usMetric", usResident ? "美国国内公司" : "外国公司");
    text("chinaMetric", inc === "china" ? "中国居民企业 · 成立地" : managementClue ? "实际管理机构线索" : "中国联结尚不充分");
    text("dualMetric", usResident && chinaResident ? "出现双重居民线索" : "未同时出现");
    text("residence-summary", `${usResident ? "美国依成立地视为国内公司。" : "非美国成立，管理地点本身不使其成为美国国内公司。"}${inc === "china" ? "中国依境内成立直接认定居民企业。" : managementClue ? "多项中国管理联结同时出现，需全面核实实际管理机构。" : "现有事实尚不足以指向中国实际管理机构。"}${usResident && chinaResident ? " 下一步查看适用协定的居民条款。" : ""}`);

    const own = Number(ownershipNumber.value);
    const acquire = byId("acquire").checked;
    const substantial = byId("substantial").checked;
    let status;
    let detail;
    if (!acquire) {
      status = "不进入本简化路径";
      detail = "未显示外国母公司取得原美国实体绝大部分财产，不能仅凭外国母公司结构得出 7874 结论。";
    } else if (substantial) {
      status = "实质经营例外 · 待核实";
      detail = "当前输入指向实质经营例外；仍须按税收居民、员工、资产和收入等法规条件核实。";
    } else if (own >= 80) {
      status = "≥80% · 国内公司后果";
      detail = "新外国母公司可能继续按美国国内公司处理，预期的居民身份改变被否定。";
    } else if (own >= 60) {
      status = "60%–<80% · 特别限制";
      detail = "外国公司身份通常保留，但倒置收益和税收属性使用受到特别限制。";
    } else {
      status = "<60% · 低于所有权门槛";
      detail = "不进入上述 7874 所有权门槛后果；仍需检查第 367 条、关联交易和其他反避税规则。";
    }
    text("inversionMetric", status);
    text("ownership-status", percent(own));
    text("ownership-formula", `延续所有权 = 原美国所有者取得的计入股份 ÷ 全部计入股份 = ${percent(own)}`);
    text("inversion-detail", detail);
    TaxPixel.update("enterprise", { inc: placeNames[inc], strategy: placeNames[strategy], management: placeNames[management], records: placeNames[records], rubber, own, acquire, substantial, usResident, chinaResident, managementClue, status, detail,
      usResult: byId("usMetric").textContent, cnResult: byId("chinaMetric").textContent });
    byId("ownership-pointer").style.left = `${own}%`;
    byId("ownership-ruler").setAttribute("aria-label", `延续所有权 ${percent(own)}；${status}。${detail}`);
  }

  form.addEventListener("input", (event) => {
    if (event.target === byId("ownership")) byId("ownershipNumber").value = event.target.value;
    if (event.target === byId("ownershipNumber") && event.target.validity.valid) byId("ownership").value = event.target.value;
    updateEnterprise();
  });
  form.addEventListener("change", updateEnterprise);
  form.addEventListener("reset", () => setTimeout(updateEnterprise, 0));
  updateEnterprise();
})();
