import { commentsConfig } from './comments-config.js';

const english = document.documentElement.lang.startsWith('en');
const t = (cn, en) => english ? en : cn;
const locale = english ? 'en' : 'cn';
const page = location.pathname.split('/').at(-1) || 'index.html';
const base = ['localhost', '127.0.0.1'].includes(location.hostname) ? 'http://127.0.0.1:8787' : commentsConfig.api;
const main = document.querySelector('main');
const style = document.createElement('link');
style.rel = 'stylesheet';
style.href = new URL('../css/comments.css', import.meta.url).href;
document.head.append(style);

const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const button = (text, action, className = '') => {
  const node = el('button', `review-button ${className}`, text);
  node.type = 'button';
  node.addEventListener('click', action);
  return node;
};
const randomToken = () => Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, '0')).join('');
let authorToken = localStorage.getItem('tax-review-author');
if (!authorToken) {
  authorToken = randomToken();
  localStorage.setItem('tax-review-author', authorToken);
}
let adminToken = sessionStorage.getItem('tax-review-admin') || '';
let isAdmin = false;
let selectionTarget = null;
let composition = null;
let selecting = false;
let hoverTarget = null;
let highlighted = null;
let nextCursor = null;
let rows = [];
let loadGeneration = 0;

const root = el('div', 'review-root');
document.body.append(root);
const launch = button(t('评论', 'Comments'), () => openPanel(), 'review-launch');
launch.setAttribute('aria-controls', 'review-panel');
launch.setAttribute('aria-expanded', 'false');
const panel = el('aside', 'review-panel');
panel.id = 'review-panel';
panel.setAttribute('aria-label', t('网页修改意见', 'Website feedback'));
panel.hidden = true;
const heading = el('div', 'review-heading');
const headingCopy = el('div');
headingCopy.append(el('p', 'review-eyebrow', 'WEB SOURCE / FEEDBACK'), el('h2', '', t('修改意见', 'Feedback')));
heading.append(headingCopy, button(t('关闭', 'Close'), closePanel));
const intro = el('p', 'review-muted', t('选中文字或组件，留下修改意见。评论对所有人可见。', 'Select text or a component to leave feedback. Comments are public.'));
const actions = el('div', 'review-actions');
actions.append(button(t('选择组件', 'Select component'), startSelection), button(t('评论本页', 'Comment on page'), () => compose(pageTarget())));
const filters = el('div', 'review-filters');
const scope = el('select');
scope.setAttribute('aria-label', t('评论范围', 'Comment scope'));
scope.append(new Option(t('当前页面', 'This page'), 'page'), new Option(t('全部页面', 'All pages'), 'all'));
const state = el('select');
state.setAttribute('aria-label', t('处理状态', 'Status'));
state.append(new Option(t('全部状态', 'All statuses'), ''), new Option(t('待处理', 'Open'), 'open'), new Option(t('已解决', 'Resolved'), 'resolved'));
filters.append(scope, state, button(t('刷新', 'Refresh'), () => loadComments()));
scope.addEventListener('change', () => loadComments());
state.addEventListener('change', () => loadComments());
const status = el('p', 'review-status');
status.setAttribute('role', 'status');
status.setAttribute('aria-live', 'polite');
const composer = el('form', 'review-composer');
composer.hidden = true;
const composerTitle = el('h3');
const quote = el('blockquote', 'review-quote');
const nameLabel = el('label', '', t('姓名', 'Name'));
const nameInput = el('input');
nameInput.id = 'review-name';
nameInput.name = 'name';
nameInput.autocomplete = 'name';
nameInput.maxLength = 60;
nameInput.required = true;
nameInput.value = localStorage.getItem('tax-review-name') || '';
nameLabel.htmlFor = nameInput.id;
const bodyLabel = el('label', '', t('修改意见', 'Your feedback'));
const bodyInput = el('textarea');
bodyInput.id = 'review-body';
bodyInput.rows = 4;
bodyInput.maxLength = 4000;
bodyInput.required = true;
bodyLabel.htmlFor = bodyInput.id;
const save = el('button', 'review-button review-primary', t('提交评论', 'Post comment'));
save.type = 'submit';
const composeActions = el('div', 'review-actions');
composeActions.append(save, button(t('取消', 'Cancel'), () => { composer.hidden = true; composition = null; }));
composer.append(composerTitle, quote, nameLabel, nameInput, bodyLabel, bodyInput,
  el('p', 'review-muted', t('此浏览器会保留你的编辑权限。', 'Your editing access is saved in this browser.')), composeActions);
