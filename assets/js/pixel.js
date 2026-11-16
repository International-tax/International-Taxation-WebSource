(function (global) {
  "use strict";

  const C = {
    ink: "#30343b", muted: "#626d79", line: "#e1d3c9", paper: "#ffffff",
    sand: "#e5ddd4", sandDark: "#b7a99a", green: "#c28d71", greenDark: "#a65d3d",
    greenLight: "#e6d0c2", blue: "#cba28a", blueDark: "#a77c63", blueLight: "#e6d0c2",
    rust: "#88715f", rustDark: "#695343", gold: "#c4a365", cream: "#f3e9dc", white: "#ffffff",
  };
  const skins = { light: "#f0cfad", warm: "#ddb18a", tan: "#c18e67", brown: "#98664d", deep: "#69483a" };
  const hairs = { ink: "#383a37", brown: "#674b39", gold: "#b48c52", silver: "#a3aaa5" };
  const shirts = { green: C.green, blue: C.blue, rust: C.rust, cream: "#c7b78f", ink: "#59605b" };
  const trousers = { dark: "#4d5550", denim: "#536f80", brown: "#725744" };
  const types = ["consulting", "remote", "profit", "cases", "relief", "residence", "enterprise", "source", "labor", "withholding"];
  const lessons = Object.create(null);
  const english = /^en(?:-|$)/i.test(document.documentElement.lang);
  const words = (cn, en) => english ? en : cn;
  const formatter = new Intl.NumberFormat(english ? "en-US" : "zh-CN", { maximumFractionDigits: 2 });

  function number(value) {
    if (!Number.isFinite(value)) throw new TypeError("Pixel quantities must be finite");
    return formatter.format(value);
  }
  const yuan = value => "¥" + number(value);
  const pct = value => number(value) + "%";
  function esc(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  }
  function R(x, y, width, height, fill, extra = "") {
    return `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fill}" ${extra}/>`;
  }
  function G(x, y, scale, body) { return `<g transform="translate(${x} ${y}) scale(${scale})">${body}</g>`; }
  function T(x, y, value, options = {}) {
    const size = options.size ?? 11;
    const content = String(value);
    const width = Array.from(content).reduce((sum, ch) => sum + (ch.charCodeAt(0) > 255 ? size : size * 0.56), 0);
    const fit = options.max && width > options.max ? ` textLength="${options.max}" lengthAdjust="spacingAndGlyphs"` : "";
    return `<text x="${x}" y="${y}" text-anchor="${options.anchor ?? "middle"}" font-size="${size}" fill="${options.color ?? C.ink}" class="tax-pixel__label"${fit}>${esc(content)}</text>`;
  }
  function hLine(x1, x2, y, color, dashed = false) {
    const start = Math.min(x1, x2), end = Math.max(x1, x2);
    if (!dashed) return R(start, y - 1, end - start, 3, color);
    let body = "";
    for (let x = start; x < end; x += 12) body += R(x, y - 1, Math.min(7, end - x), 3, color);
    return body;
  }
  function vLine(x, y1, y2, color, dashed = false) {
    const start = Math.min(y1, y2), end = Math.max(y1, y2);
    if (!dashed) return R(x - 1, start, 3, end - start, color);
    let body = "";
    for (let y = start; y < end; y += 12) body += R(x - 1, y, 3, Math.min(7, end - y), color);
    return body;
  }
  function hArrow(x1, x2, y, color = C.rust, dashed = false) {
    let body = hLine(x1, x2, y, color, dashed);
    for (let i = 1; i <= 4; i++) body += R(x2 >= x1 ? x2 - i * 2 : x2 + (i - 1) * 2, y - i * 2, 2, i * 4, color);
    return body;
  }
  function vArrow(x, y1, y2, color = C.rust, dashed = false) {
    let body = vLine(x, y1, y2, color, dashed);
    for (let i = 1; i <= 4; i++) body += R(x - i * 2, y2 >= y1 ? y2 - i * 2 : y2 + (i - 1) * 2, i * 4, 2, color);
    return body;
  }
  function palette(table, key) {
    if (!Object.hasOwn(table, key)) throw new RangeError("Unknown pixel palette: " + key);
    return table[key];
  }
  function avatarParts(options = {}) {
    const skin = palette(skins, options.skin ?? "warm");
    const hair = palette(hairs, options.hairColor ?? "brown");
    const shirt = palette(shirts, options.shirt ?? "green");
    const pants = palette(trousers, options.pants ?? "dark");
    const style = options.hair ?? "short";
    if (!["short", "bob", "long", "curly"].includes(style)) throw new RangeError("Unknown pixel hairstyle: " + style);
    let body = R(9, 60, 30, 3, C.line, 'opacity="0.55"');
    if (style === "long") body += R(10, 9, 29, 31, hair) + R(8, 20, 5, 23, hair) + R(36, 20, 5, 23, hair);
    body += R(15, 46, 8, 12, pants) + R(27, 46, 8, 12, pants) +
      R(13, 56, 10, 4, C.ink) + R(27, 56, 11, 4, C.ink) +
      R(12, 31, 25, 17, shirt) + R(12, 31, 4, 17, C.white, 'opacity="0.18"') +
      R(21, 32, 7, 3, C.cream) + R(23, 35, 3, 13, C.cream) +
      R(8, 33, 5, 13, shirt) + R(8, 44, 5, 5, skin) + R(36, 33, 5, 13, shirt) + R(36, 44, 5, 5, skin) +
      R(13, 10, 23, 21, skin) + R(10, 17, 4, 8, skin) + R(35, 17, 4, 8, skin) +
      R(17, 18, 3, 4, C.ink) + R(28, 18, 3, 4, C.ink) + R(18, 18, 1, 1, C.white) + R(29, 18, 1, 1, C.white) +
      R(24, 22, 2, 2, C.rustDark) + R(21, 27, 7, 2, C.rustDark);
    if (style === "short") body += R(13, 6, 23, 8, hair) + R(11, 10, 6, 10, hair) + R(17, 11, 5, 4, hair) + R(32, 10, 5, 6, hair);
    if (style === "bob") body += R(12, 5, 25, 9, hair) + R(9, 12, 6, 21, hair) + R(35, 12, 6, 21, hair) + R(16, 11, 9, 4, hair);
    if (style === "long") body += R(13, 5, 23, 9, hair) + R(10, 11, 7, 13, hair) + R(33, 11, 6, 17, hair) + R(19, 11, 8, 3, hair);
    if (style === "curly") body += R(12, 7, 9, 8, hair) + R(20, 4, 9, 9, hair) + R(28, 7, 10, 8, hair) + R(9, 12, 8, 9, hair) + R(34, 12, 7, 9, hair) + R(16, 11, 7, 5, hair);
    return body;
  }
  function avatar(options) {
    return `<svg viewBox="0 0 48 64" shape-rendering="crispEdges" class="tax-pixel__avatar" role="img" aria-label="${words("人物", "Person")}">${avatarParts(options)}</svg>`;
  }
  const person = (x, y, scale, options) => G(x, y, scale, avatarParts(options));
  function desk(x, y, scale, color = C.sandDark) {
    return G(x, y, scale, R(27, 0, 34, 23, C.blueDark) + R(30, 3, 28, 16, C.blueLight) + R(41, 8, 6, 6, C.paper) +
      R(23, 23, 42, 4, C.ink) + R(0, 28, 96, 8, color) + R(0, 28, 96, 3, C.cream) +
      R(8, 36, 7, 23, C.rustDark) + R(81, 36, 7, 23, C.rustDark) + R(67, 39, 13, 11, C.sand) + R(70, 42, 7, 2, C.muted));
  }
  function building(x, y, width, height, color, label = "") {
    let body = R(x + 8, y - 7, width - 16, 7, C.sandDark) + R(x, y, width, height, color) + R(x, y, width, 5, C.cream) + R(x + width / 2 - 8, y + height - 19, 16, 19, C.rustDark);
    for (let yy = y + 15; yy < y + height - 23; yy += 19) {
      for (let xx = x + 12; xx < x + width - 12; xx += 22) body += R(xx, yy, 11, 10, C.cream) + R(xx + 5, yy, 2, 10, C.blueLight);
    }
    body += R(x - 5, y + height, width + 10, 4, C.line);
    if (label) body += T(x + width / 2, y - 12, label, { size: 10, max: width + 30 });
    return body;
  }
  function factory(x, y, scale) {
    return G(x, y, scale, R(8, 0, 14, 38, C.rustDark) + R(6, 0, 18, 6, C.ink) + R(76, 10, 12, 29, C.rustDark) + R(74, 10, 16, 5, C.ink) +
      R(0, 35, 116, 48, C.blue) + R(0, 29, 29, 8, C.blueDark) + R(25, 22, 29, 15, C.blueDark) + R(50, 29, 29, 8, C.blueDark) + R(75, 22, 29, 15, C.blueDark) +
      R(12, 49, 20, 15, C.cream) + R(47, 49, 20, 15, C.cream) + R(82, 49, 20, 15, C.cream) + R(46, 67, 24, 16, C.rustDark) +
      R(-5, 83, 126, 4, C.line) + R(12, -9, 8, 5, C.sand) + R(19, -15, 11, 6, C.sand));
  }
  function house(x, y, scale, color = C.green) {
    return G(x, y, scale, R(22, 0, 20, 6, C.rustDark) + R(15, 6, 34, 6, C.rustDark) + R(8, 12, 48, 7, C.rust) + R(3, 19, 58, 6, C.rust) +
      R(8, 25, 48, 38, color) + R(13, 30, 13, 13, C.cream) + R(39, 30, 12, 13, C.cream) + R(27, 43, 13, 20, C.ink) +
      R(35, 52, 2, 2, C.gold) + R(4, 63, 56, 4, C.line) + R(48, 3, 7, 14, C.rustDark));
  }
  function coin(x, y, scale, color = C.gold) {
    return G(x, y, scale, R(4, 0, 12, 2, C.rustDark) + R(2, 2, 16, 10, color) + R(4, 12, 12, 2, C.rustDark) + R(7, 4, 3, 6, C.cream) + R(11, 4, 3, 6, C.cream));
  }
  function taxNode(x, y, label, color = C.rust, scale = 1) {
    let body = R(8, 0, 36, 4, C.rustDark) + R(4, 4, 44, 30, color) + R(0, 10, 52, 18, color) + R(10, 10, 7, 12, C.cream) + R(23, 8, 6, 16, C.cream) + R(35, 10, 7, 12, C.cream) + R(4, 34, 44, 4, C.rustDark);
    if (label) body += T(26, 52, label, { size: 10, max: 92 });
    return G(x, y, scale, body);
  }
  function wallet(x, y, scale) {
    return G(x, y, scale, R(4, 4, 54, 34, C.rustDark) + R(0, 9, 58, 31, C.rust) + R(7, 0, 34, 8, C.gold) + R(13, -5, 34, 8, C.cream) +
      R(37, 17, 24, 15, C.rustDark) + R(41, 20, 17, 9, C.gold) + R(45, 23, 5, 4, C.cream) + R(7, 36, 25, 3, C.cream));
  }
  function court(x, y, scale) {
    return G(x, y, scale, R(26, 0, 48, 7, C.rustDark) + R(17, 7, 66, 7, C.rust) + R(8, 14, 84, 8, C.rust) + R(3, 22, 94, 7, C.sandDark) +
      R(12, 31, 10, 48, C.sand) + R(34, 31, 10, 48, C.sand) + R(56, 31, 10, 48, C.sand) + R(78, 31, 10, 48, C.sand) +
      R(7, 79, 86, 7, C.sandDark) + R(0, 86, 100, 7, C.line) + R(45, 48, 12, 31, C.blueDark) + R(48, 54, 6, 4, C.gold));
  }
  const note = value => `<p class="pixel-note">${esc(value)}</p>`;
  function target(type) {
    const element = document.querySelector(`[data-pixel-scene="${type}"]`);
    if (!element) throw new Error("Missing pixel lesson: " + type);
    if (!element.classList.contains("pixel-lesson")) {
      const hero = element.closest(".chapter-hero");
      if (hero) {
        const results = document.querySelector(".results-column, .analysis-column, .workspace > .results");
        results.prepend(element);
        hero.classList.add("pixel-heading");
      }
      element.classList.add("pixel-lesson", "panel");
      element.setAttribute("role", "region");
    }
    return element;
  }
  function paint(type, title, body) {
    const element = target(type);
    element.setAttribute("aria-label", title);
    element.innerHTML = `<h2>${esc(title)}</h2>${body}`;
    element.dataset.ready = "true";
  }
  function clear(type) {
    paint(type, words("案例图解", "Case visualization"), note(words("等待有效参数", "Waiting for valid inputs")));
    target(type).dataset.ready = "false";
    if (type === "relief") document.getElementById("neutrality-pixels").replaceChildren();
  }
  function registerLessons(next) {
    Object.entries(next).forEach(([type, lesson]) => {
      if (!types.includes(type) || typeof lesson !== "function" || Object.hasOwn(lessons, type)) throw new TypeError("Invalid pixel lesson registration: " + type);
      lessons[type] = lesson;
    });
  }
  function update(type, state) {
    if (!Object.hasOwn(lessons, type)) throw new RangeError("Unregistered pixel lesson: " + type);
    lessons[type](state);
  }
  global.TaxPixel = {
    avatar, update, clear, registerLessons,
    lessonKit: { words, number, yuan, pct, note, paint, esc,
      R, G, T, person, desk, building, factory, house, coin, taxNode, wallet, hArrow, vArrow, hLine, vLine, court, C },
  };
})(window);
