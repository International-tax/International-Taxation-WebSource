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
  const country = { cn: "China", us: "the United States" };
  const homeLabels = {
    both: "Both countries",
    cn: "China only",
    us: "United States only",
    neither: "Neither country",
  };
  const vitalLabels = { cn: "China", us: "United States", unclear: "Undetermined" };
  const abodeLabels = { cn: "China", us: "United States", both: "Both or neither" };
  const nationLabels = { cn: "China", us: "United States", other: "Third country or stateless" };
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
    text("dualNote", "Enter valid day counts to calculate.");
    text("cnScopeNote", "Complete the facts to determine the scope of taxable income.");
    text("treatyDetail", "Complete the inputs to display the tie-breaker path.");
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
        outcome: `Resident of ${country[home]}`,
        detail: `A permanent home is available only in ${country[home]}, so step 1 resolves residence.`,
      };
    }
    if (home === "both" && (vital === "cn" || vital === "us")) {
      return {
        winner: vital,
        stop: 2,
        outcome: `Resident of ${country[vital]}`,
        detail: `A permanent home is available in both countries; the centre of vital interests is in ${country[vital]}, resolving step 2.`,
      };
    }
    if (abode === "cn" || abode === "us") {
      const prefix =
        home === "both"
          ? "Permanent home and vital interests do not resolve the issue;"
          : "No permanent home is available in either country;";
      return {
        winner: abode,
        stop: 3,
        outcome: `Resident of ${country[abode]}`,
        detail: `${prefix} habitual abode points to ${country[abode]}, resolving step 3.`,
      };
    }
    if (nation === "cn" || nation === "us") {
      return {
        winner: nation,
        stop: 4,
        outcome: `Resident of ${country[nation]}`,
        detail: `The first three tests are inconclusive; nationality in ${country[nation]} resolves step 4.`,
      };
    }
    return {
      winner: "map",
      stop: 5,
      outcome: "Competent-authority resolution (MAP)",
      detail: "The first four tests are inconclusive. The Chinese and US competent authorities must resolve residence through MAP.",
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
      error = "Complete all day counts and the prior-year count.";
    } else if (fields.some((field) => !field.validity.valid)) {
      error = "Use whole numbers within range: 0–366 days and 0–15 prior years.";
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
    text("cnResult", cnResident ? "Chinese tax resident" : "Chinese nonresident");
    status(
      "cnBasis",
      cnDomicile
        ? `Domicile test met · ${cnDays} days this year`
        : `${cnDays} / 183 days · ${cnResident ? "Threshold met" : "Below threshold"}`,
      cnResident ? "" : "neutral",
    );
    const noDomicileResident = !cnDomicile && cnResident;
    const sixYearRelief = noDomicileResident && (cnBreak30 || cnYears < 6);
    text(
      "sixYearIdentity",
      cnDomicile ? "Resident with domicile" : cnResident ? "Resident without domicile" : "Nonresident",
    );
    if (!noDomicileResident) {
      text("sixYearCount", "Not applicable");
      text("sixYearScope", "Not applicable");
      text(
        "cnScopeNote",
        cnDomicile
          ? "A resident with domicile is generally taxable on Chinese and foreign income; the six-year rule for residents without domicile does not apply."
          : "Without domicile and with fewer than 183 days, the individual has limited liability on China-source income only.",
      );
    } else {
      const currentSequence = cnBreak30 ? 1 : cnYears + 1;
      text(
        "sixYearCount",
        cnBreak30
          ? "Absence over 30 days · reset to year 1"
          : `${cnYears} prior years · current year is No. ${currentSequence}`,
      );
      text("sixYearScope", sixYearRelief ? "Exempt upon filing" : "Taxable in China");
      text(
        "cnScopeNote",
        sixYearRelief
          ? `The individual is still a Chinese resident this year. Foreign-source income paid by a foreign person may be exempt upon filing; foreign-source income paid by a Chinese person is outside this exemption.${cnBreak30 ? " The single absence over 30 days restarts the consecutive-year count." : ""}`
          : "The individual completed six consecutive years with at least 183 days and has no reset from a single absence over 30 days. The foreign-paid exemption no longer applies to this year's foreign income.",
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
      usStatus === "citizen" ? "US citizen" : usResident ? "US resident alien" : "US nonresident alien",
    );
    if (usStatus === "citizen") {
      text("usBasis", "Citizenship creates worldwide US tax obligations without reference to the SPT.");
    } else if (usStatus === "greencard") {
      text("usBasis", "The green card test is met; actual US days do not change this domestic-law result.");
    } else if (!pass31) {
      text("usBasis", `Only ${d0} current-year days: the 31-day gate fails regardless of the weighted total.`);
    } else if (!pass183) {
      text("usBasis", `The 31-day gate passes, but ${weighted.toFixed(1)} weighted days fall below 183.`);
    } else if (closerException) {
      text("usBasis", `Both SPT gates pass, but the closer-connection exception applies because ${d0} current-year days are below 183.`);
    } else if (wantsCloser && d0 >= 183) {
      text("usBasis", `The SPT passes; ${d0} current-year days make the closer-connection exception unavailable.`);
    } else {
      text("usBasis", `Both gates pass: ${d0} current-year days and ${weighted.toFixed(1)} weighted days.`);
    }

    text("sptFormula", `${d0} + ${d1} × 1/3 + ${d2} × 1/6 = ${weighted.toFixed(1)} days`);
    const scale = Math.max(250, weighted);
    byId("sptCurrentSegment").style.width = `${(d0 / scale) * 100}%`;
    byId("sptPriorSegment").style.width = `${(d1 / 3 / scale) * 100}%`;
    byId("sptEarlierSegment").style.width = `${(d2 / 6 / scale) * 100}%`;
    byId("sptThreshold").style.left = `${(183 / scale) * 100}%`;
    byId("sptMeter").setAttribute("aria-valuemax", String(scale));
    byId("sptMeter").setAttribute("aria-valuenow", String(weighted));
    byId("sptMeter").setAttribute("aria-valuetext", `${weighted.toFixed(1)} days; threshold 183 days`);
    text("sptScaleMax", `${Number(scale.toFixed(1))} days`);
    status("spt31", `Current year ${d0} / 31 days · ${pass31 ? "Pass" : "Fail"}`, pass31 ? "" : "fail");
    status(
      "spt183",
      `Weighted ${weighted.toFixed(1)} / 183 days · ${pass183 ? "Pass" : "Fail"}`,
      pass183 ? "" : "fail",
    );
    status(
      "sptResult",
      usStatus === "citizen"
        ? "Citizenship takes priority"
        : usStatus === "greencard"
          ? "Green card test takes priority"
          : sptPass
            ? "SPT passed"
            : "SPT not passed",
      usStatus === "none" && !sptPass ? "fail" : "neutral",
    );
    if (usStatus !== "none") {
      status(
        "closerStatus",
        wantsCloser ? "Exception unavailable to citizens and green card holders" : "Closer-connection exception not applicable",
        "neutral",
      );
    } else if (closerException) {
      status("closerStatus", "Closer-connection exception applies", "");
    } else if (wantsCloser && sptPass && d0 >= 183) {
      status("closerStatus", "At least 183 current-year days · exception unavailable", "fail");
    } else if (wantsCloser) {
      status("closerStatus", "SPT not passed · exception unnecessary", "neutral");
    } else if (sptPass && d0 < 183) {
      status("closerStatus", "Closer-connection exception may be reviewed", "review");
    } else {
      status("closerStatus", "Closer-connection exception not claimed", "neutral");
    }

    const dual = cnResident && usResident;
    text(
      "dualResult",
      dual
        ? "Dual resident of China and the United States"
        : cnResident
          ? "Chinese resident only"
          : usResident
            ? "US resident only"
            : "Resident of neither country",
    );
    text(
      "dualNote",
      dual
        ? "The domestic-law results conflict, so the treaty tie-breaker applies below."
        : "There is no dual-residence conflict and no need for the individual treaty tie-breaker.",
    );

    const tie = resolveTie();
    const home = byId("tbHome").value;
    const nodeValues = {
      tieHomeResult: homeLabels[home],
      tieVitalResult: vitalLabels[byId("tbVital").value],
      tieAbodeResult: abodeLabels[byId("tbAbode").value],
      tieNationResult: nationLabels[byId("tbNation").value],
      tieMapResult: "Mutual agreement",
    };
    tieSteps.forEach(([index, stepId, resultId]) => {
      let state = "standby";
      let value = "Standby";
      if (dual) {
        state = index < tie.stop ? "visited" : index === tie.stop ? "resolved" : "pending";
        value = index > tie.stop ? "Not reached" : nodeValues[resultId];
        if (index === 2 && home === "neither") {
          state = "skipped";
          value = "Skipped";
        }
      }
      byId(stepId).setAttribute("data-state", state);
      text(resultId, value);
    });
    text("treatyOutcome", dual ? tie.outcome : "Tie-breaker not triggered");
    text(
      "treatyDetail",
      dual
        ? tie.detail
        : "These facts apply in order only when both countries treat the individual as resident under domestic law.",
    );
    if (dual && tie.winner === "cn" && usStatus === "citizen") {
      text(
        "treatyWarning",
        "Saving clause: the United States preserves its right to tax its citizens. A treaty outcome of Chinese residence does not itself end US worldwide filing obligations.",
      );
    } else if (dual && tie.winner === "cn" && usStatus === "greencard") {
      text(
        "treatyWarning",
        "Green card note: claiming Chinese treaty residence generally requires Form 8833 disclosure. A long-term resident with a green card in 8 of the past 15 years should first assess potential section 877A expatriation tax.",
      );
    } else {
      text("treatyWarning", "");
    }
    TaxPixel.update("residence", { cnDomicile, cnDays, cnYears, cnBreak30, noDomicileResident, usStatus, closerException, d0, d1, d2, weighted, dual,
      cnResult: byId("cnResult").textContent, usResult: byId("usResult").textContent,
      usBasis: byId("usBasis").textContent, scope: byId("cnScopeNote").textContent,
      treatyOutcome: byId("treatyOutcome").textContent, warning: byId("treatyWarning").textContent,
      steps: tieSteps.map(([index, stepId, resultId]) => ({
        name: ["Permanent home", "Centre of vital interests", "Habitual abode", "Nationality", "Mutual agreement"][index - 1],
        state: byId(stepId).dataset.state, result: byId(resultId).textContent,
      })),
    });
  }

  form.addEventListener("input", update);
  form.addEventListener("change", update);
  form.addEventListener("reset", () => setTimeout(update, 0));
  update();
})();