composer.addEventListener('submit', submitComment);
const list = el('div', 'review-list');
const more = button(t('加载更多', 'Load more'), () => loadComments(true));
more.hidden = true;
const adminBox = el('details', 'review-admin');
adminBox.append(el('summary', '', t('管理员', 'Administrator')));
const adminForm = el('form');
const adminLabel = el('label', '', t('管理员凭证', 'Administrator key'));
const adminInput = el('input');
adminInput.type = 'password';
adminInput.autocomplete = 'off';
adminInput.id = 'review-admin-key';
adminInput.required = true;
adminLabel.htmlFor = adminInput.id;
const adminSubmit = el('button', 'review-button', t('进入管理', 'Enter administration'));
adminSubmit.type = 'submit';
adminForm.append(adminLabel, adminInput, adminSubmit);
adminForm.addEventListener('submit', async event => {
  event.preventDefault();
  const value = adminInput.value.trim();
  const result = await request('/session', { admin: value });
  if (!result) return;
  adminToken = value;
  sessionStorage.setItem('tax-review-admin', value);
  adminInput.value = '';
  isAdmin = result.admin;
  renderAdmin();
  await loadComments();
});
const adminActions = el('div', 'review-actions');
adminActions.hidden = true;
adminActions.append(button(t('导出全部评论', 'Export all comments'), exportComments), button(t('退出管理', 'Leave administration'), async () => {
  adminToken = '';
  sessionStorage.removeItem('tax-review-admin');
  isAdmin = false;
  renderAdmin();
  await loadComments();
}));
adminBox.append(adminForm, adminActions);
panel.append(heading, intro, actions, filters, status, composer, list, more, adminBox);
const selectionButton = button(t('添加评论', 'Add comment'), () => { if (selectionTarget) compose(selectionTarget); }, 'review-selection');
selectionButton.hidden = true;
selectionButton.addEventListener('pointerdown', event => event.preventDefault());
const selectionBar = el('div', 'review-select-bar');
selectionBar.hidden = true;
selectionBar.append(el('span', '', t('点击要评论的组件，按 Esc 取消', 'Choose a component · Esc to cancel')),
  button(t('取消', 'Cancel'), stopSelection));
root.append(launch, panel, selectionButton, selectionBar);

