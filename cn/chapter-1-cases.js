(() => {
  "use strict";

  const cases = [
    {
      rateGuide: "25% 国内法基准 · 假设已扣 10%",
      labels: ["25% 应扣", "假设已扣 10%", "应补差额"],
      steps: [
        { title: "国内法：租金先按 25% 扣缴", rule: "加拿大《所得税法》第 212(1)(d) 条对案涉非居民驳船租金规定 25% 的源泉扣缴税率。", reason: "协定是否降低税率，要等下一步核查收款人的居民资格。" },
        { title: "协定居民资格以全面纳税义务为基础", rule: "《加美协定》第 XII 条的 10% 上限，只适用于符合第 IV 条定义的美国居民。设有办事处并不足够。", reason: "Norsk 仅就与美国经营有关的所得承担有限纳税义务，未因居民身份联系承担全面纳税义务。" },
        { title: "裁判：不适用 10% 上限", rule: "最高法院认定 Norsk 不是《加美协定》意义上的美国居民，恢复加拿大国内法 25% 的扣缴核定。", reason: "应扣 25%，减去假设已扣的 10%，就是本例需要补足的差额。" },
      ],
      question: "在美国设有办公室，就足以成为《加美协定》下的美国居民吗？",
      answers: ["足够，办公场所就是居民连接因素", "不足够，还要看是否因居民身份承担全面纳税义务"],
      correct: 1,
      feedback: "协定居民看的是全面纳税义务的法律依据，不是办公场所或实际缴税额。",
      detail: "最高法院结合《加美税收协定》的上下文与缔约目的，并参考 OECD 范本及评注对居民的说明，认定 Norsk 在美国仅承担与当地经营有关的有限纳税义务。案涉租金在美国享受航运豁免；居民资格判断取决于承担纳税义务的法律依据。参见判决第 3—7、55—58 段。",
      sources: [["Crown Forest Industries Ltd. v. Canada（1995）：加拿大最高法院判决摘要与第 3—7、55—58 段", "https://taxinterpretations.com/content/355006"], ["加拿大最高法院官方卷宗库：案号 23940", "https://scc-csc.gc.ca/cases-dossiers/search-recherche/23940/"]],
      takeaway: "Crown Forest：未通过协定居民审查，就不能用 10% 协定上限替代国内法 25%。",
    },
    {
      rateGuide: "25% 国内法基准 · 满足条件时协定上限 5%",
      labels: ["25% 基准税", "5% 协定税", "协定节税"],
      steps: [
        { title: "国内法：股息先按 25% 扣缴", rule: "案涉年度的加拿大国内法对支付给非居民股东的股息规定 25% 的基准预提税率。", reason: "这个基准用来衡量满足协定条件后的减税幅度。" },
        { title: "自主支配股息支持受益所有人认定", rule: "《加荷协定》第 10 条的 5% 上限要求收款人为股息受益所有人，而非负有自动转付义务的代理人或导管。", reason: "后续利润分配本身不等于预先存在自动转付义务。" },
        { title: "裁判：受益所有人条件成立，税率降至 5%", rule: "荷兰公司拥有独立资产负债表，股息属于其自有财产，也不存在必须转付给背后股东的法定义务。", reason: "生效协定在适用范围内把国内法 25% 限制为 5%。" },
      ],
      question: "认定荷兰公司为受益所有人的关键是什么？",
      answers: ["股息曾经进入荷兰银行账户", "荷兰公司能自主支配，且无自动转付义务"],
      correct: 1,
      feedback: "关键是对股息的使用与支配权，以及是否存在自动转付义务，不是资金是否过境。",
      detail: "25% 是教学比较中的加拿大国内法基准税率。原案中，税务机关主张穿透荷兰公司，把瑞典股东（加瑞协定税率 15%）和英国股东（加英协定税率 10%）视为受益所有人。联邦上诉法院参考 OECD 范本评注关于受益所有人与导管公司的解释，维持荷兰公司的受益所有人认定。参见判决第 3、16—19 段。",
      sources: [["Prévost Car Inc. v. Canada（2009）：加拿大联邦法院官方判例集，PDF 第 80 页起，判决第 3、16—19 段", "https://publications.gc.ca/collections/collection_2011/cmf-fja/JU1-2-2010-2-1.pdf#page=80"]],
      takeaway: "Prévost Car：居民与受益所有人条件均满足时，协定把 25% 国内法基准限制为 5%。",
    },
    {
      rateGuide: "国内法征税 → 协定第 7 条 → 无常设机构",
      labels: ["", "", ""],
      steps: [
        { title: "国内法：短期转让利润被纳入应税所得", rule: "澳大利亚税务机关依据国内法，对 Thiel 买入信托权益、转换并短期出售股票的利润作出征税核定。", reason: "下一步不是算税，而是审查生效协定是否限制澳大利亚的征税权。" },
        { title: "单次商业活动也可构成协定中的企业", rule: "《澳瑞协定》第 7 条保护瑞士企业的营业利润；若企业通过澳大利亚常设机构营业，澳方才可在归属范围内征税。", reason: "双方确认没有常设机构，因此“企业”一词的解释成为关键。" },
        { title: "裁判：第 7 条适用，澳大利亚不得征税", rule: "高等法院参考 1977 年 OECD 范本评注，认为一项以转售获利为目的的商业活动也可构成协定所说的企业。", reason: "真正限制征税权的是生效的《澳瑞协定》第 7 条；评注只是解释材料。" },
      ],
      question: "OECD 范本及评注在 Thiel 案中发挥什么作用？",
      answers: ["解释参考，帮助阐明双边协定用语", "直接生效的全球税法，独立免除税负"],
      correct: 0,
      feedback: "范本与评注辅助解释；免税结论的法律依据是生效的《澳瑞协定》第 7 条。",
      detail: "Mason 首席大法官等的共同意见第 8—10 段结合协定上下文及 1977 年 OECD 范本评注解释企业与营业利润。Dawson 大法官意见第 8—10 段引用英国 Sun Life 及 Ostime 等判例。McHugh 大法官意见第 13、16 段结合《维也纳条约法公约》第 31、32 条说明范本与评注作为补充解释材料的作用。各份意见段落分别编号。",
      sources: [["Thiel v. Federal Commissioner of Taxation（1990）：澳大利亚高等法院判决，[1990] HCA 37; 171 CLR 338", "https://casechat.au/cases/au/thiel-v-federal-commissioner-of-taxation"], ["澳大利亚税务局：协定解释与外国判例参考材料", "https://www.ato.gov.au/law/view/pdf/inow/inow201910.pdf"]],
      takeaway: "Thiel：商业活动属于第 7 条，且澳方无常设机构，所以澳大利亚对案涉利润不征税。",
    },
  ];

  const $ = (id) => document.getElementById(id);
  const money = new Intl.NumberFormat("zh-CN", { style: "currency", currency: "CAD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const number = new Intl.NumberFormat("zh-CN", { maximumFractionDigits: 2 });
  let current = 0;
  let step = 0;
  let calculation = null;

  function calculate() {
    const input = $("amount");
    const value = input.valueAsNumber;
    const invalid = input.value.trim() === "" || !Number.isFinite(value) || !input.validity.valid || value < 0 || value > 1000000000;
    input.setAttribute("aria-invalid", String(invalid));
    $("amount-error").textContent = invalid ? "请输入 0 至 10 亿之间、最多两位小数的金额。" : "";
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
      $("result").textContent = "请先输入有效金额。";
      return;
    }
    if (step === 1) {
      $("result").textContent = ["居民资格不成立，不能进入 10% 协定税率。", "支配权与无自动转付义务，支持受益所有人认定。", "“企业”成立；双方确认澳方无常设机构。"][current];
      return;
    }
    if (current === 2) {
      $("result").textContent = step === 0 ? "国内法起点：澳大利亚拟对转让利润征税" : "协定结果：无常设机构，澳大利亚不征税";
      return;
    }
    if (step === 0) {
      $("result").textContent = `${money.format(calculation.baseline / 100)} = ${number.format(calculation.value)} 加元 × 25%`;
    } else if (current === 0) {
      $("result").textContent = `应扣 ${money.format(calculation.baseline / 100)} − 已扣 ${money.format(calculation.alternative / 100)} = 补扣 ${money.format(calculation.difference / 100)}`;
    } else {
      $("result").textContent = `协定税 ${money.format(calculation.alternative / 100)}；较 25% 基准少扣 ${money.format(calculation.difference / 100)}`;
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
        $("feedback").textContent = `${correct ? "回答正确：" : "再核对一次："}${data.feedback}`;
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
