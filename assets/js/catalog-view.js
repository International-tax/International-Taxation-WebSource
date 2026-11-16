(() => {
  const comments = document.createElement('script');
  comments.type = 'module';
  comments.src = new URL('comments.js', document.currentScript.src).href;
  document.head.append(comments);
  const catalog = window.TaxCatalog;
  if (!catalog) return;

  const locale = document.documentElement.lang.startsWith("en") ? "en" : "cn";
  const stageMap = new Map(catalog.stages.map((stage) => [stage.id, stage]));
  const copy = (value) => value?.[locale] ?? value?.cn ?? "";
  let toolMap;
  let mainTools;
  let activeTag = "all";

  function rebuildIndex() {
    toolMap = new Map(catalog.tools.map((tool) => [tool.id, tool]));
    mainTools = [...catalog.tools]
      .filter((tool) => tool.core)
      .sort((a, b) => stageMap.get(a.stage).order - stageMap.get(b.stage).order || a.order - b.order);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined) element.textContent = text;
    return element;
  }

  function toolHref(tool) {
    return `./${tool.path}`;
  }

  function toolTags(tool) {
    return [`stage:${tool.stage}`];
  }

  function tagName(tag) {
    return copy(stageMap.get(tag.slice(6)).name);
  }

  function createPrerequisites(tool, compact = true) {
    const wrapper = node("div", "card-prerequisites");
    if (!tool.requires.length) {
      wrapper.hidden = true;
      return wrapper;
    }
    wrapper.append(node("span", "prerequisite-label", locale === "en" ? "Foundations" : "先修"));
    const requirements = compact ? tool.requires.slice(0, 2) : tool.requires;
    requirements.forEach((id) => {
      const required = toolMap.get(id);
      if (!required) return;
      const link = node("a", "prerequisite-link", copy(required.title));
      link.href = toolHref(required);
      wrapper.append(link);
    });
    if (compact && tool.requires.length > 2) {
      const more = node("span", "prerequisite-more", `+${tool.requires.length - 2}`);
      more.title = tool.requires.slice(2).map((id) => copy(toolMap.get(id).title)).join(" · ");
      wrapper.append(more);
    }
    return wrapper;
  }

  function createCard(tool, pathIndex) {
    const card = node("a", "course-card catalog-card");
    card.href = toolHref(tool);
    card.setAttribute("aria-labelledby", `tool-title-${tool.id}`);
    card.dataset.toolId = tool.id;
    card.dataset.tags = toolTags(tool).join(" ");

    const content = node("div", "course-content");
    const top = node("div", "course-top");
    top.append(
      node("span", "", String(pathIndex + 1).padStart(2, "0")),
      node("span", "availability", copy(tool.chapter)),
    );
    content.append(top);

    const art = node("div", "course-art tool-art");
    art.setAttribute("aria-hidden", "true");
    const illustration = node("img", "tool-illustration");
    illustration.src = `../assets/images/catalog/${tool.id}.svg`;
    illustration.alt = "";
    illustration.width = 240;
    illustration.height = 160;
    illustration.loading = "lazy";
    illustration.decoding = "async";
    illustration.draggable = false;
    art.append(illustration);
    card.append(art);

    const title = node("h3", "card-title", copy(tool.title));
    title.id = `tool-title-${tool.id}`;
    content.append(title);
    const footer = node("div", "course-footer");
    const arrow = node("span", "course-arrow", "↗");
    arrow.setAttribute("aria-hidden", "true");
    footer.append(node("span", "chapter-name", copy(stageMap.get(tool.stage).name)), arrow);
    content.append(footer);
    card.append(content);
    return card;
  }

  function matchingTools() {
    return catalog.tools
      .filter((tool) => activeTag === "all" || toolTags(tool).includes(activeTag))
      .sort((a, b) => stageMap.get(a.stage).order - stageMap.get(b.stage).order || a.order - b.order);
  }

  function renderCatalog() {
    const container = document.querySelector("#catalog-grid");
    if (!container) return;
    const matches = matchingTools();
    container.replaceChildren();
    matches.forEach((tool) => container.append(createCard(tool, catalog.tools.indexOf(tool))));
    const count = document.querySelector("#catalog-count");
    if (count) {
      count.textContent = locale === "en"
        ? `${matches.length} of ${catalog.tools.length} tools`
        : `显示 ${matches.length} / ${catalog.tools.length} 个工具`;
    }
    const empty = document.querySelector("#catalog-empty");
    if (empty) empty.hidden = matches.length > 0;
  }

  function availableTags() {
    const present = new Set(catalog.tools.flatMap(toolTags));
    return catalog.stages.map((stage) => `stage:${stage.id}`).filter((tag) => present.has(tag));
  }

  function renderFilters() {
    const filters = document.querySelector("#tag-filters");
    if (!filters) return;
    filters.replaceChildren();
    ["all", ...availableTags()].forEach((tag) => {
      const button = node("button", "tag-filter", tag === "all" ? (locale === "en" ? "All" : "全部") : tagName(tag));
      button.type = "button";
      button.dataset.filterTag = tag;
      button.setAttribute("aria-pressed", String(activeTag === tag));
      filters.append(button);
    });
  }

  function initHome() {
    const filters = document.querySelector("#tag-filters");
    if (!filters || !document.querySelector("#catalog-grid")) return;
    renderFilters();
    renderCatalog();
    filters.addEventListener("click", (event) => {
      const button = event.target.closest("[data-filter-tag]");
      if (!button) return;
      activeTag = button.dataset.filterTag;
      filters.querySelectorAll("[data-filter-tag]").forEach((item) => item.setAttribute("aria-pressed", String(item === button)));
      renderCatalog();
    });
  }

  function renderToolNavigation() {
    const tool = toolMap.get(document.body.dataset.toolId);
    if (!tool) return;
    const context = document.querySelector("[data-tool-context]");
    if (context) {
      context.replaceChildren();
      if (tool.requires.length) {
        context.append(node("span", "context-label", locale === "en" ? "Related foundations" : "相关基础"));
        context.append(createPrerequisites(tool, false));
      } else {
        context.hidden = true;
      }
    }
    const nav = document.querySelector("[data-sequence-nav]");
    if (!nav) return;
    nav.replaceChildren();
    const index = mainTools.indexOf(tool);
    const previous = mainTools[index - 1];
    const next = mainTools[index + 1];
    if (previous) {
      const link = node("a", "sequence-prev", `← ${copy(previous.title)}`);
      link.href = toolHref(previous);
      link.setAttribute("aria-label", `${locale === "en" ? "Previous" : "上一步"}：${copy(previous.title)}`);
      nav.append(link);
    } else {
      nav.append(node("span", "sequence-spacer"));
    }
    const home = node("a", "sequence-home", locale === "en" ? "Simulator catalog" : "模拟器目录");
    home.href = "./index.html#chapters";
    nav.append(home);
    if (next) {
      const link = node("a", "sequence-next", `${copy(next.title)} →`);
      link.href = toolHref(next);
      link.setAttribute("aria-label", `${locale === "en" ? "Next" : "下一步"}：${copy(next.title)}`);
      nav.append(link);
    } else {
      nav.append(node("span", "sequence-spacer"));
    }
  }

  function init() {
    rebuildIndex();
    initHome();
    renderToolNavigation();
  }

  window.TaxCatalogView = {
    refresh() {
      rebuildIndex();
      renderFilters();
      renderCatalog();
      renderToolNavigation();
    },
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
