(() => {
  const form = document.querySelector("#scenario");
  const byId = (id) => document.getElementById(id);
  const numericIds = ["cnDays", "cnYears", "usD0", "usD1", "usD2"];
  const text = (id, value) => {
    byId(id).textContent = value;
  };
  const status = (id, value, state = "") => {
    byId(id).className = `sim-status ${state}`.trim();
    text(id, value);
  };
  const country = { cn: "中国", us: "美国" };
  const homeLabels = {
    both: "两国均有",
    cn: "仅中国",
    us: "仅美国",
    neither: "两国均无",
  };
  const vitalLabels = { cn: "中国", us: "美国", unclear: "无法确定" };
  const abodeLabels = { cn: "中国", us: "美国", both: "两国均有或均无" };
  const nationLabels = { cn: "中国", us: "美国", other: "第三国或无国籍" };
  const tieSteps = [
    [1, "tieStepHome", "tieHomeResult"],
    [2, "tieStepVital", "tieVitalResult"],
    [3, "tieStepAbode", "tieAbodeResult"],
    [4, "tieStepNation", "tieNationResult"],
    [5, "tieStepMap", "tieMapResult"],
  ];

  function clearResults() {
    TaxPixel.clear("residence");
    [
      "cnResult",
      "cnBasis",
      "usResult",
      "usBasis",
      "dualResult",
      "sixYearIdentity",
      "sixYearCount",
      "sixYearScope",
      "sptFormula",
      "spt31",
      "spt183",
      "sptResult",
      "closerStatus",
      "treatyOutcome",
      "tieHomeResult",
      "tieVitalResult",
      "tieAbodeResult",
      "tieNationResult",
      "tieMapResult",
    ].forEach((id) => text(id, "—"));
    text("dualNote", "请先填写有效天数。");
    text("cnScopeNote", "请输入完整事实后判断所得范围。");
    text("treatyDetail", "完成输入后显示加比路径。");
    text("treatyWarning", "");
    ["cnBasis", "spt31", "spt183", "sptResult", "closerStatus"].forEach((id) => {
      byId(id).className = "sim-status neutral";
    });
    ["sptCurrentSegment", "sptPriorSegment", "sptEarlierSegment"].forEach((id) => {
      byId(id).style.width = "0";
    });
    byId("sptMeter").setAttribute("aria-valuenow", "0");
    tieSteps.forEach(([, stepId]) => byId(stepId).setAttribute("data-state", "standby"));
  }

  function resolveTie() {
    const home = byId("tbHome").value;
    const vital = byId("tbVital").value;
    const abode = byId("tbAbode").value;
    const nation = byId("tbNation").value;
    if (home === "cn" || home === "us") {
      return {
        winner: home,
        stop: 1,
        outcome: `${country[home]}税收居民`,
        detail: `永久性住所仅在${country[home]}，第1步即确定协定居民身份。`,
      };
    }
    if (home === "both" && (vital === "cn" || vital === "us")) {
      return {
        winner: vital,
        stop: 2,
        outcome: `${country[vital]}税收居民`,
        detail: `两国均有永久性住所；重要利益中心在${country[vital]}，于第2步确定。`,
      };
    }
    if (abode === "cn" || abode === "us") {
      const prefix =
        home === "both" ? "永久住所与重要利益中心均未决出；" : "两国均无永久性住所；";
      return {
        winner: abode,
        stop: 3,
        outcome: `${country[abode]}税收居民`,
        detail: `${prefix}经常居所指向${country[abode]}，于第3步确定。`,
      };
    }
    if (nation === "cn" || nation === "us") {
      return {
        winner: nation,
        stop: 4,
        outcome: `${country[nation]}税收居民`,
        detail: `前三层均未能确定归属；依${country[nation]}国籍于第4步确定。`,
      };
    }
    return {
      winner: "map",
      stop: 5,
      outcome: "主管当局相互协商（MAP）",
      detail: "前四层均未决出，由中美主管当局通过相互协商程序确定。",
    };
  }

  function update() {
    const fields = numericIds.map(byId);
    fields.forEach((field) => {
      field.setAttribute(
        "aria-invalid",
        String(field.value.trim() === "" || !field.validity.valid),
      );
    });
    let error = "";
    if (fields.some((field) => field.value.trim() === "")) {
      error = "请填写全部天数与年度数。";
    } else if (fields.some((field) => !field.validity.valid)) {
      error = "请使用范围内的整数：天数为0–366，此前年度数为0–15。";
    }
    const errorNode = byId("form-error");
    errorNode.hidden = !error;
    errorNode.textContent = error;
    if (error) {
      clearResults();
      return;
    }

    const cnDomicile = byId("cnDomicile").value === "yes";
    const cnDays = Number(byId("cnDays").value);
    const cnYears = Number(byId("cnYears").value);
    const cnBreak30 = byId("cnBreak30").checked;
    const usStatus = byId("usStatus").value;
    const d0 = Number(byId("usD0").value);
    const d1 = Number(byId("usD1").value);
    const d2 = Number(byId("usD2").value);
    const wantsCloser = byId("usCloser").checked;
    if (usStatus === "citizen") byId("tbNation").value = "us";

    const cnResident = cnDomicile || cnDays >= 183;
    text("cnResult", cnResident ? "中国税收居民" : "中国非居民");
    status(
      "cnBasis",
      cnDomicile
        ? `住所标准成立 · 当年 ${cnDays} 天`
        : `${cnDays} / 183 天 · ${cnResident ? "达到门槛" : "未达门槛"}`,
      cnResident ? "" : "neutral",
    );
    const noDomicileResident = !cnDomicile && cnResident;
    const sixYearRelief = noDomicileResident && (cnBreak30 || cnYears < 6);
    text("sixYearIdentity", cnDomicile ? "有住所居民" : cnResident ? "无住所居民" : "非居民");
    if (!noDomicileResident) {
      text("sixYearCount", "不适用");
      text("sixYearScope", "不适用");
      text(
        "cnScopeNote",
        cnDomicile
          ? "有住所居民原则上就境内外所得纳税；无住所个人的六年规则不适用。"
          : "无住所且当年不满183天，仅承担中国来源所得的有限纳税义务。",
      );
    } else {
      const currentSequence = cnBreak30 ? 1 : cnYears + 1;
      text(
        "sixYearCount",
        cnBreak30 ? `离境超过30天 · 重置为第1年` : `此前 ${cnYears} 年 · 当前第 ${currentSequence} 年`,
      );
      text("sixYearScope", sixYearRelief ? "备案后免税" : "纳入中国征税");
      text(
        "cnScopeNote",
        sixYearRelief
          ? `当年仍是中国居民；境外来源且由境外单位或个人支付的所得可按规定备案免税，境外来源但境内支付的所得不在此项免税范围内。${cnBreak30 ? "单次离境超过30天已使连续年限重新计算。" : ""}`
          : "此前已连续六年满183天，且未发生超过30天的单次离境重置；本年度的境外所得不再适用该项境外支付免税。",
      );
    }

    const weightedTimes6 = d0 * 6 + d1 * 2 + d2;
    const weighted = weightedTimes6 / 6;
    const pass31 = d0 >= 31;
    const pass183 = weightedTimes6 >= 183 * 6;
    const sptPass = pass31 && pass183;
    const closerException = usStatus === "none" && sptPass && wantsCloser && d0 < 183;
    const usResident = usStatus !== "none" || (sptPass && !closerException);
    text(
      "usResult",
      usStatus === "citizen"
        ? "美国公民"
        : usResident
          ? "美国居民外国人"
          : "美国非居民外国人",
    );
    if (usStatus === "citizen") {
      text("usBasis", "公民身份直接产生美国全球所得纳税义务，无需通过SPT。");
    } else if (usStatus === "greencard") {
      text("usBasis", "绿卡测试成立；实际在美天数不改变这一国内法结论。");
    } else if (!pass31) {
      text("usBasis", `当年 ${d0} 天，未过31天门槛；加权结果不改变结论。`);
    } else if (!pass183) {
      text("usBasis", `当年门槛已通过，但加权 ${weighted.toFixed(1)} 天未达183天。`);
    } else if (closerException) {
      text("usBasis", `SPT双门槛虽通过；当年 ${d0} 天少于183天，较密切联系例外适用。`);
    } else if (wantsCloser && d0 >= 183) {
      text("usBasis", `SPT通过；当年已达 ${d0} 天，较密切联系例外不可使用。`);
    } else {
      text("usBasis", `当年 ${d0} 天且加权 ${weighted.toFixed(1)} 天，双门槛均通过。`);
    }

    text("sptFormula", `${d0} + ${d1} × 1/3 + ${d2} × 1/6 = ${weighted.toFixed(1)} 天`);
    const scale = Math.max(250, weighted);
    byId("sptCurrentSegment").style.width = `${(d0 / scale) * 100}%`;
    byId("sptPriorSegment").style.width = `${(d1 / 3 / scale) * 100}%`;
    byId("sptEarlierSegment").style.width = `${(d2 / 6 / scale) * 100}%`;
    byId("sptThreshold").style.left = `${(183 / scale) * 100}%`;
    byId("sptMeter").setAttribute("aria-valuemax", String(scale));
    byId("sptMeter").setAttribute("aria-valuenow", String(weighted));
    byId("sptMeter").setAttribute("aria-valuetext", `${weighted.toFixed(1)} 天，门槛183天`);
    text("sptScaleMax", `${Number(scale.toFixed(1))} 天`);
    status("spt31", `当年 ${d0} / 31 天 · ${pass31 ? "通过" : "未通过"}`, pass31 ? "" : "fail");
    status(
      "spt183",
      `加权 ${weighted.toFixed(1)} / 183 天 · ${pass183 ? "通过" : "未通过"}`,
      pass183 ? "" : "fail",
    );
    status(
      "sptResult",
      usStatus === "citizen" ? "公民身份优先" : usStatus === "greencard" ? "绿卡测试优先" : sptPass ? "SPT通过" : "SPT未通过",
      usStatus === "none" && !sptPass ? "fail" : "neutral",
    );
    if (usStatus !== "none") {
      status("closerStatus", wantsCloser ? "公民或绿卡不适用该例外" : "较密切联系例外不适用", "neutral");
    } else if (closerException) {
      status("closerStatus", "较密切联系例外适用", "");
    } else if (wantsCloser && sptPass && d0 >= 183) {
      status("closerStatus", "当年满183天 · 例外不可用", "fail");
    } else if (wantsCloser) {
      status("closerStatus", "SPT未通过 · 无需例外", "neutral");
    } else if (sptPass && d0 < 183) {
      status("closerStatus", "可核验较密切联系例外", "review");
    } else {
      status("closerStatus", "未主张较密切联系例外", "neutral");
    }

    const dual = cnResident && usResident;
    text(
      "dualResult",
      dual
        ? "中美双重居民"
        : cnResident
          ? "仅中国居民"
          : usResident
            ? "仅美国居民"
            : "两国均非居民",
    );
    text(
      "dualNote",
      dual
        ? "两国国内法结论发生冲突，进入下方协定加比。"
        : "未发生双重居民冲突，不启动协定个人加比。",
    );

    const tie = resolveTie();
    const home = byId("tbHome").value;
    const nodeValues = {
      tieHomeResult: homeLabels[home],
      tieVitalResult: vitalLabels[byId("tbVital").value],
      tieAbodeResult: abodeLabels[byId("tbAbode").value],
      tieNationResult: nationLabels[byId("tbNation").value],
      tieMapResult: "相互协商",
    };
    tieSteps.forEach(([index, stepId, resultId]) => {
      let state = "standby";
      let value = "备用";
      if (dual) {
        state = index < tie.stop ? "visited" : index === tie.stop ? "resolved" : "pending";
        value = index > tie.stop ? "未到此步" : nodeValues[resultId];
        if (index === 2 && home === "neither") {
          state = "skipped";
          value = "跳过";
        }
      }
      byId(stepId).setAttribute("data-state", state);
      text(resultId, value);
    });
    text("treatyOutcome", dual ? tie.outcome : "不启动加比");
    text(
      "treatyDetail",
      dual ? tie.detail : "只有中美两国国内法同时认定为居民时，才依顺序适用这些加比事实。",
    );
    if (dual && tie.winner === "cn" && usStatus === "citizen") {
      text(
        "treatyWarning",
        "Saving clause：美国保留对本国公民征税的权利。协定加比为中国居民，并不当然终止美国全球所得申报义务。",
      );
    } else if (dual && tie.winner === "cn" && usStatus === "greencard") {
      text(
        "treatyWarning",
        "绿卡提示：依协定主张中国居民待遇通常涉及 Form 8833 披露；若属于过去15年中8年持卡的长期居民，还应先评估美国第877A条退出税风险。",
      );
    } else {
      text("treatyWarning", "");
    }
    TaxPixel.update("residence", { cnDomicile, cnDays, cnYears, cnBreak30, noDomicileResident, usStatus, closerException, d0, d1, d2, weighted, dual,
      cnResult: byId("cnResult").textContent, usResult: byId("usResult").textContent,
      usBasis: byId("usBasis").textContent, scope: byId("cnScopeNote").textContent,
      treatyOutcome: byId("treatyOutcome").textContent, warning: byId("treatyWarning").textContent,
      steps: tieSteps.map(([index, stepId, resultId]) => ({
        name: ["永久性住所", "重要利益中心", "经常居所", "国籍", "相互协商"][index - 1],
        state: byId(stepId).dataset.state, result: byId(resultId).textContent,
      })),
    });
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
})();
