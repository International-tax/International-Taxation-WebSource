(function () {
  "use strict";

  const { words: w, number: n, yuan, pct, esc, R, G, person, desk, building, house, wallet, coin, taxNode, hArrow, vArrow, hLine, vLine, paint, note, C } = TaxPixel.lessonKit;

  function art(viewBox, label, body, className = "") {
    return `<svg class="transaction-art ${className}" viewBox="${viewBox}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges"><title>${esc(label)}</title>${body}</svg>`;
  }

  function measure(label, value, key, amount) {
    return `<div class="transaction-measure"><span>${esc(label)}</span><strong data-measure="${key}" data-value="${amount}">${esc(value)}</strong></div>`;
  }

  function caption(label, content) {
    return `<div class="transaction-caption"><strong>${esc(label)}</strong><span>${esc(content)}</span></div>`;
  }

  function seal(label, pass) {
    return `<span class="transaction-seal ${pass ? "accepted" : "declined"}"><b aria-hidden="true">${pass ? "✓" : "×"}</b>${esc(label)}</span>`;
  }

  function officeRoom() {
    let body = R(275, 17, 306, 165, C.cream) + R(275, 17, 8, 165, C.rustDark) + R(275, 17, 306, 8, C.rustDark) + R(275, 174, 306, 8, C.sandDark);
    body += R(490, 38, 62, 52, C.blueDark) + R(495, 43, 52, 42, C.blueLight) + R(519, 43, 5, 42, C.white) + R(495, 62, 52, 5, C.white);
    body += R(304, 40, 63, 46, C.paper) + R(304, 40, 63, 8, C.rust) + R(312, 56, 47, 3, C.line) + R(312, 66, 29, 3, C.line);
    body += person(396, 84, 1.13, { shirt: "green", hair: "short" }) + desk(426, 109, 0.96);
    body += R(560, 136, 12, 36, C.rust) + R(552, 116, 29, 9, C.greenDark) + R(558, 107, 17, 28, C.green);
    body += building(38, 69, 90, 91, C.blue) + R(65, 39, 38, 19, C.blueDark) + R(69, 43, 30, 9, C.blueLight);
    body += hLine(105, 233, 48, C.blue, true) + vLine(233, 48, 116, C.blue, true) + hArrow(233, 436, 116, C.blue, true);
    body += R(195, 22, 4, 157, C.line) + R(190, 31, 14, 5, C.paper) + R(190, 171, 14, 5, C.paper);
    return body;
  }

  function remote(s) {
    const title = w("房间在 B 国，服务通过网络跨境", "The room is in B; the service crosses the network");
    const activityNames = { aux: w("辅助活动", "Auxiliary activity"), core: w("核心业务", "Core business"), sales: w("客户与合同", "Customers and contracts") };
    const reasons = { personal: w("个人或家庭原因", "Personal or family reasons"), cost: w("节省成本", "Cost saving"), business: w("企业商业理由", "Business reasons") };
    const conditions = [
      [s.days <= 183, w("停留不超过 183 天", "Presence does not exceed 183 days")],
      [!s.employer, w("雇主非 B 国居民", "Employer is not resident in B")],
      [!s.borne, w("工资非 B 国常设机构负担", "Pay is not borne by a PE in B")],
    ];
    const scene = `<div class="remote-room">${art("0 0 610 200", title, officeRoom())}<div class="remote-place-labels">${caption(w("雇主端", "Employer"), s.employer ? w("B 国居民雇主", "Employer resident in B") : w("非 B 国居民雇主", "Employer not resident in B"))}${caption(w("B 国住所", "Home in B"), w("员工实际履行劳务", "Employee physically performs the work"))}</div></div>`;
    const salary = `<div class="remote-timesheet"><div class="remote-date-stamp"><span>${esc(w("停留", "PRESENCE"))}</span><strong data-measure="presence" data-value="${s.days}">${n(s.days)}</strong><span>${esc(w("天", "days"))}</span></div><div class="remote-work-record">${measure(w("B 国实际工作日 / 全年工作日", "Workdays in B / annual workdays"), `${n(s.workdays)} / ${n(s.totalwork)}`, "workdays", s.workdays)}${measure(w("B 国劳务对应工资", "Pay attributable to work in B"), yuan(s.localSalary), "localSalary", s.localSalary)}<p>${esc(yuan(s.salary) + " × " + n(s.workdays) + " ÷ " + n(s.totalwork))}</p></div></div>`;
    const exception = `<div class="remote-exception"><h3>${esc(w("短期受雇例外：三项条件共同判断", "Short-term employment exception: all three conditions"))}</h3><div class="remote-condition-stamps">${conditions.map(([pass, label]) => seal(label, pass)).join("")}</div>${note(s.exception ? w("三项条件已满足，仍须核对适用协定。B 国劳务来源金额保持按实际工作日计算。", "All three conditions are met; confirm the applicable treaty. B-source pay continues to follow actual workdays.") : w("至少一项条件未满足；来源划分与协定征税权分别判断。", "At least one condition fails; source allocation and treaty taxing rights are separate tests."))}</div>`;
    const business = `<div class="remote-business"><h3>${esc(w("同一房间中的企业活动", "Business activity in the same room"))}</h3><div class="remote-business-facts"><span>${esc(pct(s.remote) + w(" 住所工作", " home-office work"))}</span><span>${esc(n(s.months) + w(" 个月", " months"))}</span><span>${esc(reasons[s.reason])}</span><span>${esc(activityNames[s.activity])}</span></div>${note(s.remote >= 50 ? w("达到 50% 观察点，继续审查持续使用、商业理由及企业对场所的使用。", "The 50% review point is reached; examine continuity, commercial reasons and the enterprise’s use of the place.") : w("低于 50% 观察点，结合完整事实核验该住所是否构成企业营业场所。", "Below the 50% review point; examine the full facts when assessing whether the home is a place of business."))}${note(s.office ? w("A 国无可用办公室。", "No usable office in A.") : w("当前未显示 A 国办公室停用。", "No unavailability of the A-country office is indicated."))}${note(s.contract ? w("经常订约或主导合同的线索，需要另行检查代理人常设机构。", "Habitual contracting or a principal role in contracts requires a separate agency-PE analysis.") : w("当前未显示经常订约线索。", "No habitual-contracting indicator is selected."))}</div>`;
    paint("remote", title, scene + salary + exception + business);
  }

  function labor(s) {
    let cells = "";
    for (let day = 0; day < s.total; day++) cells += `<i class="service-day ${day < s.domestic ? "at-home" : "abroad"}"></i>`;
    const calendar = `<div class="labor-almanac"><header><div><span>${esc(w("服务期间", "SERVICE PERIOD"))}</span><strong>${esc(n(s.total) + w(" 个工作日", " workdays"))}</strong></div><span class="calendar-binding" aria-hidden="true"></span></header><div class="labor-day-grid" role="img" aria-label="${esc(w("每格一个服务日；本国 ", "One square per service day; home ") + n(s.domestic) + w(" 天，境外 ", " days, abroad ") + n(s.foreign) + w(" 天", " days"))}">${cells}</div><div class="labor-calendar-key"><span><i class="at-home"></i>${esc(w("本国 ", "Home ") + n(s.domestic) + w(" 天", " days"))}</span><span><i class="abroad"></i>${esc(w("境外 ", "Abroad ") + n(s.foreign) + w(" 天", " days"))}</span></div><p>${esc(w("每格一个服务日；按地点归组，排列不表示日期顺序。", "One square per service day; grouped by location, without implying a chronological itinerary."))}</p></div>`;
    const ticket = (foreign) => {
      const days = foreign ? s.foreign : s.domestic;
      const value = foreign ? s.foreignIncome : s.domesticIncome;
      return `<article class="labor-pay-stub ${foreign ? "abroad" : "at-home"}"><div class="labor-stub-header"><span>${esc(foreign ? w("境外服务", "FOREIGN SERVICE") : w("本国服务", "HOME SERVICE"))}</span><b>${n(days)} / ${n(s.total)}</b></div><p>${esc(yuan(s.salary) + " × " + n(days) + " ÷ " + n(s.total))}</p><div class="labor-stub-result"><span>${esc(w("对应来源报酬", "Allocated pay"))}</span><strong data-measure="${foreign ? "foreignIncome" : "domesticIncome"}" data-value="${value}">${esc(yuan(value))}</strong></div></article>`;
    };
    paint("labor", w("服务日历与报酬分配", "Service calendar and pay allocation"), calendar + `<div class="labor-stub-link" aria-hidden="true">↓</div><div class="labor-payroll">${ticket(false)}${ticket(true)}</div>` + note(w("两张报酬票据合计 ", "The two pay allocations total ") + yuan(s.salary) + w("。停留日与实际服务日分别计算。", ". Presence days and actual service days are counted separately.")));
  }

  function paymentSplitter() {
    let body = R(263, 10, 94, 57, C.paper) + R(263, 10, 94, 8, C.gold) + R(276, 28, 68, 4, C.line) + R(276, 39, 48, 4, C.line) + R(276, 50, 57, 4, C.line);
    body += vLine(310, 67, 94, C.gold) + hLine(128, 493, 94, C.gold) + vArrow(128, 94, 127, C.rust) + vArrow(493, 94, 127, C.green);
    body += taxNode(101, 139, "", C.rust, 1) + wallet(462, 143, 1.1);
    body += coin(304, 76, 0.7) + R(278, 88, 64, 12, C.gold);
    return body;
  }

  function withholding(s) {
    const label = s.isInterest ? w("利息付款", "Interest payment") : w("股息付款", "Dividend payment");
    const source = `<div class="withholding-split"><div class="withholding-gross">${measure(label + w(" · 税前总额", " · gross amount"), yuan(s.gross), "gross", s.gross)}</div>${art("0 0 620 202", w("付款分为来源国扣缴和收款人到账", "The payment splits into source withholding and the recipient’s receipt"), paymentSplitter())}<div class="withholding-branches"><div class="withholding-source">${measure(w("来源国取得", "Source country collects"), yuan(s.sourceTax), "sourceTax", s.sourceTax)}<span>${esc(pct(s.effectiveRate) + w(" 实际扣缴率", " effective withholding"))}</span></div><div class="withholding-receipt">${measure(w("收款人到账", "Recipient receives"), yuan(s.receipt), "receipt", s.receipt)}<span>${esc(w("已扣除来源国税款", "After source withholding"))}</span></div></div></div>`;
    const ticket = `<div class="withholding-tax-return"><div class="tax-credit-voucher"><span class="voucher-title">${esc(w("外国税抵免凭证", "FOREIGN TAX CREDIT"))}</span><strong data-measure="credit" data-value="${s.credit}">${esc(yuan(s.credit))}</strong><span>${esc(w("抵减居民国税额", "Offsets residence tax"))}</span><i aria-hidden="true">✓</i></div><div class="residence-return"><h3>${esc(w("居民国计税单", "Residence tax return"))}</h3><dl><div><dt>${esc(w("抵免前税额", "Tax before credit"))}</dt><dd>${esc(yuan(s.residenceTax))}</dd></div><div><dt>${esc(w("减：实际抵免", "Less: credit used"))}</dt><dd>− ${esc(yuan(s.credit))}</dd></div><div class="residence-due"><dt>${esc(w("居民国另收", "Additional residence tax"))}</dt><dd data-measure="topup" data-value="${s.topup}">${esc(yuan(s.topup))}</dd></div></dl></div></div>`;
    const final = `<div class="withholding-final">${art("0 0 100 65", w("最终税后钱包", "Final after-tax wallet"), wallet(19, 17, 1))}<div><span>${esc(w("全部纳税后保留", "Retained after all tax"))}</span><strong data-measure="afterTax" data-value="${s.afterTax}">${esc(yuan(s.afterTax))}</strong><p>${esc(yuan(s.receipt) + " − " + yuan(s.topup) + " = " + yuan(s.afterTax))}</p></div></div>`;
    paint("withholding", w("付款分流、抵免凭证与最终所得", "Payment split, credit voucher and final income"), source + note(s.qualified ? w("协定条件满足，扣缴采用国内税率与协定上限中的较低者。", "Treaty conditions are met; withholding uses the lower of the domestic rate and treaty cap.") : w("协定条件未满足，扣缴采用来源国国内税率。", "Treaty conditions are not met; withholding uses the source domestic rate.")) + ticket + final + note(w("抵免凭证减少居民国应收税款。抵免金额已经体现在补税计算中。", "The credit voucher reduces the residence country’s tax claim. Its amount is already reflected in the additional tax calculation.")));
  }

  function barge() {
    let body = R(8, 66, 220, 9, C.blueLight) + R(0, 82, 254, 5, C.blue) + R(20, 92, 219, 4, C.blueLight);
    body += R(27, 46, 191, 12, C.rustDark) + R(36, 58, 173, 10, C.rustDark) + R(48, 68, 149, 7, C.blueDark);
    body += R(62, 20, 75, 26, C.sandDark) + R(62, 20, 75, 5, C.cream) + R(146, 29, 46, 17, C.sand) + R(161, 12, 25, 17, C.blue);
    body += R(167, 17, 12, 7, C.cream) + R(170, 0, 5, 12, C.rustDark);
    for (let x = 72; x < 130; x += 14) body += R(x, 29, 5, 17, C.rust);
    return body;
  }

  function crownScene() {
    const label = w("Crown Forest 租用 Norsk 的驳船并支付租金", "Crown Forest rents a barge from Norsk and pays rent");
    let body = R(10, 154, 600, 30, C.blueLight) + G(185, 84, 1, barge()) + building(24, 69, 100, 83, C.green) + building(507, 48, 88, 87, C.blue);
    body += hArrow(485, 150, 47, C.blue, true) + hArrow(148, 483, 76, C.gold) + coin(306, 60, 0.7);
    body += R(509, 144, 85, 37, C.paper) + R(516, 151, 71, 3, C.line) + R(516, 160, 57, 3, C.line) + R(516, 169, 65, 3, C.line);
    return `<div class="crown-harbor">${art("0 0 620 205", label, body)}<div class="case-art-labels three">${caption("Crown Forest", w("加拿大承租人", "Canadian lessee"))}${caption(w("驳船使用权 ←　租金 →", "Barge use ←　rent →"), w("租赁标的与付款方向分别标示", "Use of the barge and rent travel in opposite directions"))}${caption("Norsk", w("巴哈马注册 · 美国办事处", "Bahamian incorporation · US office"))}</div></div>`;
  }

  function vault() {
    let body = R(20, 9, 100, 109, C.blueDark) + R(26, 15, 88, 97, C.blue) + R(35, 25, 70, 77, C.sandDark) + R(43, 32, 55, 63, C.paper);
    body += R(57, 48, 30, 31, C.blueDark) + R(62, 43, 20, 41, C.blueDark) + R(51, 54, 41, 19, C.blueDark) + R(66, 54, 12, 20, C.cream);
    body += R(28, 120, 11, 9, C.ink) + R(102, 120, 11, 9, C.ink) + R(112, 36, 15, 9, C.rustDark) + R(112, 83, 15, 9, C.rustDark);
    return body;
  }

  function prevostScene() {
    const label = w("股息进入荷兰公司的自有财产，向股东分配须另行决定", "The dividend becomes the Dutch company’s own property; onward distribution requires its own decision");
    let body = building(24, 70, 93, 78, C.green) + G(244, 27, 1, vault()) + building(486, 30, 60, 49, C.blue) + building(550, 110, 60, 49, C.rust);
    body += hArrow(130, 250, 100, C.gold) + coin(173, 82, 0.8) + hLine(382, 439, 94, C.line, true) + vLine(439, 58, 133, C.line, true) + hLine(439, 483, 58, C.line, true) + hLine(439, 550, 133, C.line, true);
    body += R(424, 83, 28, 22, C.paper) + R(428, 87, 20, 3, C.rustDark) + R(428, 98, 20, 3, C.rustDark) + R(428, 87, 3, 14, C.rustDark) + R(445, 87, 3, 14, C.rustDark);
    return `<div class="prevost-ownership">${art("0 0 620 185", label, body)}<div class="case-art-labels three">${caption(w("加拿大子公司", "Canadian subsidiary"), w("支付股息", "Pays a dividend"))}${caption(w("荷兰公司自有财产", "Dutch company’s own property"), w("自主使用与支配股息", "Controls use of the dividend"))}${caption(w("瑞典、英国股东", "Swedish and UK shareholders"), w("后续分配无自动转付义务", "No automatic onward-payment obligation"))}</div></div>`;
  }

  function securityPaper(x, y, color, kind) {
    let body = R(x, y, 88, 104, C.paper) + R(x, y, 88, 9, color) + R(x + 9, y + 22, 68, 4, C.line) + R(x + 9, y + 35, 47, 4, C.line) + R(x + 9, y + 47, 59, 4, C.line);
    if (kind === "trust") body += R(x + 29, y + 65, 29, 22, C.sandDark) + R(x + 24, y + 87, 39, 5, C.rustDark);
    else if (kind === "shares") body += R(x + 15, y + 78, 11, 15, C.blue) + R(x + 31, y + 69, 11, 24, C.blue) + R(x + 47, y + 59, 11, 34, C.blue);
    else body += coin(x + 29, y + 72, 1.4);
    return body;
  }

  function thielScene() {
    const label = w("Thiel 买入信托权益、转换股票、短期出售，澳大利亚无常设机构", "Thiel acquires trust interests, converts them to shares and resells; no Australian PE exists");
    let body = securityPaper(26, 24, C.sandDark, "trust") + securityPaper(220, 24, C.blue, "shares") + securityPaper(414, 24, C.green, "proceeds") + hArrow(126, 207, 74, C.blue) + hArrow(320, 401, 74, C.green);
    body += building(536, 58, 61, 57, C.sand);
    for (let i = 0; i < 9; i++) body += R(532 + i * 8, 39 + i * 9, 8, 9, C.rustDark);
    return `<div class="thiel-deal">${art("0 0 620 150", label, body)}<ol class="thiel-trade-labels"><li>${esc(w("买入信托权益", "Acquire trust interests"))}</li><li>${esc(w("转换为股票", "Convert to shares"))}</li><li>${esc(w("转售获利", "Resell for profit"))}</li></ol><div class="thiel-passport">${caption(w("瑞士居民 Thiel", "Thiel · Swiss resident"), w("一次商业活动也可构成协定中的企业", "An isolated commercial venture can constitute an enterprise"))}${seal(w("澳大利亚常设机构：无", "Australian permanent establishment: none"), false)}</div></div>`;
  }

  function cases(s) {
    const titles = ["Crown Forest", "Prévost Car", "Thiel"];
    const cad = value => "CA$" + n(value);
    let scene = [crownScene, prevostScene, thielScene][s.current]();
    const conditions = [
      w("美国办事处与美国有限纳税义务，未满足协定居民条件。", "A US office and limited US tax liability do not establish treaty residence."),
      w("荷兰公司拥有股息的使用与支配权，且无自动转付义务。", "The Dutch company controls use of the dividend and has no automatic onward-payment obligation."),
      w("交易属于企业营业利润，澳瑞协定第 7 条限制澳大利亚征税权。", "The transaction generates enterprise business profits; Article 7 of the Australia–Switzerland treaty restricts Australian taxing rights."),
    ];
    const active = `<ol class="case-stage-ribbon">${[w("国内法", "Domestic law"), w("协定条件", "Treaty condition"), w("裁判", "Decision")].map((label, i) => `<li${i === s.step ? ' aria-current="step"' : ""}>${esc(label)}</li>`).join("")}</ol>`;
    if (s.step >= 1) scene += `<div class="case-rule-stamp">${seal(conditions[s.current], s.current !== 0)}</div>`;
    if (s.current === 2) {
      if (s.step === 0) scene += note(w("国内法起点：澳大利亚拟对该笔短期转让利润征税。", "Domestic-law starting point: Australia seeks to tax the short-term gain."));
      if (s.step === 2) scene += `<div class="case-decision" data-case-result="no-australian-tax"><strong>${esc(w("澳大利亚不得对案涉营业利润征税", "Australia may not tax the business profit at issue"))}</strong><span>${esc(w("法律依据：澳瑞协定第 7 条；OECD 评注用于解释。", "Legal basis: treaty Article 7; OECD commentary assists interpretation."))}</span></div>`;
    } else if (!s.calculation) {
      scene += note(w("等待有效金额", "Waiting for a valid amount"));
    } else {
      const c = s.calculation;
      const tax = s.current === 0 || s.step === 0 ? c.baseline / 100 : c.alternative / 100;
      const rate = s.current === 0 || s.step === 0 ? 25 : 5;
      scene += `<div class="case-tax-assessment"><div class="case-rate-stamp">${rate}%</div><div>${measure(s.current === 0 ? w("租金总额", "Gross rent") : w("股息总额", "Gross dividend"), cad(c.value), "caseGross", c.value)}${measure(s.step === 0 ? w("国内法基准税额", "Domestic-law baseline tax") : w("案涉条件下的税额", "Tax under the case conditions"), cad(tax), "caseTax", tax)}</div></div>`;
      if (s.current === 0 && s.step === 2) scene += `<div class="case-assessment-difference">${measure(w("假设已扣 10%", "Assumed 10% already withheld"), cad(c.alternative / 100), "withheld", c.alternative / 100)}${measure(w("补足差额", "Additional withholding"), cad(c.difference / 100), "difference", c.difference / 100)}</div>`;
      if (s.current === 1 && s.step === 2) scene += note(w("教学比较的 25% 基准与 5% 协定税额相差 ", "The teaching comparison between the 25% baseline and 5% treaty tax differs by ") + cad(c.difference / 100));
    }
    paint("cases", titles[s.current] + " · " + s.stepTitle, active + scene);
  }

  TaxPixel.registerLessons({ remote, labor, withholding, cases });
})();
