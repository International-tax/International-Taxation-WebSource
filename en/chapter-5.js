(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const placeNames = { us: "United States", china: "Mainland China", singapore: "Singapore", other: "Another country or region" };
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
    byId("ownership-ruler").setAttribute("aria-label", "Enter a valid continuing ownership percentage");
  }

  function updateEnterprise() {
    const ownershipNumber = byId("ownershipNumber");
    const invalid = ownershipNumber.value.trim() === "" || !ownershipNumber.validity.valid;
    ownershipNumber.setAttribute("aria-invalid", String(invalid));
    if (invalid) {
      text("form-error", "Enter a whole-number ownership percentage from 0 to 100.");
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
    setMapNode("approval-node", rubber ? `Formal approval · ${placeNames[strategy]} decides` : "Substantive approval", rubber && strategy === "china");
    byId("approval-node").classList.toggle("formal-link", rubber);
    byId("management-map").setAttribute("aria-label", `Incorporated in ${placeNames[inc]}; strategy in ${placeNames[strategy]}; executives in ${placeNames[management]}; records in ${placeNames[records]}; ${rubber ? "board approval is mainly formal" : "board gives substantive approval"}.`);

    text("usMetric", usResident ? "US domestic corporation" : "Foreign corporation");
    text("chinaMetric", inc === "china" ? "China resident · formation" : managementClue ? "Effective management indicator" : "Insufficient China links");
    text("dualMetric", usResident && chinaResident ? "Dual-residence indicators" : "Not both indicated");
    text("residence-summary", `${usResident ? "US incorporation makes this a domestic corporation." : "Without US incorporation, management location alone does not make it a US domestic corporation."} ${inc === "china" ? "Formation in China directly meets its resident-enterprise test." : managementClue ? "Several China management links appear together; review effective management as a whole." : "Current facts do not sufficiently indicate effective management in China."}${usResident && chinaResident ? " Next, read the applicable treaty residence article." : ""}`);

    const own = Number(ownershipNumber.value);
    const acquire = byId("acquire").checked;
    const substantial = byId("substantial").checked;
    let status;
    let detail;
    if (!acquire) {
      status = "Outside this simplified path";
      detail = "No acquisition of substantially all former US entity property is shown; a foreign-parent structure alone does not establish a section 7874 result.";
    } else if (substantial) {
      status = "Substantial business exception · verify";
      detail = "The inputs indicate the substantial business exception; verify the regulatory tax residence, employee, asset and income conditions.";
    } else if (own >= 80) {
      status = "≥80% · Domestic corporation treatment";
      detail = "The new foreign parent may continue to be treated as a US domestic corporation, denying the expected residence change.";
    } else if (own >= 60) {
      status = "60%–<80% · Special limits";
      detail = "Foreign corporate status generally remains, but inversion gain and the use of tax attributes face special limits.";
    } else {
      status = "<60% · Below ownership threshold";
      detail = "These section 7874 ownership-threshold consequences do not apply; section 367, related-party and other anti-avoidance rules still require review.";
    }
    text("inversionMetric", status);
    text("ownership-status", percent(own));
    text("ownership-formula", `Continuing ownership = counted stock received by former US owners ÷ all counted stock = ${percent(own)}`);
    text("inversion-detail", detail);
    TaxPixel.update("enterprise", { inc: placeNames[inc], strategy: placeNames[strategy], management: placeNames[management], records: placeNames[records], rubber, own, acquire, substantial, usResident, chinaResident, managementClue, status, detail,
      usResult: byId("usMetric").textContent, cnResult: byId("chinaMetric").textContent });
    byId("ownership-pointer").style.left = `${own}%`;
    byId("ownership-ruler").setAttribute("aria-label", `Continuing ownership ${percent(own)}; ${status}. ${detail}`);
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