const errors = {
  not_owner: t('你没有修改这条评论的权限。', 'You cannot change this comment.'),
  invalid_admin_token: t('管理员凭证无效。', 'Invalid administrator key.'),
  revision_conflict: t('评论已被更新，请刷新列表后再修改。', 'This comment changed. Refresh before editing.'),
  too_many_requests: t('提交过于频繁，请稍后再试。', 'Too many submissions. Please wait a moment.'),
  invalid_comment: t('请检查姓名、评论和选区长度。', 'Check your name, comment and selection length.'),
  not_found: t('这条评论已删除或不存在。', 'This comment is no longer available.'),
  reply_limit: t('此讨论已达到 100 条回复。', 'This thread has reached 100 replies.'),
};
async function request(path, { method = 'GET', data, admin = adminToken } = {}) {
  status.textContent = t('正在连接…', 'Connecting…');
  const headers = { 'X-Author-Token': authorToken };
  if (admin) headers['X-Admin-Token'] = admin;
  if (data) headers['Content-Type'] = 'application/json';
  const response = await fetch(base + path, { method, headers, body: data ? JSON.stringify(data) : undefined, signal: AbortSignal.timeout(15000) });
  if (!response.ok) {
    const message = response.headers.get('Content-Type')?.includes('application/json') ? await response.json() : {};
    status.textContent = errors[message.error] || t(`操作失败（${response.status}），请稍后重试。`, `Request failed (${response.status}). Please try again.`);
    return null;
  }
  status.textContent = '';
  return response.json();
}
// 网络错误保留草稿，并由浏览器报告原始错误。
window.addEventListener('unhandledrejection', event => {
  if (event.reason instanceof TypeError || event.reason?.name === 'TimeoutError') {
    status.textContent = t('评论服务连接失败，输入内容已保留。请检查网络后重试。', 'Could not connect. Your draft is preserved; check your connection and retry.');
  }
});
function renderAdmin() { adminForm.hidden = isAdmin; adminActions.hidden = !isAdmin; }
async function openPanel() {
  panel.hidden = false;
  launch.setAttribute('aria-expanded', 'true');
  if (!rows.length) await loadComments();
}
function closePanel() {
  panel.hidden = true;
  launch.setAttribute('aria-expanded', 'false');
  launch.focus();
}
async function loadComments(append = false) {
  const generation = ++loadGeneration;
  const params = new URLSearchParams();
  if (scope.value === 'page') { params.set('page', page); params.set('locale', locale); }
  if (state.value) params.set('state', state.value);
  if (append && nextCursor) params.set('before', nextCursor);
  const result = await request('/comments?' + params);
  if (!result || generation !== loadGeneration) return;
  rows = append ? [...rows, ...result.comments] : result.comments;
  nextCursor = result.next;
  isAdmin = result.admin;
  renderAdmin();
  renderComments();
}
function renderComments() {
  list.replaceChildren();
  const roots = rows.filter(row => !row.parentId);
  if (!roots.length) list.append(el('p', 'review-empty', t('还没有评论。选中页面内容，留下第一条意见。', 'No comments yet. Select something on the page to leave feedback.')));
  for (const row of roots) {
    const card = el('article', 'review-thread');
    card.dataset.commentId = row.id;
    const target = button(row.target.label || row.target.quote.slice(0, 70), () => locate(row), 'review-target-link');
    card.append(target);
    if (scope.value === 'all') card.append(el('p', 'review-muted', `${row.locale.toUpperCase()} · ${row.page}`));
    card.append(renderComment(row));
    for (const reply of rows.filter(item => item.parentId === row.id)) card.append(renderComment(reply));
    const footer = el('div', 'review-actions');
    footer.append(button(t('回复', 'Reply'), () => compose(row.target, { parent: row })),
      button(t('复制链接', 'Copy link'), async () => {
        await navigator.clipboard.writeText(commentURL(row).href);
        status.textContent = t('评论链接已复制。', 'Comment link copied.');
      }));
    if (row.canEdit) footer.append(button(row.state === 'open' ? t('标记已解决', 'Resolve') : t('重新打开', 'Reopen'), async () => {
      if (await request('/comments/' + row.id, { method: 'PATCH', data: { revision: row.revision, state: row.state === 'open' ? 'resolved' : 'open' } })) await loadComments();
    }));
    card.append(footer);
    list.append(card);
  }
  more.hidden = !nextCursor;
}
function renderComment(row) {
  const item = el('div', row.parentId ? 'review-comment review-reply' : 'review-comment');
  const meta = el('div', 'review-meta');
  meta.append(el('strong', '', row.deleted ? t('评论已删除', 'Comment deleted') : row.author),
    el('time', '', new Date(row.createdAt).toLocaleString(english ? 'en-US' : 'zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })));
  if (!row.parentId) meta.append(el('span', `review-state ${row.state}`, row.state === 'open' ? t('待处理', 'Open') : t('已解决', 'Resolved')));
  item.append(meta, el('p', 'review-body', row.body));
  if (row.canEdit) {
    const controls = el('div', 'review-actions');
    controls.append(button(t('编辑', 'Edit'), () => compose(row.target, { edit: row })), button(t('删除', 'Delete'), async () => {
      if (!window.confirm(t('确定删除这条评论？其他人的回复会保留。', 'Delete this comment? Other replies will remain.'))) return;
      if (await request('/comments/' + row.id, { method: 'DELETE', data: { revision: row.revision } })) await loadComments();
    }));
    item.append(controls);
  }
  return item;
}
function compose(target, options = {}) {
  if (composition && !composer.hidden && bodyInput.value.trim() && !window.confirm(t('放弃当前尚未提交的内容？', 'Discard the current unsent draft?'))) return;
  stopSelection(false);
  selectionButton.hidden = true;
  composition = { target, id: crypto.randomUUID(), ...options };
  composer.hidden = false;
  panel.hidden = false;
  launch.setAttribute('aria-expanded', 'true');
  composerTitle.textContent = options.edit ? t('编辑评论', 'Edit comment') : options.parent ? t('回复评论', 'Reply') : t('添加评论', 'Add comment');
  quote.textContent = target.quote || target.label;
  nameInput.value = options.edit ? options.edit.author : localStorage.getItem('tax-review-name') || '';
  bodyInput.value = options.edit ? options.edit.body : '';
  save.textContent = options.edit ? t('保存修改', 'Save changes') : t('提交评论', 'Post comment');
  composer.scrollIntoView({ block: 'nearest' });
  (nameInput.value ? bodyInput : nameInput).focus();
}
async function submitComment(event) {
  event.preventDefault();
  if (!composition || !nameInput.value.trim() || !bodyInput.value.trim()) return;
  save.disabled = true;
  const draft = composition;
  try {
    const data = { author: nameInput.value.trim(), body: bodyInput.value.trim() };
    const result = draft.edit
      ? await request('/comments/' + draft.edit.id, { method: 'PATCH', data: { ...data, revision: draft.edit.revision } })
      : await request('/comments', { method: 'POST', data: { ...data, id: draft.id, parentId: draft.parent?.id || null, page, locale, target: draft.target } });
    if (!result) return;
    if (!draft.edit) localStorage.setItem('tax-review-name', data.author);
    bodyInput.value = '';
    composer.hidden = true;
    composition = null;
    await loadComments();
    status.textContent = t('评论已保存。', 'Comment saved.');
  } finally { save.disabled = false; }
}

const candidates = 'section, article, figure, table, form, aside, details, .panel, .pixel-scene, .catalog-card, .sim-metric, .field, button, img, h1, h2, h3, p';
const shortHash = text => {
  let hash = 2166136261;
  for (const char of text) hash = Math.imul(hash ^ char.codePointAt(0), 16777619);
  return (hash >>> 0).toString(16);
};
function componentLabel(node) {
  return (node.getAttribute('aria-label') || node.querySelector('h1,h2,h3,label,figcaption')?.textContent || node.getAttribute('alt') || node.textContent).trim().slice(0, 300);
}
function selectorFor(node) {
  if (node.id) return '#' + CSS.escape(node.id);
  for (const attr of ['data-pixel-scene', 'data-case', 'data-step', 'data-method', 'data-rate', 'data-compare', 'data-case-panel', 'aria-labelledby']) {
    if (node.hasAttribute(attr)) {
      const value = `${node.tagName.toLowerCase()}[${attr}="${CSS.escape(node.getAttribute(attr))}"]`;
      if (document.querySelectorAll(value).length === 1) return value;
    }
  }
  if (node.matches('.catalog-card')) return `.catalog-card[data-tool-id="${CSS.escape(node.dataset.toolId)}"]`;
  if (node === main) return 'main';
  if (!node.dataset.reviewKey) {
    const parent = node.parentElement.closest('[id]');
    const key = shortHash([node.tagName, parent?.id, componentLabel(node)].join('|'));
    node.dataset.reviewKey = key;
  }
  return `[data-review-key="${node.dataset.reviewKey}"]`;
}
function contentNode(selector) {
  if (selector === 'main') return main;
  const matches = main.querySelectorAll(selector);
  return matches.length === 1 ? matches[0] : null;
}
function identifyComponents() { main.querySelectorAll(candidates).forEach(selectorFor); }
identifyComponents();
function context() {
  return {
    fields: [...main.querySelectorAll('input[id],select[id],textarea[id]')].filter(node => !['password', 'file', 'hidden'].includes(node.type)).map(node => ({ id: node.id, value: node.value, checked: Boolean(node.checked) })),
    buttons: [...main.querySelectorAll('button[aria-pressed="true"],button[role="tab"][aria-selected="true"]')].map(selectorFor),
    details: [...main.querySelectorAll('details[open]')].map(selectorFor),
    hash: location.hash,
  };
}
function targetFor(node, kind = 'component') {
  return { kind, selector: selectorFor(node), label: componentLabel(node), quote: node.textContent.trim().slice(0, 4000), prefix: '', suffix: '', version: commentsConfig.version, context: context() };
}
function pageTarget() { return { ...targetFor(main, 'page'), label: document.title, quote: '' }; }
function selectedText() {
  if (selecting) return;
  const selection = window.getSelection();
  if (!selection.rangeCount || selection.isCollapsed || !main.contains(selection.anchorNode) || !main.contains(selection.focusNode)) { selectionButton.hidden = true; return; }
  const range = selection.getRangeAt(0);
  const text = range.toString();
  if (!text.trim() || text.length > 4000) { selectionButton.hidden = true; return; }
  const ancestor = range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE ? range.commonAncestorContainer : range.commonAncestorContainer.parentElement;
  const component = ancestor.closest(candidates) || main;
  const preceding = document.createRange();
  preceding.selectNodeContents(component);
  preceding.setEnd(range.startContainer, range.startOffset);
  const offset = preceding.toString().length;
  selectionTarget = { ...targetFor(component, 'text'), quote: text, prefix: component.textContent.slice(Math.max(0, offset - 60), offset), suffix: component.textContent.slice(offset + text.length, offset + text.length + 60) };
  const rect = range.getBoundingClientRect();
  selectionButton.hidden = false;
  selectionButton.style.left = `${Math.max(12, Math.min(innerWidth - 145, rect.left))}px`;
  selectionButton.style.top = `${Math.max(8, Math.min(innerHeight - 55, rect.bottom + 8))}px`;
}
document.addEventListener('selectionchange', selectedText);
document.addEventListener('scroll', () => { selectionButton.hidden = true; }, true);
function startSelection() {
  selecting = true;
  identifyComponents();
  panel.hidden = true;
  selectionButton.hidden = true;
  selectionBar.hidden = false;
  document.body.classList.add('review-selecting');
  for (const node of main.querySelectorAll(candidates)) {
    if (!node.hasAttribute('tabindex') && node.checkVisibility()) { node.dataset.reviewFocus = ''; node.tabIndex = 0; }
  }
  main.querySelector('[data-review-focus]')?.focus();
}
function stopSelection(reopen = true) {
  if (!selecting) return;
  selecting = false;
  selectionBar.hidden = true;
  hoverTarget?.classList.remove('review-hover');
  document.body.classList.remove('review-selecting');
  main.querySelectorAll('[data-review-focus]').forEach(node => { node.removeAttribute('tabindex'); delete node.dataset.reviewFocus; });
  if (reopen) { panel.hidden = false; launch.setAttribute('aria-expanded', 'true'); }
}
function pickable(node) {
  if (!(node instanceof Element) || !main.contains(node)) return null;
  const component = node.closest(candidates);
  return component && document.querySelectorAll(selectorFor(component)).length === 1 ? component : null;
}
document.addEventListener('pointermove', event => {
  if (!selecting) return;
  hoverTarget?.classList.remove('review-hover');
  hoverTarget = pickable(event.target);
  hoverTarget?.classList.add('review-hover');
});
document.addEventListener('click', event => {
  if (!selecting || root.contains(event.target)) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  const selected = pickable(event.target);
  if (selected) compose(targetFor(selected));
}, true);
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { if (selecting) stopSelection(); else if (!panel.hidden) closePanel(); selectionButton.hidden = true; }
  if (selecting && event.key === 'Enter' && main.contains(event.target)) {
    event.preventDefault(); event.stopImmediatePropagation();
    const selected = pickable(event.target);
    if (selected) compose(targetFor(selected));
  }
}, true);
function commentURL(row) {
  const url = new URL(`../${row.locale}/${row.page}`, location.href);
  url.searchParams.set('comment', row.id);
  url.hash = row.target.context.hash;
  return url;
}
function textRange(node, target) {
  const text = node.textContent;
  const matches = [];
  let offset = text.indexOf(target.quote);
  while (offset >= 0 && target.quote) {
    if (text.slice(Math.max(0, offset - target.prefix.length), offset) === target.prefix && text.slice(offset + target.quote.length, offset + target.quote.length + target.suffix.length) === target.suffix) matches.push(offset);
    offset = text.indexOf(target.quote, offset + 1);
  }
  if (matches.length !== 1) return null;
  const start = matches[0], end = start + target.quote.length;
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let current, position = 0, started = false;
  while ((current = walker.nextNode())) {
    const length = current.textContent.length;
    if (!started && position + length > start) { range.setStart(current, start - position); started = true; }
    if (started && position + length >= end) { range.setEnd(current, end - position); return range; }
    position += length;
  }
  return null;
}
function restoreContext(saved) {
  for (const selector of saved.buttons) {
    const node = contentNode(selector);
    if (node instanceof HTMLButtonElement && (node.hasAttribute('aria-pressed') || node.getAttribute('role') === 'tab')) node.click();
  }
  for (const field of saved.fields) {
    const input = document.getElementById(field.id);
    if (!input || !main.contains(input)) continue;
    input.value = field.value;
    if (['radio', 'checkbox'].includes(input.type)) input.checked = field.checked;
  }
  for (const field of saved.fields) {
    const input = document.getElementById(field.id);
    if (!input || !main.contains(input)) continue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
  }
  main.querySelectorAll('details').forEach(node => { node.open = false; });
  for (const selector of saved.details) { const node = contentNode(selector); if (node instanceof HTMLDetailsElement) node.open = true; }
  if (saved.hash) { history.replaceState(null, '', location.pathname + location.search + saved.hash); window.dispatchEvent(new HashChangeEvent('hashchange')); }
}
function locate(row, restore = false) {
  if (row.page !== page || row.locale !== locale) { location.href = commentURL(row); return; }
  if (restore) restoreContext(row.target.context);
  for (const selector of row.target.context.buttons) {
    const node = contentNode(selector);
    if (node instanceof HTMLButtonElement && (node.getAttribute('role') === 'tab' || node.hasAttribute('data-case'))) node.click();
  }
  identifyComponents();
  const selectedNode = contentNode(row.target.selector);
  status.replaceChildren();
  if (!selectedNode) status.append(document.createTextNode(t('原位置已变更。原始引用保留在评论中。', 'The original location changed. The quote is preserved.')));
  else {
    const node = selectedNode;
    let parent = node.parentElement;
    while (parent) { if (parent instanceof HTMLDetailsElement) parent.open = true; parent = parent.parentElement; }
    highlighted?.classList.remove('review-highlight');
    CSS.highlights?.delete('review-text');
    highlighted = node;
    node.classList.add('review-highlight');
    const range = row.target.kind === 'text' ? textRange(node, row.target) : null;
    if (range && CSS.highlights) CSS.highlights.set('review-text', new Highlight(range));
    if (row.target.kind === 'text' && !range) status.append(document.createTextNode(t('原文已变更，请查看原始引用。', 'The selected text changed. See the original quote.')));
    node.scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (innerWidth < 760) closePanel();
  }
  if (row.target.context.fields.length || row.target.context.buttons.length) status.append(button(t('恢复评论时的参数', 'Restore saved inputs'), () => locate(row, true)));
  const original = el('details', 'review-original');
  original.append(el('summary', '', t('评论时的内容', 'Original content')), el('blockquote', 'review-quote', row.target.quote || row.target.label));
  status.append(original);
}
async function exportComments() {
  const exported = [];
  let cursor = null;
  do {
    const data = await request('/comments' + (cursor ? '?before=' + encodeURIComponent(cursor) : ''));
    if (!data) return;
    exported.push(...data.comments.map(({ canEdit, ...comment }) => comment));
    cursor = data.next;
  } while (cursor);
  const url = URL.createObjectURL(new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), comments: exported }, null, 2)], { type: 'application/json' }));
  const link = el('a');
  link.href = url;
  link.download = 'international-tax-comments.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const commentId = new URLSearchParams(location.search).get('comment');
if (commentId && /^[0-9a-f-]{36}$/.test(commentId)) {
  const result = await request('/comments/' + commentId);
  if (result) {
    rows = result.comments;
    isAdmin = result.admin;
    renderAdmin();
    renderComments();
    panel.hidden = false;
    launch.setAttribute('aria-expanded', 'true');
    locate(rows[0]);
  }
}
