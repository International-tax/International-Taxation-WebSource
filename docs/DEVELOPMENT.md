# 维护说明

本项目使用 HTML、CSS 和原生 JavaScript，无需构建。

网站使用暖白背景、白色卡片、陶土橙主色与暖棕辅助色。公共颜色变量位于 `assets/css/style.css`，像素插图色板位于 `assets/js/pixel.js`；图例与计算图表共用对应的颜色变量。

## 目录

- `cn/`：中文首页、第一至第七章页面和章节计算脚本。
- `en/`：英文版本，文件名与中文版对应，页面 ID 与计算逻辑保持一致。
- `assets/css/`：公共样式；`simulator.css` 提供章节共用图表组件，`pixel.css` 控制像素场景。
- `assets/js/`：移动端参数展开等公共脚本；`catalog.js` 登记模拟器目录与顺序，`catalog-view.js` 生成目录、分类筛选与先修导航，`pixel.js` 提供 SVG 绘图基础和案例注册接口。
- `assets/images/`：头像、校标和图标。
- 根目录的 HTML：默认中文入口及各章短地址跳转。

## 本地预览与检查

在仓库根目录运行：

```sh
python3 -m http.server 8000
```

打开 <http://localhost:8000/>。修改后运行：

```sh
python3 scripts/check_site.py
```

检查需要 Python 3 和 Node.js，用于验证本地资源路径、双语页面对应关系及 JavaScript 语法。计算与排版的改动还应在浏览器中检查。

## 更新章节

1. 在 `cn/` 和 `en/` 同步修改对应页面与脚本。
2. 保持计算逻辑与输入范围一致，分别维护文案。
3. 检查语言切换、默认结果、输入错误提示和重置。
4. 通过 PR 合入 `main`。

## 目录与新增工具

首页将全部工具放在连续目录中，桌面使用两列横向卡片，手机使用单列；按“基础计算 → 判断基础 → 综合应用 → 进阶专题”排序并提供分类筛选。整张卡片为原生链接，支持键盘和新标签页打开。教材章号作为来源标记。`assets/js/catalog.js` 是唯一目录数据源，目录与章节导航由 `catalog-view.js` 生成；先修链接显示在各工具页面。

新增工具时：

1. 在中英文 `cn/`、`en/` 建立同名页面和脚本，保持 ID、输入范围与计算逻辑一致。
2. 在 `catalog.js` 登记 `id`、`stage`、`order`、标题、路径、原材料和 `requires`；只改这一处即可插入目录和推荐顺序。
3. 在页面 `<body>` 设置 `data-tool-id`，加载目录脚本，并保留 `data-tool-context` 与 `data-sequence-nav` 挂载点。
4. 首页提供四个分类的筛选；`requires` 用于生成工具页面的“相关基础”链接。非主线资料可进入目录，不强制插入前后顺序。
5. 实际点击新增卡片、筛选、先修链接和语言切换，再运行全站检查。

专题来源：`chapter-1-profit.html` 对应原材料 `低税与利润转移研究手记.html`，包含三项研究、关联费用与 15% 简化补足税及 Crossref 检索；`chapter-1-cases.html` 对应 `三案规则练习.html`，保留 Crown Forest、Prévost Car、Thiel 的计算、三步流程、练习和来源链接。

## 像素案例维护

各章节完成输入验证和计算后调用 `TaxPixel.update(type, state)`，输入无效时调用 `TaxPixel.clear(type)`。场景模块通过 `TaxPixel.registerLessons` 注册，使用章节传入的实际结果。

- `pixel-investment.js`：咨询工作台与抵免闸口、CEN 分叉选择与 CIN 汇入市场、工厂费用流与法域利润储罐。
- `pixel-jurisdiction.js`：居民身份日历与协定阶梯、注册证与管理证据、九类所得的交易现场。
- `pixel-transactions.js`：远程办公房间、逐服务日日历、扣缴分流与抵免凭证、三个判例的驳船、股息支配和证券交易。

各模块具有同名 CSS。页面先加载 `pixel.js`，随后加载对应场景模块，最后执行章节计算脚本。静态场景表达主体与交易关系；金额、比例和条件状态由当前输入更新。

资本中性比较固定相同税前收益和税基：CEN 固定 A 国投资者，比较投资 A 国与 B 国；CIN 固定 B 国市场，比较 A 国与 B 国投资者。减除方法选择器同时更新两组税额。B 国对两类投资者适用相同来源国税率。

境外所得税收减除页面使用顶部标签页，默认展示“四种减除方法”，第二个标签展示“两种资本中性”。两部分共用计算参数，切换时保留输入与结果；`chapter-3-tabs.js` 管理标签切换、方向键操作和链接中的页面位置，语言切换保留当前标签。

修改场景后，检查两种语言、无效输入与重置、零金额、抵免限额、负税后所得、31/183 天、60%/80% 所有权、九类来源联结、案例切换和手机文字换行。

## 原始材料与引用

参考文献以 `../textbook/` 中的原始 HTML 为准，讲义用于理解背景。迁移和精简页面时保留文献作者、年份、链接、附表、页码、判决段落及影响数据解释的口径说明，并同步中英文页面。

- `第一章/模拟器/低税与利润转移研究手记.html`：三个固定研究链接，包含 OECD 第 11 项行动报告、García-Bernardo 与 Janský 的论文附表 A.12，以及 Bachas 等的研究；保留 Crossref 检索。
- `第一章/模拟器/三案规则练习.html`：五个判决与参考材料链接。Crown Forest 保留第 3—7、55—58 段及案号 23940；Prévost Car 保留 PDF 第 80 页与判决第 3、16—19 段；Thiel 保留完整判例编号、各法官意见段落及引用解释材料。

研究链接显示在相应文献条目中；判例来源随案例切换直接显示，裁判说理与引用段落可展开阅读。

协定判例页面在案例选择按钮下方展示“当事人与交易”和“核心争议”，随后进入金额计算、规则与练习。背景内容随案例切换，中英文页面分别维护。

## 静态部署

发布目录为仓库根目录。路径均相对于页面，适用于 GitHub Pages 项目路径及 Vercel 静态托管。

- GitHub Pages：Settings → Pages → Deploy from a branch，选择 `main` 和 `/ (root)`。`.nojekyll` 用于直接发布静态文件。
- Vercel：导入仓库，Framework Preset 选择 Other，无需构建命令，发布根目录。

仓库创建与网站部署是两个独立步骤。

## 网页评论

全站评论由 `catalog-view.js` 加载共用模块 `assets/js/comments.js`，样式位于 `assets/css/comments.css`。Cloudflare Workers 与 D1 服务位于 `comments-service/`。作者权限、管理员入口、本地开发和检查方式见 [COMMENTS.md](COMMENTS.md)。
