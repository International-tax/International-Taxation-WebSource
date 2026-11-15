(function () {
  "use strict";

  const K = TaxPixel.lessonKit;
  const { words, number, pct, esc, R, G, T, person, desk, building, factory, house, coin, hArrow, vArrow, C } = K;

  function svg(body, label, width = 600, height = 260, className = "") {
    return `<svg class="jurisdiction-art ${className}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${esc(label)}" shape-rendering="crispEdges">${body}</svg>`;
  }

  function documentArt(x, y, width, height, color, sealed = false) {
    let body = R(x + 5, y + 5, width, height, C.line) + R(x, y, width, height, C.white) + R(x, y, width, 7, color);
    for (let row = 22; row < height - 20; row += 14) body += R(x + 13, y + row, width - 27 - (row % 3) * 5, 3, C.sandDark);
    if (sealed) body += `<circle cx="${x + width - 24}" cy="${y + height - 25}" r="14" fill="none" stroke="${color}" stroke-width="4"/>` + R(x + width - 30, y + height - 29, 12, 8, color);
    return body;
  }

  function countCalendar(days, color, factor, label) {
    let body = R(6, 8, 150, 144, C.line) + R(0, 0, 150, 144, C.paper) + R(0, 0, 150, 25, color);
    body += R(20, -3, 6, 15, C.ink) + R(124, -3, 6, 15, C.ink);
    for (let day = 0; day < 366; day++) {
      body += R(12 + (day % 18) * 7, 34 + Math.floor(day / 18) * 4.8, 4, 3, day < days ? color : C.sand);
    }
    return `<figure class="residence-calendar" data-days="${days}" data-factor="${factor}">${svg(body, label + ": " + number(days), 160, 158)}<figcaption><span>${esc(label)}</span><strong>${number(days)} <small>× ${esc(factor)}</small></strong></figcaption></figure>`;
  }

  function residence(s) {
    const pass31 = s.d0 >= 31;
    const pass183 = s.weighted >= 183;
    const statusPriority = s.usStatus !== "none";
    let sequence = "";
    if (s.noDomicileResident) {
      for (let year = 1; year <= s.cnYears; year++) {
        sequence += `<li class="${s.cnBreak30 ? "year-expired" : "year-complete"}"><span>${year}</span><small>${esc(words("此前", "Prior"))}</small></li>`;
      }
      sequence += `<li class="year-current"><span>${s.cnBreak30 ? 1 : s.cnYears + 1}</span><small>${esc(words("当年", "Current"))}</small></li>`;
      sequence = `<section class="residence-years"><h3>${esc(words("无住所个人的连续年度", "Consecutive years without Chinese domicile"))}</h3><ol>${sequence}</ol><p>${esc(s.cnBreak30 ? words("单次离境超过 30 天，连续年度重新计算；当年仍符合居民标准。", "A single absence over 30 days restarts the sequence; current-year residence still applies.") : words("深色折页为当年。连续年度影响境外来源、境外支付所得的免税范围。", "The dark page marks the current year. The sequence affects relief for foreign-source income paid from abroad."))}</p></section>`;
    }
    const body = `<div class="residence-desk">
      <section class="residence-cn"><header><span class="jurisdiction-code">CN</span><h3>${esc(words("中国 · 住所与年度天数", "China · Domicile and annual presence"))}</h3></header>
        <div class="residence-cn-record">${countCalendar(s.cnDays, C.rust, "1", words("当年累计天数", "Current-year days"))}
          <div class="residence-domicile"><span>${esc(words("住所标准", "Domicile test"))}</span><strong class="${s.cnDomicile ? "test-met" : "test-pending"}">${esc(s.cnDomicile ? words("成立", "Met") : words("未成立", "Not met"))}</strong><p>${esc(s.cnDomicile ? words("住所标准直接确定居民身份。", "Domicile establishes residence directly.") : words("当年累计满 183 天进入居民判断。", "183 current-year days establish residence."))}</p><p class="${s.cnDays >= 183 ? "test-met" : "test-pending"}">${number(s.cnDays)} / 183 ${esc(words("天", "days"))}</p><b>${esc(s.cnResult)}</b></div>
        </div>
        <p class="residence-calendar-caption">${esc(words("每个短划表示累计 1 天。", "Each mark represents one accumulated day."))}</p>
      </section>
      <section class="residence-us"><header><span class="jurisdiction-code">US</span><h3>${esc(words("美国 · 三年加权计数", "United States · Three-year weighting"))}</h3></header>
        <div class="residence-calendar-trio">${countCalendar(s.d0, C.blueDark, "1", words("当年", "Current year"))}${countCalendar(s.d1, C.blue, "1/3", words("前一年", "Prior year"))}${countCalendar(s.d2, C.blueLight, "1/6", words("前两年", "Second prior year"))}</div>
        <div class="residence-sum" data-weighted="${s.weighted}"><span>${number(s.d0)} + ${number(s.d1)} ÷ 3 + ${number(s.d2)} ÷ 6</span><strong>= ${number(s.weighted)} <small>${esc(words("加权天数", "weighted days"))}</small></strong></div>
        <div class="residence-gates${statusPriority ? " status-priority" : ""}"><span data-met="${pass31}" class="${pass31 ? "test-met" : "test-failed"}">${pass31 ? "✓" : "×"} ${esc(words("当年 ≥ 31 天", "Current year ≥ 31 days"))}</span><b>＋</b><span data-met="${pass183}" class="${pass183 ? "test-met" : "test-failed"}">${pass183 ? "✓" : "×"} ${esc(words("加权 ≥ 183 天", "Weighted total ≥ 183 days"))}</span></div>
        <div class="residence-us-outcome"><strong>${esc(s.usResult)}</strong><p>${esc(s.usBasis)}</p></div>
      </section>
    </div>${sequence}<p class="jurisdiction-explanation">${esc(s.scope)}</p>
    <section class="residence-treaty" data-dual="${s.dual}"><header><h3>${esc(words("协定加比顺序", "Treaty tie-breaker sequence"))}</h3><strong>${esc(s.dual ? words("双重居民：启动加比", "Dual residence: tie-breaker applies") : words("未形成双重居民", "No dual residence"))}</strong></header>
      <ol class="residence-tie-path">${s.steps.map((step, index) => `<li data-state="${esc(step.state)}"><span class="tie-stop">${index + 1}</span><div><b>${esc(step.name)}</b><span>${esc(step.result)}</span></div></li>`).join("")}</ol><p class="residence-treaty-outcome">${esc(s.treatyOutcome)}</p>${s.warning ? `<p class="jurisdiction-explanation">${esc(s.warning)}</p>` : ""}
    </section>`;
    K.paint("residence", words("日历计数、居民身份与协定归属", "Presence calendars, residence and treaty allocation"), body);
  }

  function boardroom() {
    let body = R(25, 24, 310, 196, C.sand) + R(35, 34, 290, 176, C.paper);
    body += R(114, 78, 132, 80, C.rustDark) + R(120, 72, 120, 80, C.sandDark) + R(132, 87, 96, 48, C.cream);
    body += R(77, 93, 28, 42, C.blueDark) + R(255, 93, 28, 42, C.greenDark);
    body += person(152, 17, .8, { shirt: "blue", hair: "short" }) + person(153, 148, .8, { shirt: "rust", hair: "bob" });
    body += documentArt(143, 95, 32, 34, C.blue) + documentArt(190, 99, 24, 29, C.rust);
    return svg(body, words("董事会桌上汇集战略、管理和档案证据", "Boardroom table brings together strategy, management and records"), 360, 240);
  }

  function evidence(label, place, role) {
    return `<div class="enterprise-evidence enterprise-${role}"><small>${esc(label)}</small><strong>${esc(place)}</strong></div>`;
  }

  function enterprise(s) {
    const applies = s.acquire && !s.substantial;
    const certificate = svg(documentArt(40, 15, 140, 170, C.blueDark, true), words("企业注册证", "Certificate of incorporation"), 220, 210);
    const body = `<div class="enterprise-archive">
      <section class="enterprise-certificate">${certificate}<h3>${esc(words("注册证上的成立地", "Place of incorporation"))}</h3><strong>${esc(s.inc)}</strong><p>${esc(s.usResult)}</p></section>
      <section class="enterprise-board"><h3>${esc(words("实际管理证据汇集", "Evidence of actual management"))}</h3>
        ${evidence(words("战略决策", "Strategic decisions"), s.strategy, "strategy")}
        ${evidence(words("高管履职", "Senior management"), s.management, "management")}
        <div class="enterprise-board-art">${boardroom()}</div>
        ${evidence(words("账簿档案", "Books and records"), s.records, "records")}
        ${evidence(words("董事会作用", "Board's role"), s.rubber ? words("形式批准", "Formal approval") : words("实质审批", "Substantive review"), "approval")}
      </section>
    </div>
    <div class="enterprise-residence-verdict"><span>${esc(s.cnResult)}</span><strong>${esc(s.usResident && s.chinaResident ? words("出现双重居民线索", "Dual-residence indicators") : words("未同时出现两国居民线索", "No simultaneous residence indicators"))}</strong></div>
    <section class="enterprise-ownership"><header><h3>${esc(words("倒置规则按延续所有权比例分档适用", "Inversion rules apply different ownership thresholds"))}</h3><strong>${pct(s.own)}</strong></header>
      <div class="ownership-tree"><div class="ownership-former">${svg(documentArt(12, 6, 60, 74, C.blue, true) + documentArt(38, 24, 60, 74, C.blueDark, true), words("原美国所有者的股权凭证", "Equity certificates of former US owners"), 120, 110)}<b>${esc(words("原美国所有者", "Former US owners"))}</b></div>
        <div class="ownership-link"><strong>${pct(s.own)}</strong><span>${esc(words("计入股份", "counted stock"))}</span><i aria-hidden="true">↓</i></div>
        <div class="ownership-parent">${svg(building(24, 16, 108, 72, C.green), words("外国母公司", "Foreign parent"), 160, 100)}<b>${esc(words("新外国母公司", "New foreign parent"))}</b></div>
        <div class="ownership-link"><span>${esc(s.acquire ? words("取得绝大部分财产", "Acquires substantially all assets") : words("资产取得前提未成立", "Acquisition premise not met"))}</span><i aria-hidden="true">↓</i></div>
        <div class="ownership-business">${svg(factory(20, 5, .9), words("原美国实体业务", "Business of the former US entity"), 150, 95)}<b>${esc(words("原美国实体业务", "Former US entity business"))}</b></div>
      </div>
      <div class="ownership-scale" data-value="${s.own}" data-applicable="${applies}" role="img" aria-label="${esc(words("延续所有权 ", "Continuing ownership ") + pct(s.own) + "; " + s.status)}"><div class="ownership-rail"><i style="left:${s.own}%"></i><b style="left:60%"></b><b style="left:80%"></b></div><div class="ownership-ticks"><span>0%</span><span>60%</span><span>80%</span><span>100%</span></div></div>
      <div class="ownership-regimes"><span data-active="${applies && s.own < 60}"><b>&lt;60%</b>${esc(words("低于所有权门槛", "Below the ownership threshold"))}</span><span data-active="${applies && s.own >= 60 && s.own < 80}"><b>60%–&lt;80%</b>${esc(words("特别限制", "Special restrictions"))}</span><span data-active="${applies && s.own >= 80}"><b>≥80%</b>${esc(words("国内公司后果", "Domestic-corporation treatment"))}</span></div>
      <strong class="enterprise-inversion-result">${esc(s.status)}</strong><p class="jurisdiction-explanation">${esc(s.detail)}</p>
    </section>`;
    K.paint("enterprise", words("注册证、管理现场与股权结构", "Incorporation papers, management and ownership"), body);
  }

  function pin(x, y, label, active = true) {
    const color = active ? C.rustDark : C.muted;
    return G(x, y, 1, R(5, 0, 22, 4, color) + R(0, 4, 32, 22, color) + R(5, 26, 22, 5, color) + R(10, 31, 12, 5, color) + R(14, 36, 4, 5, color) + T(16, 21, label, { size: 16, color: C.white }));
  }

  function crate(x, y, scale = 1) {
    return G(x, y, scale, R(0, 0, 50, 39, C.sandDark) + R(4, 4, 42, 31, C.gold) + R(22, 0, 6, 39, C.cream) + R(7, 14, 12, 3, C.rustDark));
  }

  function machine(x, y) {
    return G(x, y, 1, R(0, 14, 108, 72, C.blue) + R(8, 0, 92, 20, C.blueDark) + R(12, 31, 47, 31, C.cream) + R(69, 28, 23, 9, C.greenLight) + R(69, 46, 8, 8, C.rust) + R(84, 46, 8, 8, C.gold) + R(8, 86, 12, 10, C.ink) + R(88, 86, 12, 10, C.ink));
  }

  function copyrightWork(x, y) {
    return G(x, y, 1, R(0, 0, 100, 72, C.blueDark) + R(6, 6, 88, 58, C.blueLight) + R(39, 72, 22, 13, C.ink) + R(20, 85, 60, 6, C.ink) + '<circle cx="50" cy="34" r="20" fill="' + C.cream + '"/>' + T(50, 42, "©", { size: 25, color: C.rustDark }));
  }

  function focus(x, y, width, height, active) {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="none" stroke="${active ? C.rust : C.line}" stroke-width="${active ? 4 : 2}" stroke-dasharray="${active ? "none" : "7 7"}"/>`;
  }

  function sourceFact(index, name, value, active) {
    return `<div class="source-scene-fact${active ? " is-source-factor" : ""}"><span>${index}</span><div><small>${esc(name)}</small><strong>${esc(value)}</strong></div></div>`;
  }

  function source(s) {
    let art = "";
    let facts = "";
    let subtitle = "";
    const location = s.locations;
    if (s.type === "service") {
      art = R(32, 41, 345, 181, C.sand) + R(42, 51, 325, 161, C.paper) + R(50, 59, 90, 72, C.blueLight) + R(92, 59, 6, 72, C.white) + R(50, 93, 90, 5, C.white) + desk(142, 120, 1.5) + person(116, 83, 1.6, { shirt: "blue", hair: "bob" }) + pin(52, 150, "1") + documentArt(440, 77, 95, 118, C.gold, true) + hArrow(422, 325, 184, C.gold, true) + coin(382, 162, 1.2) + pin(536, 56, "2", false);
      facts = sourceFact(1, words("实际履行地", "Where services are performed"), location.activity, true) + sourceFact(2, words("付款人所在地", "Payer location"), location.payer, false);
      subtitle = words("咨询服务在办公现场完成", "Consulting services are performed at the workplace");
    } else if (s.type === "interest") {
      art = documentArt(52, 67, 104, 134, C.gold, true) + building(395, 96, 126, 105, C.blue) + hArrow(175, 374, 93, C.gold) + hArrow(374, 175, 177, C.rust) + coin(270, 148, 1.3) + pin(525, 49, "1");
      facts = sourceFact(1, words("债务人或负担主体", "Debtor or cost-bearing entity"), location.payer, true);
      subtitle = words("金色箭头：本金流向债务人；棕色箭头：利息返回出借人。", "Gold arrow: principal flows to the debtor. Brown arrow: interest returns to the lender.");
    } else if (s.type === "dividend") {
      art = building(238, 36, 124, 80, C.green) + pin(379, 18, "1") + vArrow(300, 121, 155, C.gold) + R(118, 156, 364, 3, C.gold);
      [100, 270, 440].forEach((x) => { art += vArrow(x + 30, 157, 179, C.gold) + documentArt(x, 184, 63, 55, C.blue, false) + coin(x + 20, 164, .7); });
      facts = sourceFact(1, words("分配股息的企业", "Dividend-distributing company"), location.company, true);
      subtitle = words("公司将利润分配给股东", "The company distributes its profits to shareholders");
    } else if (s.type === "rent") {
      art = R(45, 194, 350, 5, C.line) + machine(144, 76) + pin(75, 43, "1") + documentArt(411, 66, 104, 133, C.green, true) + hArrow(390, 280, 126, C.gold, true) + coin(332, 101, 1.1);
      facts = sourceFact(1, words("财产实际使用地", "Place where the property is used"), location.use, true);
      subtitle = words("租金对应资产的使用地点", "Rent follows the location of the asset's use");
    } else if (s.type === "royalty") {
      const payerRule = s.rules === "ce";
      art = documentArt(43, 72, 90, 126, C.green, true) + hArrow(149, 238, 115, C.blue) + copyrightWork(256, 78) + documentArt(454, 94, 82, 108, C.rust, true) + hArrow(436, 375, 167, C.gold) + coin(395, 141, 1) + focus(238, 60, 136, 134, !payerRule) + focus(437, 76, 116, 143, payerRule) + pin(258, 10, "1", !payerRule) + pin(474, 24, "2", payerRule);
      facts = sourceFact(1, words("权利使用地", "Place where rights are used"), location.use, !payerRule) + sourceFact(2, words("费用负担主体", "Entity bearing the royalty"), location.payer, payerRule);
      subtitle = words("许可使用与费用负担分属两个联结", "Licensed use and the cost-bearing entity are separate connecting factors");
    } else if (s.type === "real") {
      art = '<path d="M120 205 L275 125 L451 200 L298 253 Z" fill="' + C.greenLight + '" stroke="' + C.greenDark + '" stroke-width="3"/>' + house(222, 37, 2.1, C.rust) + pin(365, 106, "1") + documentArt(48, 71, 84, 116, C.gold, true);
      facts = sourceFact(1, words("不动产所在地", "Location of the immovable property"), location.property, true);
      subtitle = words("土地与建筑物所在的地点", "The place where the land and building are situated");
    } else if (s.type === "equity") {
      const companyRule = s.rules === "ce", sellerRule = s.rules === "us";
      art = documentArt(51, 99, 96, 110, C.blue, true) + hArrow(161, 250, 164, C.gold) + documentArt(271, 118, 66, 80, C.green, true) + building(426, 92, 115, 98, C.green) + focus(34, 82, 130, 144, sellerRule) + focus(251, 99, 105, 115, !companyRule && !sellerRule) + focus(411, 74, 146, 135, companyRule) + pin(80, 28, "2", sellerRule) + pin(286, 41, "3", !companyRule && !sellerRule) + pin(466, 20, "1", companyRule);
      facts = sourceFact(1, words("被投资企业", "Invested company"), location.company, companyRule) + sourceFact(2, words("转让人居民身份", "Seller's residence"), location.seller, sellerRule) + sourceFact(3, words("转让地点", "Place of transfer"), location.sale, !companyRule && !sellerRule);
      subtitle = words("股权转让采用所选法律的联结因素", "Share transfers follow the connecting factor under the selected law");
    } else if (s.type === "purchased") {
      art = R(42, 65, 139, 7, C.rustDark) + R(42, 125, 139, 7, C.rustDark) + R(42, 185, 139, 7, C.rustDark) + R(42, 65, 8, 138, C.sandDark) + R(173, 65, 8, 138, C.sandDark) + crate(59, 81, .8) + crate(114, 81, .8) + crate(59, 141, .8) + hArrow(205, 384, 150, C.blue) + crate(277, 103, .8) + building(417, 102, 118, 96, C.green) + R(409, 89, 134, 18, C.rust) + pin(457, 32, "1");
      facts = sourceFact(1, words("销售或交易活动地", "Place of sale or trading activity"), location.sale, true);
      subtitle = words("购入的货物进入销售交易", "Purchased goods enter the sales transaction");
    } else if (s.type === "produced") {
      const productionRule = s.rules === "us";
      art = factory(42, 72, 1.1) + R(185, 163, 176, 14, C.ink) + R(194, 177, 8, 30, C.sandDark) + R(341, 177, 8, 30, C.sandDark) + crate(207, 124, .8) + crate(277, 124, .8) + hArrow(370, 422, 155, C.blue) + building(451, 111, 96, 86, C.green) + focus(28, 56, 335, 158, productionRule) + focus(437, 92, 123, 124, !productionRule) + pin(108, 10, "1", productionRule) + pin(482, 38, "2", !productionRule);
      facts = sourceFact(1, words("生产活动", "Production activity"), productionRule ? s.segments.map((part) => part.name + " " + pct(part.share)).join(" / ") : words("结合生产事实", "Consider production facts"), productionRule) + sourceFact(2, words("交易活动地", "Trading activity"), location.sale, !productionRule);
      subtitle = words("自产货物经过生产与销售两个环节", "Self-produced goods pass through production and sale");
    } else throw new RangeError("Unknown source scene: " + s.type);

    const result = s.segments.map((part) => `<span data-location="${esc(part.location)}" data-share="${part.share}"><b>${esc(part.name)}</b><strong>${pct(part.share)}</strong></span>`).join("");
    K.paint("source", s.typeName + " · " + s.connection,
      `<section class="source-world source-world-${s.type}" data-income-type="${esc(s.type)}" data-rules="${esc(s.rules)}"><p class="source-law">${esc(s.ruleName)}</p>${svg(art, subtitle)}<p class="source-scene-caption">${esc(subtitle)}</p><div class="source-scene-facts">${facts}</div><div class="source-allocation" aria-label="${esc(words("所得来源分配", "Income-source allocation"))}">${result}</div><p class="jurisdiction-explanation">${esc(s.rule)}</p></section>`);
  }

  TaxPixel.registerLessons({ residence, enterprise, source });
})();
