(() => {
  "use strict";

  const cases = [
    {
      rateGuide: "25% domestic baseline · Assume 10% already withheld",
      labels: ["25% required", "10% assumed withheld", "Shortfall"],
      steps: [
        { title: "Domestic law: start with 25% withholding on rent", rule: "Section 212(1)(d) of Canada’s Income Tax Act sets a 25% withholding rate for the non-resident barge rent in this case.", reason: "Whether a treaty reduces that rate depends on the recipient’s residence status in the next step." },
        { title: "Treaty residence requires comprehensive tax liability", rule: "The 10% cap in Article XII of the Canada–US treaty requires US residence under Article IV. A management office alone is not enough.", reason: "Norsk had limited tax liability on US-connected business income, not full liability based on a residence connection." },
        { title: "Judgment: the 10% treaty cap does not apply", rule: "The Supreme Court held that Norsk was not a US resident for treaty purposes and restored the 25% domestic withholding assessment.", reason: "The shortfall is the 25% required less the 10% assumed already withheld." },
      ],
      question: "Does a US office by itself make a company a US resident under the Canada–US treaty?",
      answers: ["Yes, an office is enough", "No, full tax liability based on residence is required"],
      correct: 1,
      feedback: "Treaty residence turns on the legal basis for full tax liability, not an office or the tax actually paid.",
      detail: "The Court used the Canada–US treaty’s context and purpose and the OECD Model Commentary on residence to establish that Norsk had only limited liability on US-connected business income. The rent benefited from a US shipping exemption; treaty residence depended on the legal basis for tax liability. See judgment paragraphs 3–7 and 55–58.",
      sources: [["Crown Forest Industries Ltd. v. Canada (1995): Supreme Court judgment summary, paragraphs 3–7 and 55–58", "https://taxinterpretations.com/content/355006"], ["Supreme Court of Canada official docket: 23940", "https://scc-csc.gc.ca/cases-dossiers/search-recherche/23940/"]],
      takeaway: "Crown Forest: without treaty residence, the 10% treaty cap cannot replace the 25% domestic rate.",
    },
    {
      rateGuide: "25% domestic baseline · 5% treaty cap when conditions are met",
      labels: ["25% baseline", "5% treaty tax", "Treaty saving"],
      steps: [
        { title: "Domestic law: start with 25% withholding on dividends", rule: "For the relevant years, Canadian domestic law set a 25% baseline withholding rate on dividends paid to a non-resident shareholder.", reason: "This baseline measures the saving once the treaty conditions are satisfied." },
        { title: "Control of the dividend supports beneficial ownership", rule: "The 5% cap in Article 10 of the Canada–Netherlands treaty requires beneficial ownership, not an agent or conduit legally required to pass the income on automatically.", reason: "A later distribution does not itself prove a pre-existing duty to pass on the dividend." },
        { title: "Judgment: beneficial ownership applies and the rate falls to 5%", rule: "The Dutch company had its own balance sheet, owned the dividend as its property and had no legal duty to pass it automatically to its shareholders.", reason: "The operative treaty limits the domestic 25% rate to 5% within its scope." },
      ],
      question: "What was central to the Dutch company’s beneficial ownership?",
      answers: ["The dividend passed through its bank account", "It controlled the dividend and had no automatic pass-on duty"],
      correct: 1,
      feedback: "Control over the dividend and the absence of an automatic pass-on duty matter, not the bank account used.",
      detail: "The 25% rate is the domestic baseline used in the teaching comparison. In the litigation, the tax authority sought to treat the Swedish shareholder (15% under the Canada–Sweden treaty) and the UK shareholder (10% under the Canada–UK treaty) as beneficial owners. The Federal Court of Appeal used OECD Commentary on beneficial ownership and conduits and upheld the Dutch company’s status. See judgment paragraphs 3 and 16–19.",
      sources: [["Prévost Car Inc. v. Canada (2009): official Federal Courts reports, PDF page 80 onward; judgment paragraphs 3 and 16–19", "https://publications.gc.ca/collections/collection_2011/cmf-fja/JU1-2-2010-2-1.pdf#page=80"]],
      takeaway: "Prévost Car: residence and beneficial ownership allow the treaty to cap the 25% domestic baseline at 5%.",
    },
    {
      rateGuide: "Domestic tax → Treaty Article 7 → No permanent establishment",
      labels: ["", "", ""],
      steps: [
        { title: "Domestic law: the short-term gain is taxable", rule: "The Australian Commissioner assessed Thiel’s profit from buying a trust interest, converting it into shares and selling them shortly afterwards.", reason: "The next step is not an amount calculation, but whether an operative treaty limits Australia’s taxing rights." },
        { title: "A single commercial venture can constitute a treaty enterprise", rule: "Article 7 of the Australia–Switzerland treaty protects a Swiss enterprise’s business profits unless it carries on business through an Australian permanent establishment.", reason: "With no permanent establishment agreed, the meaning of ‘enterprise’ became decisive." },
        { title: "Judgment: Article 7 applies and Australia may not tax", rule: "The High Court used the 1977 OECD Model Commentary to hold that a commercial venture intended for resale profit could be an enterprise for treaty purposes.", reason: "The operative treaty’s Article 7 limits taxing rights; the Commentary is interpretive material." },
      ],
      question: "What role did the OECD Model and Commentary play in Thiel?",
      answers: ["Interpretive aids for the bilateral treaty", "A directly effective global tax code that independently removed the tax"],
      correct: 0,
      feedback: "The materials aided interpretation; the operative Australia–Switzerland treaty supplied the legal basis for the outcome.",
      detail: "Paragraphs 8–10 of the joint opinion of Mason CJ and others discuss enterprise and business profits using the treaty context and the 1977 OECD Commentary. Dawson J cites Sun Life and Ostime in paragraphs 8–10 of his opinion. McHugh J refers to Articles 31 and 32 of the Vienna Convention on the Law of Treaties in paragraphs 13 and 16, addressing the Model and Commentary as supplementary interpretive material. Each opinion has its own paragraph numbering.",
      sources: [["Thiel v. Federal Commissioner of Taxation (1990): High Court judgment, [1990] HCA 37; 171 CLR 338", "https://casechat.au/cases/au/thiel-v-federal-commissioner-of-taxation"], ["Australian Taxation Office: treaty interpretation and foreign-case reference material", "https://www.ato.gov.au/law/view/pdf/inow/inow201910.pdf"]],
      takeaway: "Thiel: Article 7 covered the venture and there was no Australian PE, so Australia could not tax the profit.",
    },
  ];

  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("en", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat("en", { maximumFractionDigits: 2 });
  let current = 0;
  let step = 0;
  let calculation = null;

  function calculate() {
    const input = $("amount");
    const value = input.valueAsNumber;
    const invalid = input.value.trim() === "" || !Number.isFinite(value) || !input.validity.valid || value < 0 || value > 1000000000;
    input.setAttribute("aria-invalid", String(invalid));
    $("amount-error").textContent = invalid ? "Enter 0 to 1 billion, with up to two decimal places." : "";
    if (invalid) {
      ["metric-a", "metric-b", "metric-c"].forEach((id) => { $(id).textContent = "—"; });
      return null;
    }
    const cents = Math.round(value * 100);
    const baseline = Math.round(cents * 25 / 100);
    const alternative = Math.round(cents * (current === 0 ? 10 : 5) / 100);
    const difference = baseline - alternative;
    $("metric-a").textContent = money.format(baseline / 100);
    $("metric-b").textContent = money.format(alternative / 100);
    $("metric-c").textContent = money.format(difference / 100);
    return { value, baseline, alternative, difference };
  }

  function updateResult() {
    TaxPixel.update("cases", { current, step, calculation, stepTitle: cases[current].steps[step].title });
    if (current !== 2 && !calculation && step !== 1) {
      $("result").textContent = "Enter a valid amount first.";
      return;
    }
    if (step === 1) {
      $("result").textContent = ["Treaty residence fails, so the 10% rate is unavailable.", "Control and no automatic pass-on duty support beneficial ownership.", "An enterprise exists; both sides accept that there is no Australian PE."][current];
      return;
    }
    if (current === 2) {
      $("result").textContent = step === 0 ? "Domestic starting point: Australia seeks to tax the gain" : "Treaty outcome: no PE, no Australian tax on the profit";
      return;
    }
    if (step === 0) {
      $("result").textContent = `${money.format(calculation.baseline / 100)} = ${number.format(calculation.value)} CAD × 25%`;
    } else if (current === 0) {
      $("result").textContent = `${money.format(calculation.baseline / 100)} required − ${money.format(calculation.alternative / 100)} withheld = ${money.format(calculation.difference / 100)} shortfall`;
    } else {
      $("result").textContent = `Treaty tax ${money.format(calculation.alternative / 100)}; saving ${money.format(calculation.difference / 100)} against the 25% baseline`;
    }
  }

  function renderStep() {
    const content = cases[current].steps[step];
    document.querySelectorAll("[data-step]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.step) === step)));
    $("step-title").textContent = content.title;
    $("rule").textContent = content.rule;
    $("reason").textContent = content.reason;
    updateResult();
  }

  function renderQuiz() {
    const data = cases[current];
    $("question").textContent = data.question;
    $("feedback").textContent = "";
    $("feedback").className = "quiz-feedback";
    $("options").replaceChildren(...data.answers.map((answer, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = answer;
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("click", () => {
        [...$("options").children].forEach((option, optionIndex) => option.setAttribute("aria-pressed", String(optionIndex === index)));
        const correct = index === data.correct;
        $("feedback").textContent = `${correct ? "Correct: " : "Check the rule: "}${data.feedback}`;
        $("feedback").classList.toggle("correct", correct);
        $("feedback").classList.toggle("review", !correct);
      });
      return button;
    }));
  }

  function render() {
    const data = cases[current];
    document.querySelectorAll("[data-case]").forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.case) === current)));
    document.querySelectorAll("[data-case-panel]").forEach((panel) => { panel.hidden = Number(panel.dataset.casePanel) !== current; });
    $("amount-wrap").hidden = current === 2;
    $("no-amount-note").hidden = current !== 2;
    $("calculation-panel").hidden = current === 2;
    $("thiel-path").hidden = current !== 2;
    $("rate-guide").textContent = data.rateGuide;
    data.labels.forEach((label, index) => { $(`metric-${String.fromCharCode(97 + index)}-label`).textContent = label; });
    calculation = current === 2 ? null : calculate();
    $("detail-text").textContent = data.detail;
    $("takeaway").textContent = data.takeaway;
    $("sources").replaceChildren(...data.sources.map(([label, url]) => {
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener";
      link.textContent = `${label} ↗`;
      return link;
    }));
    renderStep();
    renderQuiz();
  }

  document.querySelectorAll("[data-case]").forEach((button) => button.addEventListener("click", () => {
    current = Number(button.dataset.case);
    step = 0;
    $("case-detail").open = false;
    render();
  }));
  document.querySelectorAll("[data-step]").forEach((button) => button.addEventListener("click", () => {
    step = Number(button.dataset.step);
    renderStep();
  }));
  $("amount").addEventListener("input", () => {
    calculation = calculate();
    updateResult();
  });
  $("reset").addEventListener("click", () => {
    $("amount").value = "10000";
    $("amount").setAttribute("aria-invalid", "false");
    $("amount-error").textContent = "";
    step = 0;
    render();
  });
  render();
})();
