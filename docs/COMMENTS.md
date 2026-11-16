# 网页评论

中文与英文页面右下角提供“评论 / Comments”入口。选择文字后可以直接添加评论；在评论面板中点击“选择组件”，可以选择图表、表格、卡片和页面组件。键盘用户可以使用 Tab 选择组件，按 Enter 确认，按 Esc 取消。

## 作者权限

首次提交填写姓名，浏览器保存姓名和随机作者凭证。相同浏览器中的作者可以编辑、删除自己的评论和回复，也可以将自己的讨论标记为已解决或重新打开。全部评论公开可见。

作者权限绑定浏览器凭证。输入相同姓名不会取得其他浏览器提交的评论的权限。清除网站数据、使用隐私浏览或更换设备后，需要由管理员协助修改原有评论。同一浏览器配置应由同一位审阅者使用。

删除评论后移除正文和署名；如果该评论还有其他人的回复，列表保留“评论已删除”占位，回复继续显示。

## 管理员

打开评论面板底部的“管理员”，填写管理员凭证。管理员可以编辑、删除全部评论和回复，设置讨论的处理状态，并导出全部现存评论及引用、定位和计算参数。

当前设备的凭证保存在 `~/.config/international-tax/comments-admin.txt`，文件权限为 `0600`。部署使用同目录的 `comments-secrets.json`，其中保存凭证的 SHA-256 摘要。服务器仅保存摘要。管理员会话保留在当前浏览器标签页，点击“退出管理”会清除会话。

在新设备上需要保留现有管理员凭证。`comments-service/scripts/create-admin.mjs` 用于首次生成凭证，已有文件时会终止，避免覆盖。

## 引用与定位

每条讨论保存页面、语言、组件标识、原始引用、文字上下文、版本标记以及当前计算参数、案例、标签页和展开状态。点击评论顶部的引用可以定位；“恢复评论时的参数”会应用所保存的输入并重新计算。

原文变更或组件移除后，原始引用继续保留。无法唯一确定位置时会显示提示。中英文评论分别关联对应页面，“全部页面”可以统一阅读两种语言的意见。评论链接使用 `comment` 查询参数，同时保留章节标签页的位置。

## Cloudflare 服务

- Worker：`international-tax-comments`。
- D1：`international-tax-comments`，数据库 ID 为 `693558d1-3105-4177-aabf-df167e76c56f`。
- 网站接口地址配置位于 `assets/js/comments-config.js`。
- 允许的网站来源配置位于 `comments-service/cloudflare.config.ts`。
- 项目使用 Workers 与 D1 免费额度；不自动升级套餐。
- 每个来源 IP 每分钟最多提交 30 条评论或回复，正文最多 4000 字符，姓名最多 60 字符。每个讨论最多保留 100 条未删除回复。
- 评论与回复按需加载，列表每次返回 30 个讨论；使用版本号检查并发修改，避免覆盖他人刚保存的内容。

服务目录使用 Hono、Zod、Cloudflare CLI 与 Vite。运行时及开发依赖通过 `package-lock.json` 固定版本，项目提供 Node.js 24 的本地开发依赖；使用 npm scripts 会选用项目中的 Node.js。

## 本地开发

在 `comments-service` 目录运行：

```sh
npm ci
npm run dev
```

本地服务读取本机管理员凭证摘要，监听 `127.0.0.1:8787`，自动初始化本地 D1。开发数据库保存在 `.cloudflare/state/`，与线上 D1 分开。

在仓库根目录启动网站：

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

访问 `http://127.0.0.1:8000/cn/index.html`。本机的 `localhost` 和 `127.0.0.1` 页面使用本地评论服务，正式网站使用 Cloudflare 接口。

## 检查与发布

在仓库根目录运行 `python3 scripts/check_site.py`。在 `comments-service` 目录运行：

```sh
mkdir -p ../.comment-work/runtime
TMPDIR="$PWD/../.comment-work/runtime" npm test
TMPDIR="$PWD/../.comment-work/runtime" npm run test:browser
npm run check:remote
```

浏览器检查需要本机 Google Chrome，并使用 8000 和 8787 端口。运行前停止已有的本地预览服务。测试运行真实 Workers runtime 与 SQLite，发起真实浏览器和接口请求；测试数据与线上数据库分开。浏览器测试检查全部 22 个中英文页面以及桌面、手机操作。

服务发布命令：

```sh
npm run deploy -- --secrets-file "$HOME/.config/international-tax/comments-secrets.json"
```

新增数据库迁移时，先使用 `cf d1 migrations apply` 应用 `migrations/` 中的迁移文件，再发布对应服务代码。数据库初始迁移已经应用。

网站前端通过既有 GitHub Pages 发布流程更新。网页调用评论服务，无需打包现有 HTML 页面。发布前更新 `commentsConfig.version`，以记录本次页面版本。
