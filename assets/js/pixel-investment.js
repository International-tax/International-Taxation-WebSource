(function () {
  "use strict";

  const K = TaxPixel.lessonKit;
  const { words, number, yuan, pct, esc, R, G, T, person, desk, building, factory, coin, wallet, hArrow, hLine, vLine, C, paint } = K;

  function svg(body, width, height, label) {
    const accessibility = label ? `role="img" aria-label="${esc(label)}"` : 'aria-hidden="true"';
    return `<svg class="investment-drawing" viewBox="0 0 ${width} ${height}" ${accessibility} focusable="false" shape-rendering="crispEdges">${body}</svg>`;
  }

  function paper(x, y, width, height, color) {
    let body = R(x + 5, y + 5, width, height, C.line) + R(x, y, width, height, C.paper) + R(x, y, 5, height, color);
    for (let line = 0; line < 4; line++) body += R(x + 13, y + 15 + line * 13, width - 26 - (line % 2) * 13, 3, C.sandDark);
    return body;
  }

  function ledgerRow(label, value, attribute = "") {
    return `<div class="investment-ledger-row" ${attribute}><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`;
  }

  function consulting(s) {
    const dollars = value => "$" + number(value);
    const officeLabel = s.share === 0
      ? words("纽约办公室 · 服务全部在美国履行", "New York office · all services performed in the US")
      : words("美国居民乔丹 · 当前来源比例假设", "Jordan, US resident · selected source-share assumption");
    const drawing =
      R(18, 12, 190, 148, "#f4ebe5") + R(28, 22, 78, 43, C.blueLight) + R(65, 22, 4, 43, C.paper) + R(28, 43, 78, 4, C.paper) +
      person(30, 84, 0.94, { shirt: "blue", hair: "bob", hairColor: "ink" }) + desk(75, 100, 1.05) +
      paper(128, 31, 55, 58, C.blue) +
      building(374, 57, 96, 95, C.green) +
      hArrow(204, 359, 70, C.blue, true) + paper(264, 32, 39, 40, C.blue) +
      hArrow(359, 211, 132, C.gold) + coin(273, 111, 1.25) +
      R(18, 160, 465, 5, C.line);
    const creditFraction = s.foreignTax === 0 ? 0 : s.credit / s.foreignTax;
    const remainder = s.foreignTax - s.credit;
    const gateTitle = words("普通抵免的限额闸口", "The ordinary-credit limit");
    const body = `<div class="consulting-office">
      <div class="investment-location-labels"><strong>${esc(officeLabel)}</strong><strong>${esc(words("安哥拉客户", "Angolan client"))}</strong></div>
      ${svg(drawing, 500, 180, words("乔丹在工作台完成报告，报告交付客户；客户反向支付咨询费。", "Jordan prepares the report at the workstation and delivers it to the client; the consulting fee travels in the opposite direction."))}
      <div class="consulting-transfer-labels"><span><i class="investment-key blue"></i>${esc(words("报告交付 →", "Report delivery →"))}</span><span><i class="investment-key gold"></i>${esc(words("← 付款 ", "← Payment ") + dollars(s.amount))}</span></div>
    </div>
    <div class="consulting-accounting">
      <section class="consulting-credit" aria-label="${esc(gateTitle)}">
        <h3>${esc(gateTitle)}</h3>
        <p>${esc(words("境外来源占比 ", "Foreign-source share: ") + pct(s.share))}</p>
        <div class="credit-conduit ${s.foreignTax === 0 ? "is-empty" : ""}" role="img" aria-label="${esc(words("外国税 ", "Foreign tax ") + dollars(s.foreignTax) + words("；可抵免 ", "; creditable ") + dollars(s.credit) + words("；未抵免 ", "; uncredited ") + dollars(remainder))}">
          <span class="credit-admitted" style="width:${creditFraction * 100}%"></span><i aria-hidden="true" style="left:${creditFraction * 100}%"></i>
        </div>
        <div class="consulting-credit-key"><span><i class="investment-key green"></i>${esc(words("实际抵免", "Credit used"))}</span><span><i class="investment-key sand"></i>${esc(words("未获抵免", "Uncredited"))}</span></div>
        ${ledgerRow(words("外国税", "Foreign tax"), dollars(s.foreignTax))}
        ${ledgerRow(words("限额", "Limit"), dollars(s.limit), `data-credit-limit="${s.limit}"`)}
        ${ledgerRow(words("实际抵免", "Credit used"), dollars(s.credit), `data-credit-used="${s.credit}"`)}
        <p class="investment-formula">${esc(words("美国抵免前税额 × 境外来源比例 = ", "US tax before credit × foreign-source share = ") + dollars(s.limit))}</p>
      </section>
      <section class="consulting-receipt" aria-label="${esc(s.chosen.name)}">
        <h3>${esc(s.chosen.name)}</h3>
        ${ledgerRow(words("咨询费", "Consulting fee"), dollars(s.amount))}
        ${ledgerRow(words("安哥拉税款", "Angolan tax"), "− " + dollars(s.foreignTax))}
        ${ledgerRow(words("美国税款", "US tax"), "− " + dollars(s.chosen.usTax), `data-us-tax="${s.chosen.usTax}"`)}
        <div class="receipt-total">${ledgerRow(words("税后所得", "After-tax income"), dollars(s.chosen.after), `data-after-tax="${s.chosen.after}"`)}</div>
      </section>
    </div>
    <p class="investment-explanation">${esc(s.share === 0
      ? words("服务全部在纽约履行时，本例美国规则下的境外来源比例与抵免限额均为零。安哥拉扣缴本身不会改变服务履行地点。", "With all services performed in New York, this example has zero foreign-source share and a zero US credit limit. Angolan withholding does not change where the service was performed.")
      : words("境外来源比例是当前教学假设；抵免限额随该比例变化，实际抵免同时受外国税额限制。", "The foreign-source share is the current teaching assumption. It changes the credit limit; the foreign tax paid also caps the credit."))}</p>`;
    paint("consulting", words("履行地点决定所得来源，抵免金额受限额约束", "Service location determines income source; credits are capped"), body);
  }

  function cenDrawing() {
    const body =
      R(7, 8, 142, 228, "#f4ebe5") + R(327, 8, 142, 105, "#f4ebe5") + R(327, 131, 142, 105, "#ede5db") +
      person(57, 83, 1.25, { shirt: "blue", hair: "bob", hairColor: "ink" }) +
      hLine(126, 231, 122, C.blue) + vLine(231, 63, 183, C.blue) + hArrow(231, 325, 63, C.blue) + hArrow(231, 325, 183, C.rust) +
      building(359, 37, 75, 60, C.blue) + building(359, 160, 75, 60, C.rust) +
      T(79, 48, "A", { size: 24, color: C.blueDark }) + T(449, 32, "A", { size: 21, color: C.blueDark }) + T(449, 155, "B", { size: 21, color: C.rustDark });
    return svg(body, 480, 245, words("同一位 A 国投资者面前分出两条选择路径：A 国项目和 B 国项目。", "The same A-resident investor faces two alternative paths: a project in A or a project in B."));
  }

  function cinDrawing() {
    const body =
      R(7, 8, 142, 105, "#f4ebe5") + R(7, 131, 142, 105, "#ede5db") + R(327, 8, 142, 228, "#f4ebe5") +
      person(47, 31, 1.02, { shirt: "blue", hair: "bob", hairColor: "ink" }) + person(47, 154, 1.02, { shirt: "rust", hair: "short", hairColor: "brown" }) +
      hLine(119, 236, 63, C.blue) + vLine(236, 63, 122, C.blue) + hLine(119, 236, 183, C.rust) + vLine(236, 122, 183, C.rust) + hArrow(236, 325, 122, C.greenDark) +
      factory(345, 86, 0.91) +
      T(122, 32, "A", { size: 21, color: C.blueDark }) + T(122, 155, "B", { size: 21, color: C.rustDark }) + T(398, 48, "B", { size: 24, color: C.greenDark });
    return svg(body, 480, 245, words("A 国投资者和 B 国当地投资者的两条投资路径汇入同一个 B 国市场。", "An investor from A and a local investor from B converge on the same market in B."));
  }

  function returnsTable(firstLabel, secondLabel, first, second) {
    const rows = [
      [words("A 国税款", "Tax to A"), "taxA"],
      [words("B 国税款", "Tax to B"), "taxB"],
      [words("合计税额", "Total tax"), "total"],
      [words("税后收益", "After-tax return"), "after"],
    ];
    return `<table class="neutral-return-table"><thead><tr><th scope="col">${esc(words("相同税前收益", "Equal pre-tax return"))}</th><th scope="col">${esc(firstLabel)}</th><th scope="col">${esc(secondLabel)}</th></tr></thead><tbody>${rows.map(([label, key]) => `<tr><th scope="row">${esc(label)}</th><td data-value="${first[key]}" data-metric="${key}">${esc(yuan(first[key]))}</td><td data-value="${second[key]}" data-metric="${key}">${esc(yuan(second[key]))}</td></tr>`).join("")}</tbody></table>`;
  }

  function neutralityResult(income, actual, benchmark, type) {
    const same = Math.abs(actual - benchmark) < 0.000001;
    const message = income === 0
      ? words("所得为零，不作中性判断。", "Zero income: no neutrality inference.")
      : same
        ? words("本例两项税负相同，符合这组比较的中性条件。", "Equal tax burdens in this example meet this comparison's neutrality condition.")
        : words("本例税负不同：跨境总税额 − 对照税额 = ", "Tax burdens differ: cross-border tax − comparison tax = ") + yuan(actual - benchmark);
    return `<p class="neutrality-verdict ${income === 0 ? "empty" : same ? "equal" : "different"}" data-neutrality="${type}" data-equal="${income > 0 && same}" data-difference="${actual - benchmark}">${esc(message)}</p>`;
  }

  function relief(s) {
    const chosen = s.methods[Number(document.getElementById("neutrality-method").value)];
    const homeTax = s.income * s.homeRate / 100;
    const localTax = s.income * s.sourceRate / 100;
    const domestic = { taxA: homeTax, taxB: 0, total: homeTax, after: s.income - homeTax };
    const abroad = { taxA: chosen.home, taxB: chosen.source, total: chosen.total, after: chosen.after };
    const local = { taxA: 0, taxB: localTax, total: localTax, after: s.income - localTax };
    document.getElementById("neutrality-pixels").innerHTML =
      `<section class="neutrality-scene" aria-labelledby="pixel-cen-heading"><header><h3 id="pixel-cen-heading">${esc(words("CEN · 资本输出中性", "CEN · Capital export neutrality"))}</h3><p>${esc(words("同一个人，选择投资地点", "Same investor, different investment locations"))}</p></header>
        <dl class="neutrality-guide">
          <div><dt>${esc(words("含义", "Meaning"))}</dt><dd>${esc(words("本国居民在境内、境外投资取得相同收益时，承担相同的总税负。", "A resident investor bears the same total tax on equal returns from domestic and foreign investments."))}</dd></div>
          <div><dt>${esc(words("关注的问题", "Concern"))}</dt><dd>${esc(words("税负差异是否改变投资者选择境内或境外投资的决定，影响资本配置效率。", "Whether tax differences distort the choice between investing at home and abroad, affecting the efficient allocation of capital."))}</dd></div>
          <div><dt>${esc(words("解决方法", "Tax approach"))}</dt><dd>${esc(words("居民国对境内外所得统一征税，并抵免境外税款。本例中，境外税率不高于本国时，普通抵免可实现 CEN；境外税款超过抵免限额时，仍会存在税负差异。", "The residence country taxes domestic and foreign income alike and credits foreign tax. In this example, ordinary credit achieves CEN when the foreign rate does not exceed the home rate; tax differences remain when foreign tax exceeds the credit limit."))}</dd></div>
        </dl>
        <div class="neutrality-composition"><figure>${cenDrawing()}<figcaption>${esc(words("投资者始终为 A 国居民；两条箭头代表可替代的投资选择。", "The investor remains resident in A; the arrows show alternative investment choices."))}</figcaption></figure>
        ${returnsTable(words("投资 A 国", "Invest in A"), words("投资 B 国", "Invest in B"), domestic, abroad)}</div>
        ${neutralityResult(s.income, chosen.total, homeTax, "cen")}
      </section>
      <section class="neutrality-scene" aria-labelledby="pixel-cin-heading"><header><h3 id="pixel-cin-heading">${esc(words("CIN · 资本输入中性", "CIN · Capital import neutrality"))}</h3><p>${esc(words("同一个市场，投资者来自不同国家", "Same market, investors from different countries"))}</p></header>
        <dl class="neutrality-guide">
          <div><dt>${esc(words("含义", "Meaning"))}</dt><dd>${esc(words("在同一投资国市场，来自不同国家的投资者取得相同收益时，承担相同的总税负。", "Investors from different countries bear the same total tax on equal returns earned in the same host market."))}</dd></div>
          <div><dt>${esc(words("关注的问题", "Concern"))}</dt><dd>${esc(words("本国投资者赴境外投资时，能否与投资国当地企业在相同的税收条件下竞争。", "Whether investors expanding abroad can compete with local businesses in the host country on equal tax terms."))}</dd></div>
          <div><dt>${esc(words("解决方法", "Tax approach"))}</dt><dd>${esc(words("居民国对境外所得实行全额免税，使本国投资者与投资国当地企业同样只承担投资国税负，在本例条件下实现 CIN。", "The residence country fully exempts foreign income, so its investors and local businesses bear only the host-country tax, achieving CIN under this example’s assumptions."))}</dd></div>
        </dl>
        <div class="neutrality-composition"><figure>${cinDrawing()}<figcaption>${esc(words("A 国居民与 B 国居民都投资 B 国，分别取得同样的税前收益。", "Residents of A and B both invest in B, each earning the same pre-tax return."))}</figcaption></figure>
        ${returnsTable(words("A 国投资者", "Investor from A"), words("B 国投资者", "Investor from B"), abroad, local)}</div>
        ${neutralityResult(s.income, chosen.total, localTax, "cin")}
      </section>
      <p class="investment-explanation">${esc(words("两组税前收益均为 ", "Pre-tax return in both comparisons: ") + yuan(s.income) + words("；A 国税率 ", "; A rate ") + pct(s.homeRate) + words("，B 国税率 ", ", B rate ") + pct(s.sourceRate) + words("。A 国对境外所得采用", ". A applies ") + chosen.name + words("。", "."))}</p>`;

    const foreignTax = s.methods[2].source;
    const credit = homeTax - s.methods[2].home;
    const deductionBase = Math.max(0, s.income - foreignTax);
    const taxPaper = (color, mark) => svg(paper(6, 6, 94, 110, color) + R(68, 78, 26, 26, color) + T(81, 96, mark, { size: 16, color: C.white }), 112, 126, "");
    const body = `<div class="relief-calculation-stations">
      <section><div class="relief-paper">${taxPaper(C.blue, "−")}</div><div><h3>${esc(words("扣除法：先减少税基", "Deduction: reduce the tax base first"))}</h3><p>${esc(yuan(s.income) + " − " + yuan(foreignTax) + " = " + yuan(deductionBase))}</p><p class="investment-formula">${esc(yuan(deductionBase) + " × " + pct(s.homeRate) + " = " + yuan(s.methods[1].home))}</p><span>${esc(words("居民国收取 ", "Residence country collects ") + yuan(s.methods[1].home))}</span></div></section>
      <section><div class="relief-paper">${taxPaper(C.rust, "−")}</div><div><h3>${esc(words("普通抵免：算税后抵减", "Ordinary credit: subtract after calculating tax"))}</h3><p>${esc(yuan(s.income) + " × " + pct(s.homeRate) + " = " + yuan(homeTax))}</p><p class="investment-formula">${esc(yuan(homeTax) + " − min(" + yuan(foreignTax) + ", " + yuan(homeTax) + ") = " + yuan(s.methods[2].home))}</p><span>${esc(words("实际抵免 ", "Credit used ") + yuan(credit))}</span></div></section>
    </div><p class="investment-explanation">${esc(words("外国税先减少税基时，节省的居民国税额为外国税乘以居民国税率；普通抵免则在限额内直接抵减税额。", "Deducting foreign tax from the base saves foreign tax multiplied by the residence rate. Ordinary credit directly reduces residence tax within the credit limit."))}</p>`;
    paint("relief", words("扣除减少税基，抵免减少税额", "Deductions reduce the tax base; credits reduce tax"), body);
  }

  function tank(x, y, value, total, color) {
    const fraction = total === 0 ? 0 : value / total;
    const height = 96 * fraction;
    return R(x, y, 96, 110, C.line) + R(x + 5, y + 5, 86, 100, C.paper) +
      R(x + 7, y + 103 - height, 82, height, color) + R(x - 6, y - 4, 108, 7, C.sandDark) +
      R(x - 4, y + 110, 104, 7, C.sandDark);
  }

  function profit(s) {
    const amount = value => number(value) + words(" 万元", " × ¥10,000");
    const drawing = factory(22, 28, 0.92) + building(385, 38, 101, 67, C.green) +
      hArrow(143, 365, 73, C.rust) + coin(249, 48, 1) +
      tank(31, 151, s.remaining, s.pre, C.blue) + tank(388, 151, s.fee, s.pre, C.green) +
      vLine(78, 115, 145, C.blue) + vLine(436, 115, 145, C.green) +
      paper(211, 170, 83, 85, C.sandDark) + hLine(137, 204, 226, C.line, true) + hLine(305, 379, 226, C.line, true);
    const scale = Math.max(30, s.lowRate);
    const rateWidth = s.lowRate / scale * 100;
    const threshold = 15 / scale * 100;
    const gapWidth = Math.max(0, 15 - s.lowRate) / scale * 100;
    const body = `<div class="profit-industrial-scene"><div class="investment-location-labels"><strong>${esc(words("甲国生产企业", "Production company in A"))}</strong><strong>${esc(words("低税地关联公司", "Low-tax affiliate"))}</strong></div>
      <p class="profit-pipe-caption">${esc(words("关联咨询费 → ", "Related-party fee → ") + amount(s.fee))}</p>
      ${svg(drawing, 520, 285, words("咨询费从甲国公司流向低税地关联公司；两处储罐按同一集团税前利润标尺表示分配金额。", "The fee flows from the company in A to the low-tax affiliate; both tanks show allocated profit on the same group-profit scale."))}
      <p class="profit-group-total">${esc(words("集团税前利润 ", "Group pre-tax profit ") + amount(s.pre))}</p>
      <div class="profit-tank-values"><div data-profit="${s.remaining}"><span>${esc(words("甲国税前利润", "Pre-tax profit in A"))}</span><strong>${esc(amount(s.remaining))}</strong><small>${esc(words("税款 ", "Tax ") + amount(s.highTax) + " · " + pct(s.highRate))}</small></div><div data-profit="${s.fee}"><span>${esc(words("低税地税前利润", "Pre-tax low-tax profit"))}</span><strong>${esc(amount(s.fee))}</strong><small>${esc(words("税款 ", "Tax ") + amount(s.lowTax) + " · " + pct(s.lowRate))}</small></div></div>
      <p class="investment-explanation">${esc(words("储罐共同满量程为 ", "Both tanks have a full-scale amount of ") + amount(s.pre) + words("；费用仅改变利润所在地。", "; the fee changes where profit is recorded."))}</p>
    </div>
    <section class="profit-tax-ruler"><h3>${esc(words("低税法域的 15% 标尺", "The low-tax jurisdiction's 15% benchmark"))}</h3>
      <div class="jurisdiction-rate-ruler" role="img" aria-label="${esc(words("低税法域税率 ", "Low-tax jurisdiction rate ") + pct(s.lowRate) + words("，15% 补足基准", "; top-up benchmark 15%"))}"><span class="jurisdiction-rate" style="width:${rateWidth}%"></span><span class="jurisdiction-gap" style="left:${rateWidth}%;width:${gapWidth}%"></span><i style="left:${threshold}%"></i></div>
      <div class="jurisdiction-ruler-labels"><span>0%</span><strong style="left:${threshold}%">15%</strong><span>${pct(scale)}</span></div>
      ${ledgerRow(words("低税法域现有税款", "Existing low-tax jurisdiction tax"), amount(s.lowTax))}
      ${ledgerRow(words("该法域补足税款", "Top-up for this jurisdiction"), amount(s.topUpTax), `data-jurisdiction-topup="${s.topUpTax}"`)}
      <p class="investment-formula">${esc(amount(s.fee) + " × max(0, 15% − " + pct(s.lowRate) + ") = " + amount(s.topUpTax))}</p>
      <p class="investment-explanation">${esc(words("集团 ETR 为 ", "Group ETR is ") + pct(s.etr) + words("。本例补足税使用低税法域的利润与税率，分别核算。", ". This example computes top-up separately using the low-tax jurisdiction's profit and rate."))}</p>
    </section>`;
    paint("profit", words("生产、费用与利润所在地", "Production, fees and where profit is recorded"), body);
  }

  TaxPixel.registerLessons({ consulting, relief, profit });
})();
