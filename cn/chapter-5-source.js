(() => {
  const byId = (id) => document.getElementById(id);
  const form = byId("scenario");
  const sourceNames = { cn: "中国", us: "美国", other: "其他国家" };
  const typeNames = {
    service: "劳务或服务", interest: "利息", dividend: "股息、红利", rent: "有形财产租金",
    royalty: "特许权使用费", real: "不动产转让", equity: "股权或一般动产",
    purchased: "购入存货", produced: "自产存货",
  };
  const ruleNames = { ce: "中国企业所得税", ci: "中国个人所得税", us: "美国联邦所得税" };
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
    return { source: `${sourceNames[location]}来源`, pathSource: `${sourceNames[location]}来源`, segments: [{ location, share: 100 }] };
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
      connection = "服务实际履行地";
      if (activity === "mixed") {
        const cn = Number(byId("mix").value);
        outcome = { source: `中国 ${cn}% / 美国 ${100 - cn}%`, pathSource: "中美两地分配", segments: [{ location: "cn", share: cn }, { location: "us", share: 100 - cn }] };
        fact = `两地履行 · 中国 ${cn}%`;
        rule = "跨越两地时，按实际服务比例分配；付款人和收款账户不单独改变来源。";
        checks = ["核实工作日、项目记录和差旅行程", "企业服务另查机构、场所或常设机构", "工资、奖金和股权激励可能对应不同服务期间"];
      } else {
        outcome = singleSource(activity);
        fact = `履行地 · ${sourceNames[activity]}`;
        rule = "服务按实际履行地确定来源，而非只看谁付款。";
        checks = ["是否有部分工作在其他国家完成", "是否存在协定短期受雇例外", "企业是否通过当地常设机构提供服务"];
      }
    } else if (type === "interest") {
      const payer = byId("payer").value;
      connection = "债务人或负担主体";
      fact = `${sourceNames[payer]}付款、负担`;
      outcome = singleSource(payer);
      rule = rules === "us" ? "美国一般按债务人居民身份确定利息来源。" : "中国一般按负担、支付主体所在地或个人住所地确定来源。";
      checks = ["检查分支利息、存款和证券组合利息等例外", "确认谁在经济上负担利息", "再查协定限税与受益所有人"];
    } else if (type === "dividend") {
      const company = byId("company").value;
      connection = "分配企业所在地";
      fact = `分配企业 · ${sourceNames[company]}`;
      outcome = singleSource(company);
      rule = rules === "us" ? "美国一般按分配公司的设立地确定股息来源。" : "中国按分配股息、红利的企业所在地确定来源。";
      checks = ["确认分配主体而非收款账户", "检查持股比例与协定限税", "美国规则下核实外国公司有效联系所得比例"];
    } else if (type === "rent") {
      const use = byId("use").value;
      connection = "财产实际使用地";
      fact = `使用地 · ${sourceNames[use]}`;
      outcome = singleSource(use);
      rule = "有形财产租金通常按财产所在地或实际使用地确定来源。";
      checks = ["财产跨境移动时按使用期间合理分配", "船舶、航空器和集装箱可能有特别规则", "检查扣缴、净额计税选择与协定"];
    } else if (type === "royalty") {
      const location = rules === "ce" ? byId("payer").value : byId("use").value;
      connection = rules === "ce" ? "费用负担主体" : "权利使用地";
      fact = rules === "ce" ? `${sourceNames[location]}负担、支付` : `使用地 · ${sourceNames[location]}`;
      outcome = singleSource(location);
      rule = rules === "ce" ? "中国企业所得税一般按负担、支付主体或机构场所所在地确定来源。" : rules === "ci" ? "中国个人所得税强调特许权在境内或境外使用。" : "美国一般按无形资产使用地或获准使用地确定来源。";
      checks = ["区分服务成果与持续使用知识产权", "确认哪个主体或常设机构负担付款", "比较具体协定的特许权条款"];
    } else if (type === "real") {
      const property = byId("property").value;
      connection = "不动产所在地";
      fact = `不动产 · ${sourceNames[property]}`;
      outcome = singleSource(property);
      rule = "不动产转让所得通常按不动产所在地确定来源。";
      checks = ["核实是不动产权益还是不动产公司股权", "检查间接转让和资产价值比例规则", "查看协定的财产收益条款"];
    } else if (type === "equity") {
      const location = rules === "ce" ? byId("company").value : rules === "us" ? byId("seller").value : byId("sale").value;
      connection = rules === "ce" ? "被投资企业所在地" : rules === "us" ? "转让人居民身份" : "转让地点与特殊规则";
      fact = `${connection} · ${sourceNames[location]}`;
      outcome = singleSource(location);
      rule = rules === "ce" ? "权益性投资资产转让一般按被投资企业所在地确定来源。" : rules === "us" ? "一般动产转让通常按转让人居民身份确定来源，但存在多类例外。" : "中国个人财产转让需观察转让地点及境外股权特殊规则。";
      checks = ["股权价值是否主要来自境内不动产", "价款是否与无形资产未来使用挂钩", "交易是否归属于固定营业场所"];
    } else if (type === "purchased") {
      const sale = byId("sale").value;
      connection = "销售或交易活动地";
      fact = `交易活动 · ${sourceNames[sale]}`;
      outcome = singleSource(sale);
      rule = rules === "us" ? "美国购入存货一般按销售地确定来源，固定营业场所可能改变结果。" : "中国需按交易活动发生地或财产转让规则判断，不能只看发票和付款地。";
      checks = ["核实所有权转移、交付和固定营业场所", "区分购入存货与自产存货", "检查协定营业利润和常设机构"];
    } else {
      connection = rules === "us" ? "生产活动所在地" : "交易活动发生地";
      if (rules === "us") {
        const us = Number(byId("prod").value);
        outcome = { source: `美国 ${us}% / 外国 ${100 - us}%`, pathSource: "按生产活动分配", segments: [{ location: "us", share: us }, { location: "other", share: 100 - us, label: "外国" }] };
        fact = `美国生产 ${us}%`;
        rule = "美国现行第 863 条按生产活动所在地分配自产存货来源。";
      } else {
        const sale = byId("sale").value;
        outcome = singleSource(sale);
        outcome.pathSource = `${sourceNames[sale]}来源 · 综合事实`;
        fact = `交易活动 · ${sourceNames[sale]}`;
        rule = "中国销售货物所得以交易活动发生地判断，并结合生产、签约和交付事实。";
      }
      checks = ["记录生产资产、人员和制造活动所在地", "旧课件的 50/50 方法不代表现行美国法", "检查销售办公室和常设机构的影响"];
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
    bar.setAttribute("aria-label", outcome.segments.map((segment) => `${segment.label || sourceNames[segment.location]} ${segment.share}%`).join("；"));
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
