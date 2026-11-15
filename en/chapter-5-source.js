(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const sourceNames = { cn: "China", us: "United States", other: "Another country" };
  const typeNames = {
    service: "Services", interest: "Interest", dividend: "Dividends", rent: "Tangible property rent",
    royalty: "Royalties", real: "Real property disposal", equity: "Equity or movable property",
    purchased: "Purchased inventory", produced: "Produced inventory",
  };
  const ruleNames = { ce: "China enterprise income tax", ci: "China individual income tax", us: "US federal income tax" };
  const fieldIds = ["activityField", "payerField", "useField", "propertyField", "companyField", "sellerField", "saleField", "prodField", "mixField"];
  const fieldsByType = {
    service: ["activityField", "payerField"], interest: ["payerField"], dividend: ["companyField"],
    rent: ["useField"], royalty: ["payerField", "useField"], real: ["propertyField"],
    equity: ["companyField", "sellerField", "saleField"], purchased: ["saleField"],
    produced: ["saleField", "prodField"],
  };
  const text = (id, value) => { byId(id).textContent = value; };
  const percent = (value) => `${Number(value).toFixed(0)}%`;

  function showSourceFields() {
    fieldIds.forEach((id) => { byId(id).hidden = true; });
    (fieldsByType[byId("type").value] || []).forEach((id) => { byId(id).hidden = false; });
    byId("mixField").hidden = !(byId("type").value === "service" && byId("activity").value === "mixed");
    text("prodVal", percent(byId("prod").value));
    text("mixVal", percent(byId("mix").value));
  }

  function singleSource(location) {
    return { source: `${sourceNames[location]} source`, pathSource: `${sourceNames[location]} source`, segments: [{ location, share: 100 }] };
  }

  function updateSource() {
    showSourceFields();
    const rules = byId("rules").value;
    const type = byId("type").value;
    let connection = "";
    let fact = "";
    let rule = "";
    let checks = [];
    let outcome;

    if (type === "service") {
      const activity = byId("activity").value;
      connection = "Place of performance";
      if (activity === "mixed") {
        const cn = Number(byId("mix").value);
        outcome = { source: `China ${cn}% / US ${100 - cn}%`, pathSource: "China–US allocation", segments: [{ location: "cn", share: cn }, { location: "us", share: 100 - cn }] };
        fact = `Two-country services · China ${cn}%`;
        rule = "Allocate by actual services performed in each country; payer and bank account alone do not change source.";
        checks = ["Verify workdays, project records and travel", "For businesses, also review establishments and permanent establishments", "Salary, bonuses and equity awards may cover different service periods"];
      } else {
        outcome = singleSource(activity);
        fact = `Performance · ${sourceNames[activity]}`;
        rule = "Services are sourced where actually performed, not simply by who pays.";
        checks = ["Was any work performed in another country?", "Could a treaty short-term employment exception apply?", "Does a business serve through a local permanent establishment?"];
      }
    } else if (type === "interest") {
      const payer = byId("payer").value;
      connection = "Debtor or economic bearer";
      fact = `${sourceNames[payer]} payer / bearer`;
      outcome = singleSource(payer);
      rule = rules === "us" ? "The United States generally sources interest by the debtor’s residence." : "China generally uses the location of the economic bearer or payer, or an individual’s domicile.";
      checks = ["Check branch, deposit and portfolio-interest exceptions", "Identify who economically bears the interest", "Then review treaty limits and beneficial ownership"];
    } else if (type === "dividend") {
      const company = byId("company").value;
      connection = "Distributing company";
      fact = `Distributor · ${sourceNames[company]}`;
      outcome = singleSource(company);
      rule = rules === "us" ? "The United States generally sources dividends by the distributing corporation’s place of incorporation." : "China sources dividends by the distributing enterprise’s location.";
      checks = ["Identify the distributor, not the receiving account", "Check ownership and treaty rate limits", "For US rules, review a foreign corporation’s effectively connected income ratio"];
    } else if (type === "rent") {
      const use = byId("use").value;
      connection = "Where property is used";
      fact = `Use · ${sourceNames[use]}`;
      outcome = singleSource(use);
      rule = "Tangible property rent is generally sourced where the property is located or used.";
      checks = ["Allocate by use period if property crosses borders", "Ships, aircraft and containers may have special rules", "Review withholding, net-basis elections and treaties"];
    } else if (type === "royalty") {
      const location = rules === "ce" ? byId("payer").value : byId("use").value;
      connection = rules === "ce" ? "Economic bearer" : "Where rights are used";
      fact = rules === "ce" ? `${sourceNames[location]} payer / bearer` : `Use · ${sourceNames[location]}`;
      outcome = singleSource(location);
      rule = rules === "ce" ? "China enterprise income tax generally uses the payer, bearer or establishment’s location." : rules === "ci" ? "China individual income tax focuses on where the rights are used." : "The United States generally sources royalties where intangible property is used or licensed for use.";
      checks = ["Distinguish service output from continuing IP use", "Identify the entity or permanent establishment bearing payment", "Compare the applicable treaty royalty article"];
    } else if (type === "real") {
      const property = byId("property").value;
      connection = "Real property location";
      fact = `Property · ${sourceNames[property]}`;
      outcome = singleSource(property);
      rule = "Gains from real property are generally sourced where the property is located.";
      checks = ["Distinguish real property interests from real-property-rich shares", "Review indirect transfers and asset-value ratios", "Read the treaty capital gains article"];
    } else if (type === "equity") {
      const location = rules === "ce" ? byId("company").value : rules === "us" ? byId("seller").value : byId("sale").value;
      connection = rules === "ce" ? "Investee location" : rules === "us" ? "Transferor’s residence" : "Transfer location and special rules";
      fact = `${connection} · ${sourceNames[location]}`;
      outcome = singleSource(location);
      rule = rules === "ce" ? "Equity investment disposals are generally sourced by the investee enterprise’s location." : rules === "us" ? "Movable property gains generally follow the transferor’s residence, subject to several exceptions." : "China individual income tax considers transfer location and special offshore-equity rules.";
      checks = ["Does value mainly come from domestic real property?", "Is consideration tied to future use of intangibles?", "Is the transaction attributable to a fixed place of business?"];
    } else if (type === "purchased") {
      const sale = byId("sale").value;
      connection = "Sale or transaction location";
      fact = `Transaction · ${sourceNames[sale]}`;
      outcome = singleSource(sale);
      rule = rules === "us" ? "The United States generally sources purchased inventory by place of sale; a fixed place of business may change the result." : "China considers transaction location or property-transfer rules, not just invoices and payment location.";
      checks = ["Verify title passage, delivery and fixed places of business", "Distinguish purchased from produced inventory", "Review treaty business profits and permanent establishments"];
    } else {
      connection = rules === "us" ? "Production location" : "Transaction location";
      if (rules === "us") {
        const us = Number(byId("prod").value);
        outcome = { source: `US ${us}% / Foreign ${100 - us}%`, pathSource: "Allocated by production", segments: [{ location: "us", share: us }, { location: "other", share: 100 - us, label: "Foreign" }] };
        fact = `US production ${us}%`;
        rule = "Current US section 863 allocates produced inventory by production location.";
      } else {
        const sale = byId("sale").value;
        outcome = singleSource(sale);
        outcome.pathSource = `${sourceNames[sale]} source · facts review`;
        fact = `Transaction · ${sourceNames[sale]}`;
        rule = "China sources goods sales by transaction location, informed by production, contracting and delivery facts.";
      }
      checks = ["Record production assets, personnel and manufacturing locations", "An old 50/50 method is not current US law", "Review sales offices and permanent establishments"];
    }

    text("source-result", outcome.source);
    TaxPixel.update("source", { type, rules, typeName: typeNames[type], ruleName: ruleNames[rules], connection, fact, rule,
      locations: Object.fromEntries(["activity", "payer", "use", "property", "company", "seller", "sale"].map((id) => [id, byId(id).selectedOptions[0].textContent])),
      segments: outcome.segments.map((segment) => ({ name: segment.label || sourceNames[segment.location], location: segment.location, share: segment.share })) });
    text("source-connection", connection);
    text("path-type", typeNames[type]);
    text("path-fact", fact);
    text("path-source", outcome.pathSource);
    text("path-rule", ruleNames[rules]);
    text("rule-text", rule);
    const bar = byId("source-bar");
    const labels = byId("source-labels");
    bar.replaceChildren();
    labels.replaceChildren();
    outcome.segments.forEach((segment) => {
      if (segment.share <= 0) return;
      const name = segment.label || sourceNames[segment.location];
      const part = document.createElement("span");
      part.className = `source-${segment.location}`;
      part.style.width = `${segment.share}%`;
      part.title = `${name} ${segment.share}%`;
      bar.append(part);
      const label = document.createElement("span");
      const key = document.createElement("i");
      key.style.setProperty("--segment-color", segment.location === "cn" ? "var(--tool-green)" : segment.location === "us" ? "var(--tool-blue)" : "var(--tool-sand)");
      label.append(key, document.createTextNode(`${name} ${segment.share}%`));
      labels.append(label);
    });
    bar.setAttribute("aria-label", outcome.segments.map((segment) => `${segment.label || sourceNames[segment.location]} ${segment.share}%`).join("; "));
    byId("checks").replaceChildren(...checks.map((value) => {
      const item = document.createElement("li");
      item.textContent = value;
      return item;
    }));
  }

  form.addEventListener("input", updateSource);
  form.addEventListener("change", updateSource);
  form.addEventListener("reset", () => setTimeout(updateSource, 0));
  byId("jordan").addEventListener("click", () => {
    byId("rules").value = "us"; byId("type").value = "service"; byId("activity").value = "us"; byId("payer").value = "other"; updateSource();
  });
  byId("hangzhou").addEventListener("click", () => {
    byId("rules").value = "us"; byId("type").value = "service"; byId("activity").value = "cn"; byId("payer").value = "us"; updateSource();
  });
  updateSource();
})();
