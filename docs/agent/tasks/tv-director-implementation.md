# 全新 TV Director 剧本工作台实现

**状态**：执行中
**最后更新**：2026-09-26
**基线**：`e7b1fbce7ee814fb3fd7343b74f68d331f24ec70`（本线实现起点）；本地实现已提交`cb3833ee`、研究`180aac9f`、协调`ba101496`，尚未push。下次业务写入前重新审计实际HEAD并同步本台账/claim基线；受保护资料不动
**认领者**：`codex/tv-director-outline-review-20260926`
**相关文档**：`docs/guides/liblib-tv-director-analysis.md`、`docs/guides/liblib-tv-director-development.md`、`docs/guides/tv-director-skill-fusion.md`
**相关分支 / PR**：无

## 目标

在 DramaClaw 中新增独立 TV Director 工作台，不以现有“虾本” UI 为基线。用户可在画布式页面创建原创/改编作品、设定题材/集数/结构、关联来源、通过配置的文本模型生成可审草稿、保存版本、修改与人工定稿、恢复历史；浮窗/设定器/剧本文档/编辑器操作按现有 LibTV 按钮级报告逐项对照。后续补齐完整 Skill/导演/媒体/多设备等能力前，页面不得谎称已经等价。

首个可验收切片已建立作品/来源/版本/待审变更/事件存储和部分UI。后续完整终点与实施顺序以 `docs/guides/tv-director-skill-fusion.md` v2及其五份专项合同为准；方案v2.1已收口；本轮按WP00/WP01开始实际实现，范围见最新实施方案。

## 非目标

- 不改用户已有 LibTV 项目、原剧本、研究样例或现有 story/freezone 业务行为；不调用 LibTV 付费生成。
- 不声称取得 LibTV 服务端私有 Skill 或能生成逐字相同的文本。
- 本切片不自动触发 H3 视频或扣费媒体任务；后续独立接入有报价/审批的生成路径。

## 现状与证据

- `story_writer.py`/`story.py` 是单文档覆盖与前端拼提示词；`ScriptNode.tsx` 是镜头表节点，不是剧本文档节点；现有画布基础设施和模型网关可复用，但旧 UI 与存储不作新产品合同。
- 研究报告实测了浮窗、Top8 双栏设定器、文档节点/编辑器、两集递进及人工审阅；《非妖哉》EP02 暴露 source EP02 与 workflow ordinal 1 混淆及道具/时间/时长质量问题。网页登录态只用于只读 UI 对照，凭据不入文档。
- `git status` 仅有研究线文档/STATE 和受保护未跟踪本地资料；拟改业务路径 `git diff -- <path>` 无内容。`git branch -a --list '*director*' '*story*'` 无同名远端实现。`origin/main` 与本地 API 注册、路由生成和三语文件重叠；本线仅追加，禁止按整文件覆盖；新模块及路由源无路径重叠。
- 架构选择：按用户上轮确认，在现有仓库中建独立 director 域及 UI，而非沿用旧四阶段页面。首版以项目 `state_dir` 内 SQLite 事务存元数据和小文本；独立 repository 接口隔离持久层，后续可更换 PostgreSQL。这样当前 CE 和 Windows 项目数据路径可落地，仍保留文档版本与乐观锁。若将来迁移数据库，必须单开迁移线。

## 写入边界

| 路径 | 模式 | 作用 |
|---|---|---|
| `docs/agent/STATE.md` | 共享 | 登记本线；保留研究线原有未提交内容 |
| `docs/agent/tasks/tv-director-implementation.md`、`docs/agent/claims/tv-director-implementation.toml` | 独占 | 本线方案和机器范围 |
| `docs/guides/tv-director-skill-fusion.md` | 独占 | short-drama 与可观察 TV Director 工作流的融合设计、阶段合同及验收矩阵 |
| `docs/guides/tv-director/feature-contracts.md`、`skill-contracts.md`、`workflow-contracts.md`、`document-semantics.md` | 独占 | 四份细化合同；scope 使用每份完整精确路径 |
| `docs/guides/tv-director/acceptance-contracts.md` | 共享 | discovery仅串行更新源站十项证据状态；实现验收规则归本线 |
| `docs/guides/tv-director/implementation-map.json`、`source-inventory.json`、`verify-spec.mjs`、`implementation-closure.md` | 独占 | v2.1机器追踪矩阵、方法来源指纹、只读规格校验器、按代码拆分的最终交付与差异处置 |
| `docs/guides/liblib-tv-director-development.md` | 共享 | 与 discovery 双向认领；本线持锁修正旧设计，研究事实不变 |
| discovery 的台账与 scope | 协调 | 仅记录上述共享顺序与交接 |
| `src/novelvideo/director/**` | 独占 | 新工作流、存储、质量门、方法包 |
| `src/novelvideo/api/routes/director.py` | 独占 | 新薄路由 |
| `src/novelvideo/api/__init__.py` | 共享 | 仅新增导演路由注册 |
| 本轮新增测试与9个fixture | 独占 | 精确文件见2026-09-26实施方案及逐文件scope |
| `tests/test_tv_director.py` | 独占 | API/存储回归 |
| `frontend/src/features/director/**` | 独占 | 新工作台 UI、状态与局部样式 |
| `frontend/src/api/director.ts` | 独占 | 前端导演 API 合同 |
| `frontend/src/routes/_app/projects.$project/director.lazy.tsx` | 独占 | 独立项目入口 |
| `frontend/src/routeTree.gen.ts` | 共享 | 根据路由源重新生成，不手写丢旧路由 |
| `frontend/src/components/layout/project-navigation-routes.ts`、`frontend/src/components/layout/project-header-navigation.tsx` | 共享 | 把新工作台加入项目导航，不替换旧虾本入口 |
| `frontend/public/locales/{zh,en,vi}/translation.json` | 共享 | 新键按语言同步追加 |
| `DESIGN.md` | 独占 | 新 director 组件视觉 token 与截图基线记录 |
| `frontend/src/features/story/**`、现有 `freezone/`、`canvas/`、原稿与 cookie | 只读 | 复用取证，不改旧实现或凭据 |

## 协调与冲突

- 2026-09-26 分支集成：本线已有提交在前，`sync-main-remotes` 持唯一锁串行合入 main 的 TV Director。
  三语只保留并合入各线键值；DESIGN按画布和Director各自章节并存。相关claim已互认共享，
  最终冲突集成归同步线，原功能所有权、验收欠项和待办不变；不改技能或收费生成逻辑。

- 2026-09-26提交准备：git-sync-preparation持唯一锁，仅串行修ui-parity与本台账各一处被banned-words钩子拒绝的第三方依赖描述；ui-parity改双向shared，不改UI事实、业务代码、许可结论。准备而非提交/推送。

- 2026-09-25 N01–N10补证：acceptance-contracts.md与discovery双方共享，研究线持唯一锁更新十项证据状态/链接；既定验收策略仍由实现线负责，不将源站观测静默改成产品策略。其余四份专项合同和主指南本轮研究只读。

- **相关工作线**：`liblib-tv-director-discovery` 只负责研究证据；`story-writer` 保持旧功能待验收；`liblib-canvas-parity` 等画布线不被本切片改写。
- **本地已有改动**：STATE 的研究线新行及研究文档属于 discovery，原样保留；`_to_delete/` 与原始样例冻结。
- **远端重复实现**：无 Director 同名分支；`origin/main` 改过 API 注册、生成路由和三语 JSON，改动语义与新功能不同，逐键/逐路由追加，合并时再对账。未在脏工作树 pull/rebase。
- **共享文件顺序**：当前无别的持锁者；本线持锁串行修改。复查发现 story-writer 对 `routeTree.gen.ts` 和项目导航均已有 wildcard 共享，无需改对方台账；新增路由源后由工具生成。API 注册/三语也已有 wildcard 共享，合并时由本线对本轮键负责。

## 实施方案

### 2026-09-26 · 续轮：独立大纲事实与因果证据审查

恢复：main/e7b1fbce，guard 18线457claims、无锁；本线域/测试diff为空（已归属未跟踪），本地origin/main无同域实现、无director/story分支，不fetch/pull。继承用户继续文学质量工作的授权。short-drama /review、episode-writing、adaptation-core、event-coverage已读，知识查询无匹配；保留M07 2.2.0，不上线已否证的长prompt。技能来源/宿主审查职责分开。

验收目标：已保存大纲可显式报价→独立模型审查→逐项证据报告，不再只支持正文。完整brief/source/locked facts按保留原文与offset的语句单元全覆盖；每单元需要逐义务结论，模型遗漏不能变PASS。剥离渲染稿中用户要求、创作禁区与自夸栏目，作为元数据不准当剧情兑现证据；实际情节引文必须属于正文叙事区且可精确定位。文学五维另列，不用平均分抵销违反。有效FAIL不被另一个坏条目抹掉；全正面也只为待人工复核，不等同定稿/实测时长。输入、版本、方法hash、原回包与usage沿现有审批和报告表持久化，失效后不复用。

方案取舍：复用已有purpose=review及quality_reports，不另起隐式多模型链/数据库迁移；保留用户草稿保存与采纳权，不把保存等同文学验收。本切片先支持已保存outline（规划待采纳四文档仍由人工决定，不能冒称其自动门已打通）。审查不自动修订/付费/定稿。已报告的事实FAIL应可见、不可标成可用；完整源事件独立审计、人类证据审批及后续编排强制门仍须另外闭合。

精确路径：新增`src/novelvideo/director/outline_review.py`、`schemas/outline_review.py`、`tests/director/test_outline_review.py`、`tests/director/live_outline_review.py`；修改`quality.py`、`schemas/execution.py`、`execution.py`、`writing.py`、`dispatch.py`、API routes/director.py（只增报告读取）、`frontend/src/api/director.ts`、`frontend/src/features/director/DirectorStudio.tsx`及新增`components/OutlineReviewDialog.tsx`；三语仅director新键、`frontend/src/__tests__/director-execution.test.tsx`；报告literary-benchmark、台账/scope/STATE。既有execution_repository报告保存hook复用，不改费用语义。审查适配器读取已验证M12来源参考，独立大纲方法/系统版本纳入capability，不声称新增完整第七包或获得私有LibTV Skill。不改全局技能、旧业务、源稿、Cookie、模型/代理配置。

步骤：纯类型/输入分层/逐项证据校验及负例→既有审批/派发/报告→页面只读报告与显式收费确认→离线回归→复用上一轮五份真实大纲，各最多一次8192输出token独立审稿（最多5请求；无重买初稿、无自动重试，UNKNOWN停止）。请求上限非结算硬封顶，实际金额unknown保留。若新审稿漏判，留原报告并明确源头未解决，不伪填评审。可追加零费用合成正例检验不是永远FAIL。

类型接点追加已认领`frontend/src/api/director-execution.ts`，只把审稿回执状态扩为UNKNOWN/REVIEWED，保留原M12状态和一次审批语义。

浏览器验收追加既有`tests/director/preview_execution.py`及临时`frontend/director-preview.local.html`：隔离合成已保存大纲与故意失败的审稿回包，用真实API/SQLite点测报告→报价→取消/授权→持久失败报告，不接真实供应商、不读用户作品。真实五例已显示职场与温情漏判，绝不据此开放自动放行；实测结论单独记录。

五例后源头审计分叉：M12整包text含“six check IDs”及正文格式，虽大纲system声明覆盖，仍是可避免的双指令；正确融合应仅载入已钉住short-drama参考，不把分集评审schema和大纲schema混用。沿outline_review.py改为reference-only binding，适配器升1.1.0、旧quote失效；不改M12包或M07。零费用HTTP模拟核验system/JSON模式/一次调用，额外最多一笔同职场旧稿独立审查（总6次，上限仍8192），只隔离这一变量，失败也保留，不能声称已证明因果或根治。真实检验后不再加购。临时费用提示同时修正三语boundedUnknownCost：显示请求token上限而非账单保证。

风险/回退：语句覆盖只是读取覆盖，不证明全部语义被识别；引文匹配不证明推理正确，正面结论仍须人工。模型生成的义务不是用户确认事实表。长source不截断，超上下文预算拒绝。新入口可关闭但不删付费证据/旧版本。验证：定向pytest→全Director pytest、ruff、三语/i18n、前端组件/build、浏览器实际报告/报价/取消（合成provider）及guard；不把UI验证算文学通过，不提交推送/部署。

### 2026-09-26 · 多题材真实文学质量验收（质量优先）

执行分叉（已见五份初稿，不用格式通过替代文学验收）：温情稿改掉明确交接顺序；职场稿只有可能损失、实习生表态支持而无改变结果的动作；悬疑稿在“无备用件”的自设规则后拿出备用衣，且主要靠迟到坦白；奇幻稿多添人物、把最后使用者拒收偷换成别人接收；改编稿核心事件较稳但概要归错修车人/车位。共同缺口是多个字段各自编故事、用创作评价代替事件。按skill-creator的证据驱动修订原则，不叠加样本专用禁令：将M07工作法改为“先确定单一因果主线及状态，再投影交付字段”，明确具体选择/实际后果/规则不便利变更。保留三份short-drama来源参考和原输出schema。升方法版本2.2.1、同步指纹，并将已认领`skills/runtime.py`的允许版本列表作为本轮新增精确路径；不改其他方法、供应商或UI。选职场与规则奇幻两例同输入复测（不预设一定通过）；温情/悬疑/改编不购买修订稿、不宣称已修好。初稿与评审原件原样留存，审稿伪引文不人工回填原响应。

复测否证与最后两次诊断：2.2.1职场漏action/result、setup链接且依然仅有条件性损失；奇幻structureId错误并继续修改能力/人物边界。两例均未进入候选，不把增加提示词视为修复。撤回本轮实验方法/runtime/指纹/test版本变化，精确恢复本轮之前2.2.0的内容（不动既有改动），失败版本已完整冻在request。原计划两次复测审稿改为职场一例“无大JSON约束的故事主线创作→独立请求投影原schema”诊断，总本方仍最多14次；新命令仅加于已认领outline_benchmark.py及离线测试，不接正式产品/审批，不买额外评审，不把单个成功宣称因果证明。输入保留short-drama三份参考、同用户brief/规格；第一步不读旧生成稿或review_checks。第二步完整记录冻结第一步文本与同规格，宿主照常严格校验，失败不补字段。以此辨别上下文/输出负担与纯模型能力，作为后续方案证据而非偷偷新增产品调用费用。

用户要求多套样本尽量对齐，并强调结构只是基础。本轮只验收故事大纲文学质量，沿用已交付M07，不把schema通过计入文学分。Git仍main/e7b1fbce，18线454claims无锁；现有Director增量归本线，拟改路径diff为空（未跟踪），本地origin/main无同域实现、无director/story远端分支，未fetch/pull。继承既有用户真实模型/有价值付费授权，采用隔离合成作品，不改正式稿与旧UNKNOWN。

步骤：①冻结五套各异brief/规格与仅评审可见判据：温情默剧1×120s、现实职场1×180s、公平线索悬疑3×120s、规则约束奇幻喜剧4×90s、完整来源改编1×240s；②逐例走生产quote/grant/dispatch，不调整用户规格换通过；③独立新上下文模型审稿（不提供作者模型/版本/期望结论）并由本会话逐段复核证据，硬错、结构性重写、局部建议分列；④依据已证实问题做窄技能修订，保留旧hash/原稿，最多选两例新意图复测；⑤留全部请求/正文/回包/usage/评分证据、对照局限和复跑方法。审核不等于两名真人盲评，不宣称完整24份基准通过。原M12当前只支持分集正文，因此大纲盲评用显式实验验收器，不伪装已接产品质量门。

费用范围：本轮五次初稿，每次请求上限12288输出token；每份独立评审4096；仅在证据支持修订时最多两份重生成及对应评审，总最多14个本方付费请求，无自动修复/重试。请求上限不当结算承诺，实际费用未知如实记录，推理用量单列可见分项；UNKNOWN保留并停止相关分支。LibTV基线先复用既有合法取证，仅当需要同输入比较时通过用户登录态创建最多两个明确命名的合成纯文本测试项目，不改已有作品、不生成图/视频/正文、不发布分享，记录实际可见费用；不能将不同brief比较包装为配对胜率。该项是本轮质量对标对历史“原站只读”的窄例外。

精确写入：新增`tests/director/outline_benchmark.py`（固定样本/单次显式运行/独立审稿与证据检查）、`tests/director/test_outline_benchmark.py`、`docs/guides/tv-director/literary-benchmark.md`；已认领`tests/director/live_outline.py`仅提取通用一次请求保存以复用审批链；必要语义修订限`src/novelvideo/director/skills/builtin/story-plan/{method.md,manifest.json,provenance.json}`及`skills/pinned.py`、`tests/director/test_outline.py`，先记录证据再preflight；`writing.py`仅允许在需要时保留安全usage分项，不改供应商/密钥/模型选择。文档outline-parity/本台账/scope/STATE同步。全局short-drama参考、用户原稿、既有源站证据只读；完整合成产物仅忽略output/playwright，公开报告只放短证据及聚合结果。

风险/回退：同模型评审偏好、自选样本与一次随机生成不足以证明泛化，采用匿名输入/具体引文/本会话逐段反驳、分离对标和自测结论；所有失败保留、不挑成功样本。无库迁移/UI/正式稿修改；技能回退可恢复旧包hash，已批准任务继续受hash失效门。验证：新验收器零网络离线测试→真实逐例→全Director pytest/ruff/i18n/包hash与quick_validate/gitleaks/guard。文学结论必须有原文锚点和未测边界，不能靠评分表堆满宣布质量一致。

### 2026-09-26 · 优先对齐故事大纲要素，保留 short-drama 方法根基

用户明确本轮先对齐大纲生成要素，并允许完善现有技能；不继续扩展UI或替换short-drama。已恢复现场，18线451claims、无锁；main/e7b1fbce，对拟改域及测试的diff为空（未跟踪增量均属本线），本地远端引用无Director同域实现；无pull/rebase。本轮原站仅只读已交付故事大纲，与已有trial-outline-delivery中write_artifact(skeleton.md)交叉核对：概要设计、故事简述、背景设定、主要关系与压力、全剧分段、为什么能追、钩子/伏笔/适用时反转预设、创作禁区。原站两份产物详略不同，不能把某次“≤6集”策略当成全部故事的硬规则。来源文章和完整用户剧本不入公共文档。

步骤：①建立观察要素→short-drama /plan、开篇/节奏/爽点→类型字段映射，明确 /outline 是分集目录不是故事总纲；②升级现有M07包到2.2.0，保留三份已钉住来源参考，增加完整概要/压力/分段/追看/钩伏反/禁区字段及空表不适用理由；③同一严格schema验证新筹备链及单文档大纲入口，集数/时长/结构/引用ID由冻结参数核对，缺字段失败且保留回包，不自动补空或重买；④确定性渲染中文/英文/越南文栏目，候选预览与采纳使用同一正文，不把内部JSON字段当标题；旧存量仅保守读取，不迁移、不覆盖或假称达到新合同；⑤真实合成模型一笔最多8192输出tokens，用现有报价/审批/派发链，保存完整冻结请求、原始返回、用量与逐要素检查，失败停止，不自动重试；⑥测试单/多集、开放/闭合、缺字段、越界/逆序ID、旧产物、能力版本失效、预览/采纳一致性及全Director回归。

精确边界：`src/novelvideo/director/{planning.py,outline.py,writing.py,dispatch.py,execution_repository.py,workflow.py}`、`schemas/planning.py`、`skills/{runtime.py,pinned.py}`；`skills/builtin/story-plan/{method.md,manifest.json,provenance.json,templates/request.md,schemas/input.json,schemas/output.json,fixtures/contracts.json}`及新增`SKILL.md`；其他三个筹备包仅生成一致的input schema快照/manifest哈希（若通用输入类型改变）。测试`tests/director/{test_outline.py,test_workflow.py,test_execution.py,test_skill_runtime.py,live_outline.py}`和现有`tests/test_tv_director.py`；文档新增`docs/guides/tv-director/outline-parity.md`，更新`skill-contracts.md`/本台账/scope/STATE。系统全局short-drama目录只读，本次改应用真正加载的派生技能，不另造平行创作体系。无路由/数据库迁移/外部API新增，旧报价以能力hash自然失效，旧文档和已完成回包保留。输出显示语言服从preset.output_language，非界面语言。

风险/回退：完整字段会增加输出长度和费用；用一次有上限真实测试测量，禁止拿schema通过宣称文学质量通过。新技能只影响新请求，旧稿不会后台改写。发现已批准旧任务必须先失效，不能用新schema解释未完成旧调用。验证命令：聚焦与全`uv run pytest tests/director tests/test_tv_director.py`、定向ruff、backend i18n、skill quick_validate、guard/diff-check；本轮无CSS改动，不跑像素验收冒充生成验收。

实施分叉：同一严格合同也改变了浏览器合成provider的返回格式，故把`tests/director/preview_execution.py`列入本轮精确边界，同步测试夹具（仅合成回包、零真实模型），避免之后UI回归使用已经无效的旧Markdown假响应。M07使用独立OutlineMethodContext扩展改编单文档模式，其他三个筹备包输入schema无需改动。uv默认缓存被沙盒拒绝，使用已有`.venv/bin/python -m pytest`和ruff；未重装或改环境。

真实验证分叉：第一笔71.84秒、输入19413/输出2388tokens，模型主体有全部栏目，但末尾重复assumptions/setupsNote/reversalsNote并追加未知字段，校验正确拒绝，原始回包留存且无候选/重试。现有传输只在提示词要求JSON，未启用供应商JSON模式；已核本机SDK源码和硅基官方JSON文档。本轮在既定writing/dispatch/planning/outline路径补M07专用`response_format=json_object`，冻结进报价、真实HTTP模拟断言它未丢；增加重复key硬拒绝，不做有损清洗。技能补“已确认事实不得重列假设、具体归属与动作不得写备选”。修正后另建新意图作第二笔最多8192输出token的人工发起验收；第一笔失败不覆盖，总最多两笔，不作自动重试或不明状态重发。JSON模式只保格式，不能冒充语义或schema保证；第二笔仍失败则保留证据，不继续购买。

用户进一步明确“时长应该由用户自己决定”：30秒只是本轮测试值。排查发现历史设定器另有5–3600秒静默钳制，不能继续替用户裁剪输入。本轮追加精确路径`src/novelvideo/director/models.py`、`frontend/src/features/director/DirectorPresetDialog.tsx`、`frontend/src/__tests__/director-ui.test.tsx`（同线独占无diff冲突），将业务范围改为正整数秒，去掉5秒下限与3600秒上限、保留用户输入，不自动套回默认值；非法/空值禁确认，不改布局/样式和文案。增加1/120/5400秒前后端一致、取消回滚、清空不偷改测试。默认120只作新建初值，模板选择继续不覆盖用户时长。时长冲突只能提示并等用户选修改内容或时长，不以模型建议自动更新preset；现有设置CAS流程不改。此次不追加第三笔付费请求。

### 2026-09-26 · 全界面续轮：设置、历史、编辑器及创作入口

画风已逐项从实际弹层读取21张公开无鉴权URL，新增精确 `frontend/public/director-reference/style-00.webp`至`style-20.webp`（仅02是png）；来源映射与hash入reference-assets清单，先claim/preflight后下载。不采集用户作品。发现原站男频显示“男频 -1”文字瑕疵，按既有male语义保留男频，不把显示bug复制入生成参数。

用户要求「全部对齐」，本轮沿UI优先继续，不重复首屏换皮。已恢复438行台账、DESIGN、UI差距与149按钮合同；基线e7b1fbce/main、18线426claims无锁，拟改Director未跟踪文件归本线，三语/DESIGN旧diff归本线保留，包清单/lock干净、无路径认领冲突。本地origin/main无同域实现，不在脏树pull/rebase。

按已登录真实DOM补测全局设置600宽/圆角12/中性38灰、历史320宽/圆角16锚定标题按钮、全屏编辑器52高顶栏/680正文/168目录、附件和模型菜单，再逐屏实施。顺序：①通用锚定弹层/焦点/ESC；②全局设置、通知及输出Token真实设置（自动付费与积分预算无后端能力时明确不可开启，不伪造生效）；历史搜索/空态及真实标题更新，归档若接入须保留费用/正文且不取消任务；③Tiptap富文本、格式/撤销重做/缩放/目录/选区回到创作器，保留原Markdown/版本CAS/私稿恢复和不支持格式保守源码模式；④实际文件入口、模型浮层、当前会话手动菜单、未发稿恢复；⑤题材滚轮/自定义、完整Top8字段、画风图片、画布平移缩放/工具栏；⑥问卷逐题、报价与候选运行态视觉；⑦三视口点击、单位回归、生产构建、安全/i18n/设计检查。新增依赖采用Tiptap 3公开发行包，不复制原站客户端业务源码；原站SVG只采图形，来源/hash补清单，未获再分发许可仍禁止发布。

精确业务路径：DirectorStudio.tsx、DirectorPresetDialog.tsx、director.css、components/DirectorDocumentEditor.tsx、PlanningWorkflow.tsx、ExecutionHistory.tsx、DirectorReferenceIcon.tsx、assets/libtv-icons.json、reference-assets.json；新增components/DirectorPopover.tsx、DirectorSettingsDialog.tsx、DirectorHistoryPopover.tsx、DirectorRichText.tsx、DirectorCanvas.tsx、director-ui-state.ts和assets/preset-templates.json；完整路径均在独占frontend/src/features/director域。依赖仅frontend/package.json及frontend/pnpm-lock.yaml，新增精确claim；测试director-ui.test.tsx/director-execution.test.tsx及新增director-richtext.test.tsx。必要历史写动作限src/novelvideo/director/store.py/models.py、API routes/director.py、frontend/src/api/director.ts与新增tests/director/test_history.py；新接口仅标题/软归档，不改正文或费用权限。三语仅director；DESIGN/UI验收指南/台账/STATE；预览tests/director/preview_execution.py和临时frontend/director-preview.local.html。新增画风资源逐文件取证后追加scope再落盘，不泛认领公共目录。旧画布、用户原稿、密钥和供应商链只读。

风险与回退：富文本往返可能损失未知Markdown→初始不改原文、支持格式往返回归、未知结构保留源码视图；标题与作品规格不能混改→独立CAS命令及审计；浏览器通知拒绝不能假开启；本地设置明确设备范围，不冒充跨设备策略。改动逐组件可回退，保留所有版本/任务/私稿，禁止删库/自动发模型。验证定向Vitest、后端历史/API回归、pnpm build、三语/i18n、DESIGN lint、guard、无外链/凭据扫描与1920/1200/390真实浏览器。未接通分享/插件/媒体不造成功，视觉完成与全功能交付分开记录；不付费生成、不提交推送。

### 2026-09-26 · 用户改为 UI 优先：参考站逐屏对齐

素材收尾追加精确路径 `frontend/src/features/director/components/DirectorDocumentEditor.tsx`：仅将已有关闭X导入切为参考SVG，编辑保存/私稿/选区逻辑不动。该文件为本线未跟踪实现、diff为空，无其他工作线写入；preflight后修改，原组件回归与build覆盖。

追加用户明确要求「图标也用它的素材」：覆盖此前临时装饰占位决定。只采集当前 TV Director/预设公开 UI 所用 SVG 图形和14张公共题材装饰图；不复制头像、用户作品、cookie、签名URL或服务端提示词。新增 `frontend/src/features/director/components/DirectorReferenceIcon.tsx`、`assets/libtv-icons.json`、`assets/reference-assets.json`，14张图仅写 `frontend/public/director-reference/genre-00.webp` 至 `genre-13.webp`，每个文件精确scope；来源/校验hash/未提供再分发许可证的状态留在素材清单，不把用户授权使用等同第三方授权公开再分发。SVG只保留图形白名单、数值/颜色属性，无脚本、事件、HTML或远程链接；以静态React图形渲染，禁止dangerouslySetInnerHTML。复验同视口截图、材质错配及所有图加载成功。文档与DESIGN同步移除“已用占位”的当前状态，但保留历史差异记录；尚未落实的功能仍不伪装成功。

本轮优先级覆盖上一轮 M10 待办，先对齐 TV Director 外观与操作，不调用付费模型。依据研究报告 §3.3、用户截图与本轮登录态只读复验；不能把相似布局宣布为全站像素验收。基线仍为 e7b1fbce；当前 Director 未跟踪实现、DESIGN 与三语已有差异均属本线。已查本地 origin/main(f51c2e44) 及 all-ref Director 路径，无相同新模块实现；共享翻译只追加本线键，不更新远端、不动旧画布/全局 index.css。

验收目标：① scoped 中性灰点阵画布、400×640/28px 浮窗、完整标题栏与欢迎 Top8；②1232×640 双栏设定器、264px Top8、单/双题材圆形布局、六张132×74参数摘要卡，点击进入字段编辑，取消不污染草稿；③节点悬浮工具栏、左目录/富文本正文；④标题栏收起/停靠、模式选择、历史检索、参数弹层键盘与窄屏可用。未落地的分享/插件/媒体按钮提供明确禁用原因，不能做假成功；后端调用和审批合同保持不变。图片资源若无可随产品发布的资产，仅保留可替换装饰位并明确视觉差异，不把第三方示例版权素材直接作为本产品资产。

步骤：读取实际 DOM/截图与历史证据→记录尺寸色值→重构设定器摘要与弹层（原有完整参数保留到高级区）→工作台/浮窗/文档预览及操作反馈→同视口1920×1080、1200×863及390窄屏验证→记录已验证和仍未达到像素一致的条目。

精确写入：现有 `frontend/src/features/director/DirectorStudio.tsx`、`DirectorPresetDialog.tsx`、`director.css`；新增同域 `components/DirectorGenrePicker.tsx`、`components/DirectorWindow.tsx`（如需尺寸交互拆分）；现有 `frontend/src/__tests__/director-execution.test.tsx`、新增 `frontend/src/__tests__/director-ui.test.tsx`；三语 translation.json 仅 director；DESIGN.md 的 Director 专节；预览 `tests/director/preview_execution.py`、临时 `frontend/director-preview.local.html`；新增 `docs/guides/tv-director/ui-parity.md`，以及本台账/scope/STATE。截图/几何测量仅忽略 output/playwright 下保存，无凭据。其他 backend、Skill、原稿与旧画布只读。

验证：聚焦 Vitest（包含取消回滚/字段保留/互斥题材/只读/高级参数）→tsc+Vite build→三语/i18n、DESIGN lint→隔离合成 API 的浏览器截图和交互（不读生产数据、不调用模型）。风险：仅换视觉可能丢字段/审批；以原合约测试及弹层草稿隔离回归。新灰色 token 仅局部覆盖，不改全站主题；回退只撤本轮 UI 差异不碰既有未提交功能和数据。像素差异需如实列出，首屏对齐不代表149动作或全工作流完工。

### 2026-09-26 · 本轮阶段编排、方向问卷及筹备审批

按22工作包完整退出条件核对，目前22包均尚有缺项，不用340个局部测试折算完成率。本轮接WP03–WP07的实际原创入口：方向四选/自由补充→一次方向确认→M07总纲、M08人物场景道具、M09目录的顺序子调用→一次筹备审批。保存父StagePlan、输入版本/方法hash、有限次数及输出上限；子请求从获批依赖生成独立requestHash/Approval/Operation，复用已有outbox与UNKNOWN不重发规则。问卷持久化，版本/恢复标识/操作者/幂等检查；忽略不默认批准，恢复不重买已完成产物。模型JSON按严格schema与集数/时长/结构/ID验证；筹备产物只在显式采纳时全CAS原子提交四类文档，目录作为有hash阶段产物绑定供后续M10使用。旧单文档写作兼容入口保留并明确标记，不谎称已执行M10或完整M11结构化正文。

精确业务边界：新增`src/novelvideo/director/schemas/planning.py`、`planning.py`、`workflow.py`；修改`execution.py`、`execution_repository.py`、`dispatch.py`、`writing.py`、`skills/runtime.py`、`skills/pinned.py`，在`skills/builtin/`新增direction-options/story-plan/character-bible/episode-directory四个校验包及各自manifest、method、schema、template、fixtures、provenance、LICENSE、已读参考；API `src/novelvideo/api/routes/director.py`。新增`tests/director/test_workflow.py`，已有`test_execution.py`、`test_skill_runtime.py`作回归。UI新增`frontend/src/features/director/components/PlanningWorkflow.tsx`，修改`DirectorStudio.tsx`、`director.css`、`frontend/src/api/director-execution.ts`、既有组件测试及三语translation.json；文档更新本台账/scope/STATE、runtime-validation.md及implementation-closure.md的进度链接。其余业务/原稿/研究证据只读。新增独立测试逐文件claim。

步骤：严格stage输出/父预算/决策schema→复用派发事务+结果hook→方向和筹备包校验加载→持久检查点/取消恢复/全CAS采纳→API与实际浮窗入口→单元/API/组件/浏览器验收→条件允许时一个合成方向真实模型请求，保存完整参数回包，不重试历史UNKNOWN。不默认自动修订，不自动展开后续集费用，不改编来源摄取假扮原创。下一集容量规划与全24包等缺项逐包继续保留。

本批验证接点：沿既有claim增加精确`tests/director/preview_execution.py`、`tests/director/live_execution.py`、临时`frontend/director-preview.local.html`与`frontend/src/features/director/components/ExecutionHistory.tsx`。预览新增合成四阶段响应，不读用户数据；真实验收器增加显式原创筹备case（最多方向1次+筹备3次，每次4096输出/300秒、任何失败/UNKNOWN立即停止），固定选择合成方向并记录决定，不生成正文/媒体，不对原失败请求重放。运行前先无费用验证回环连接；完整输出只在忽略output，金额未知继续null。子任务历史显示真实阶段且不将JSON筹备成功误标“草稿已保存”；控制入口统一父编排以传播取消。

现场：main e7b1fbce，guard 18线409claims，无活动锁；拟改Director路径diff为空（均已归本线未跟踪），本地origin/main相同路径无同类变更，skill远端分支只作只读审计，不fetch/pull。三语已有本线增量逐键追加；保留其他工作线diff。风险是父批准扩大范围、阶段结果过期、问卷重放与半采纳，靠冻结DAG/方法/规格、子请求预算事务、CP CAS和故障注入验证。回退关闭新编排入口，保留历史和账本，不恢复隐式重试、不清库。

验证：`.venv/bin/python -m pytest tests/director/test_workflow.py -q`后全Director+网关回归；定向vitest与build；ruff/i18n/CE/guard/diff/密钥扫描；UI先遵循已读DESIGN，不新增色板；真实模型不是mock通过替代，失败如实留存。尚无全量目标完成声明，不提交推送或部署。

### 2026-09-26 · M12 与逐项人工定稿先闭合，然后接阶段编排

在已有AST/费用/参数入口上接独立审稿，不向旧单次批准偷偷附加模型调用。`cost.quote`增加明确purpose=review（默认draft兼容），审稿单独冻结源稿/当前正文/上集/规格与输出schema，沿同一安全批准/派发账本执行。后续阶段父预算将复用该独立子调用，不能自评分冒充独立审稿。M12输出六类检查与原文证据；宿主核验引用、hash、必需类别和确定性错误。非法/截断回包为UNAVAILABLE且保留原始结果与费用；FAIL不得总分覆盖。当前尚未实现的完整source-audit和排演不标PASS。

精确路径：新增`src/novelvideo/director/schemas/quality.py`、`quality.py`、`tests/director/test_quality.py`；修改已有store.py、schemas/execution.py、execution.py、execution_repository.py、dispatch.py、writing.py、API routes/director.py、frontend api/director.ts与director-execution.ts、DirectorStudio.tsx、components/QualityReviewDialog.tsx、三语与两份已有Director测试。上述新模块位于已独占域，测试新增精确claim。本轮检查相关diff/本地origin无同路径实现，旧改动均归本线，继续现有唯一owner。

定稿v2使用版本/hash绑定的逐项人工证据和幂等命令，同事务保存Finalization/上一集边界并推进；canonical作品旧bool接口拒绝，旧legacy保持只读历史和显式迁移边界。版本变化使报告无效，迟到审稿只保留结果不更新当前稿。UI展示检查详情、重新审稿的显式费用预览、必要人工项和制作未验证提示。格式/来源关键失败仍阻断。不能把模型审稿得分当已测试拍摄时长。回退关闭v2新写，不启用bool绕过，不删历史。

验证：合成正确/漏类/伪造证据/过期/越权/并发/重放/UNAVAILABLE/硬失败；后端全Director与网关回归、UI参数/审稿/定稿、build/i18n/ruff。独立审稿接通后在已授权有界真实模型样本验证，保存参数/输出/usage，实际金额未知不计0。

本批验证接点扩展到既有`tests/director/live_execution.py`、`tests/director/preview_execution.py`与临时`frontend/director-preview.local.html`：真实审稿读取上一轮三个已留存合成样本和其原始指令/来源（只读），导入新的隔离测试作品，每例只发一次4096输出token以内的独立审稿，不重买正文、不改原证据、不自动修订。通过新费用批准链；UNKNOWN立即停止后续调用。浏览器fixture增加可解析合成审稿响应，真实页面核验费用/报告/逐项定稿，截图和请求完整证据只写忽略output目录。本机服务仅绑定loopback，关闭自己启动的进程。使用Playwright技能做UI验证，不操作LibTV账户。

浏览器实测追加精确`frontend/src/features/director/components/ExecutionHistory.tsx`：审稿成功不是“草稿已保存”，运行卡按purpose区分审稿与写作，报告FAIL/UNAVAILABLE明确显示。沿原预览及费用权限，不增调用。

迁移/定稿衔接分叉（原合同要求，不更改授权目标）：代码审计发现v2若仍读取旧episode_confirmations，已迁移定稿无法重审，且新版Finalization会被旧表的ordinal主键挡住。改以director_finalizations_v2及按finalizationId的失效记录为canonical权威，legacy表只保留历史不更新。显式迁移回到首集复审，旧正文版本保留；fresh独立审稿与逐项人工确认可解除legacy_unverified门，不伪造生产验证。补`repository.py`失效闭包、`migrations/v2.py`首集复审和`test_migrations.py`/`test_quality.py`正反例：升级两集旧定稿→重新审阅→逐集新定稿，旧确认行逐字保留；修改上游仅使依赖定稿失效，不使较早集被写下集无理由失效。

### 2026-09-26 · 持续完整交付：正文权威与阶段依赖先接入现有操作

本轮继续完整目标，不以执行层切片作为结束。首批实现WP01/WP02/WP11的正文基础：在同一Director SQLite内增加稳定文档/集ID、不可变AST版本、用户草稿、派生产物与依赖失效；新作品直接使用AST权威，旧作品必须先预览、校验一致性备份hash再显式导入。v1读取和编辑作为适配器读取/提交同一AST，Markdown只作确定性投影，不引入两个正文权威。旧确认保留为历史，不迁成v2通过。已有安全执行和未知费用规则保持。

精确路径：`src/novelvideo/director/schemas/documents.py`、`documents.py`、`repository.py`、`migrations/v2.py`、`store.py`、`writing.py`、`src/novelvideo/api/routes/director.py`、`tests/director/test_documents.py`、`tests/director/test_migrations.py`、`frontend/src/api/director.ts`、`frontend/src/features/director/DirectorStudio.tsx`、`components/DocumentVersionPanel.tsx`、三语translation.json及本台账/scope/STATE。业务新文件在已认领新域内，测试逐文件新增。后续方法和界面仍按closure依赖补方案/preflight，不将这一批当全量完成。

步骤：①AST严格类型、保守无损Markdown适配/稳定块ID/UTF16选区及hash；②同事务版本保存和派生依赖闭包失效，阶段结果绑定准确输入版本；③旧数据一致性快照、预览hash/CAS/幂等导入，不自动转换来源编号或旧确认；④接现有创建/读取/编辑/生成快照路径，API权限+严格命令；⑤页面版本/导入/失效提示；⑥迁移、双写竞争、Unicode往返、过期产物和接口回归，再继续阶段运行器。旧数据保留，回退关闭新写不删表、不倒灌旧正文。

本批界面回归同时更新已认领的`frontend/src/__tests__/director-execution.test.tsx`，覆盖旧稿预览取消不升级、确认断线复用意图、当前稿版本标记；新增文档API的鉴权/越权/拒绝未知字段测试放`tests/director/test_documents.py`。不调用真实模型测试纯存储行为。

后续WP06精确路径：`src/novelvideo/director/context.py`、`rules/resolver.py`、`tests/director/test_context.py`、`tests/director/test_rule_resolver.py`、现有`writing.py`/`execution.py`。执行18规则条件白名单、选中/禁用理由、来源hash与上下文必需版本核验；先冻结静态规则和当前空知识库事实，不冒充24个包已加载。M22只做确定性编译，不自动付费摘要，超预算拒绝并保留尾部；上下文数据无系统权限，使用JSON资料区隔。把实际规则清单/manifest hash加入当前生成快照和能力指纹，使旧预览不能执行升级后的编译器。当前旧Preset缺少的商业/反派等确认值保守禁用，不猜用户同意；后续完整Spec再给明确参数。验证条件正/负/冲突、跨作品/hash/缺依赖/超限/Unicode与现有执行回归。新增两测试逐文件scope，其他共享文件不扩展。

WP14参数接点（不替代完整Spec/影响分析）：增加精确`src/novelvideo/director/models.py`、`frontend/src/features/director/DirectorPresetDialog.tsx`，沿已认领writing/API-client/Studio/三语/现有测试落实八种结构、故事基调与画风分离、结局、语言、市场、保真/新增范围/锁定说明及来源/交付标签独立字段。旧preset没有字段时默认值须页面可见并与服务端一致；旧four_act/custom只作为兼容选项显示，不能静默映射成八枚举之一。每个新字段保存→重载→冻结参数→context规则一致性测试；模型版本对话从capability取，不再硬写1.0.0或声称不存在的完整方法包已执行。未实现的影响分析仍不能借编辑规格绕过锁定。

现场：main仍e7b1fbce，402claims无锁；本批路径git diff为空（现有未跟踪模块归本线），本地origin/main无同路径差异、无director/story远端分支；不fetch/pull。冻结两条Director既有diff及其他资料。风险是混合旧接口造成双权威、静默迁移、误复用旧报告，分别由单一事务入口/显式迁移/依赖与hash验证回归阻断。验证先`.venv/bin/python -m pytest tests/director/test_documents.py tests/director/test_migrations.py -q`再Director全套/ruff/i18n/build/真实浏览器；质量真实模型只在阶段已接入后用已授权的有界新意图验证，保留全部失败回执。

### 2026-09-26 · 完整实现续轮：先接真实执行路径，再扩展阶段与界面

用户明确要求认真完成完整TV Director。本轮按v2.1工作包推进；不再把独立函数通过当产品完成。先将WP02–WP05费用/幂等/事件/恢复接入当前可操作的生成入口，使用additive v2表保留旧作品/文档/运行记录；随后按前置推进阶段方法及v2参数/界面。WP00其余fixture与对应行为同时补，而非为了凑齐编号创建不可执行占位。只有实际打通的行为才更新完成状态。

首批精确路径：`src/novelvideo/director/schemas/execution.py`、`src/novelvideo/director/execution_repository.py`、`src/novelvideo/director/execution.py`、`src/novelvideo/director/dispatch.py`、`src/novelvideo/director/writing.py`、`src/novelvideo/api/routes/director.py`、`tests/director/test_execution.py`、`frontend/src/api/director-execution.ts`、`frontend/src/features/director/DirectorStudio.tsx`、`frontend/src/features/director/components/ExecutionHistory.tsx`、`frontend/src/features/director/director.css`、`frontend/src/__tests__/director-execution.test.tsx`、三语`frontend/public/locales/{zh,en,vi}/translation.json`、本台账/scope/STATE。新增API客户端/测试逐文件认领；后续新路径先追加方案与preflight。当前方案不改旧文档存储语义，不隐式迁移/清库，不改其他工作线配置、媒体供应商及共享画布，不调用LibTV或真实付费模型进行试错，不提交推送。

实施：①严格命令、hash绑定quote/approval、一次用户意图的幂等键；②同事务reserve+operation+outbox+event，冻结服务端实际参数与输入；③worker原子领取一次，超时/断线归unknown并保留预留；取消未发任务可释放，已发取消不冒充退款，成功结果只落待审稿；④API仅鉴权/路由，v1写作入口也走同一安全服务避免绕过；⑤页面持久任务投影/刷新恢复/停止/参数与费用确认，并阻止旧任务覆盖新作品；⑥并发/重放/断线/取消/过期/旧版本/无权限API测试、组件测试、构建与真实浏览器本地模拟验收。旧v1读取继续；错误码与三语文案同步。

基线仍e7b1fbce/main，两个Director线脏文件已归属。当前18线392claims、无锁；拟改新域/route/frontend/API/tests的git diff为空（本线未跟踪），本地origin/main相关路径无同类差异；没有pull/fetch。三语仅追加键。风险是远端exactly-once无保证、未知费用不能记0、停止/重启丢回包、用户切作品期间迟到响应；用唯一派发键、持久状态/事件和故障注入验证。回退保留新表/审计，停新写入口，不删除运行数据；无账本的旧自动重试入口不能作为回退手段重新开放。

验证命令：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py -q`；定向ruff；frontend定向vitest及pnpm build；i18n/CE边界/规格回归/gitleaks/guard。交接必须标明已接入路径、尚缺工作包与未跑的真实质量/设备验证。后续阶段涉及short-drama时已重读Skill及路由参考，参数/版权/来源冻结遵从融合合同，不宣称私有Skill还原。

执行分叉：旧`POST generate`没有用户意图ID、用量上限和持久授权；自动包装会把网络重试误判新生成，不能安全兼容。按closure要求保留v1读取，将此单一旧付费入口改为409 `EXECUTION_V2_REQUIRED`，页面同步改v2；不删除旧文档/运行记录，其余旧接口不变。新增精确写入`tests/test_tv_director.py`，只将旧生成测试改为升级拒绝/0调用，其原成功路径迁到真实v2事务/API回归。此前17条结果是历史，不再冒充旧付费写接口仍可调用。

安全接点与浏览器验证：新增本批精确写入`src/novelvideo/director/store.py`，只在同一事务质量门拒绝仍有v2活跃/UNKNOWN任务的定稿，避免旧接口绕过；新增`tests/director/preview_execution.py`仅本地127.0.0.1合成模型验证器、临时`frontend/director-preview.local.html`（完成后移除）加载真实组件/i18n，独立临时数据目录不读用户作品与凭据。截图放忽略的output/playwright；浏览器证据不代表真实模型质量或完整工作台。额外网络只访问本机测试端口。

用户追加真实模型验收授权：模拟不能证明写作质量。本轮增加`tests/director/live_execution.py`显式命令行验收器与`docs/guides/tv-director/runtime-validation.md`结果报告，新增精确scope。在隔离合成故事项目执行原创、保留来源的改编、定向修改三个真实请求，每次最多4096输出token/300秒/一次调用，遇UNKNOWN不重发；默认不运行，须显式传同意计费参数。通过生产quote→approval→dispatch→待审路径，不直连绕过审批。请求快照/完整合成文本输出存忽略目录，公开报告只放合成事实与断言、usage摘要，不存鉴权头/URL/账户信息。增强writing返回安全usage/finish_reason回执、dispatcher保留，实际金额仍未知而非0。不会因写手自评通过就标全套Skill/LibTV等价；失败样本要记录源头和后续修复。

真实链路诊断分叉：首次生成UNKNOWN/1.12秒后停止；不重放该operation。只读GET models对照证明本机回环地址在trust_env=True返回502空体，False返回200。新增精确`src/novelvideo/config.py`（local-stack已wildcard共享）、`tests/test_newapi_text_gateway.py`、协调`docs/agent/tasks/local-stack.md`：仅让未显式设置NEWAPI_TEXT_TRUST_ENV的loopback文本客户端绕过系统代理；远端与显式开关行为不变，不改网关/密钥/启动器。Git此两文件干净，本地origin/main差异仅已有图像选项，与该函数无重叠；前置gitleaks后preflight。回退仅该窄hunk。验证默认远端True、loopbackFalse、显式True/False和真实新意图；首次UNKNOWN仍保留不写0费用。

界面验收补缺：`frontend/src/features/director/DirectorPresetDialog.tsx`现有变更直接写父级草稿，取消实际上未撤销。新增本批精确路径，改为弹窗内独立草稿，确认才传父级/保存，取消/ESC/遮罩丢弃；异步导入用当前草稿合并避免覆盖刚改字段。更新既有DirectorStudio及组件测试。修复375px顶部按钮挤成竖字（不增设计token）、确认费用断线错误展示在当前弹窗内。此不代表八种结构/全部参数字段已补齐。

付费回包保留接点：在本批已列出的execution repository/route/client/history/studio/test/三语路径中增加只读`GET v2/works/{workId}/runs/{runId}/result`，返回项目权限内已保留输出与hash（无prompt/凭据），迟到/取消/截断结果可查看但不可由此直接采用；不发模型。展示安全usage和provider-reported model（不能宣称底层权重验证）。actual_output_tokens记录供应商回执，金额仍unknown。覆盖跨作品访问、缺失结果、只读与不产生新候选的测试。

### 2026-09-26 · 恢复实际实施：WP00/WP01首批硬约束

用户追问为何停止；本轮继续已批准实现，不再仅改方案。验收目标：F01/F03/F05/F11/F17/F19/F23/F27/F28九类匿名fixture变成真实代码调用的正负断言；严格v2模型拒绝未知字段/错误类型/非法版本；来源读取与独立审计分离、依赖闭包、声画DAG、引用稳定顺序、Skill回执和问卷CAS、UNKNOWN恢复有可运行纯函数。此为WP00/WP01首批，不冒充全49schema/184命令/33fixtures或已接前端与数据库。

精确写入：`src/novelvideo/director/schemas/__init__.py`、`src/novelvideo/director/schemas/common.py`、`src/novelvideo/director/schemas/foundation.py`、`src/novelvideo/director/semantic_validator.py`、`src/novelvideo/director/duration.py`、`src/novelvideo/director/references.py`、`src/novelvideo/director/recovery.py`、`src/novelvideo/director/checkpoints.py`、`tests/director/test_foundation.py`、`tests/fixtures/director/cases/f01.json`、`tests/fixtures/director/cases/f03.json`、`tests/fixtures/director/cases/f05.json`、`tests/fixtures/director/cases/f11.json`、`tests/fixtures/director/cases/f17.json`、`tests/fixtures/director/cases/f19.json`、`tests/fixtures/director/cases/f23.json`、`tests/fixtures/director/cases/f27.json`、`tests/fixtures/director/cases/f28.json`，以及本台账、scope和STATE。现有models/store/writing/API/UI只读，兼容v1；新增schema与纯函数由后续repository/route接入。没有模型/第三方付费调用，不改用户数据/运行栈/凭据，不提交推送。

步骤：①读权威语义/状态合同、现有Pydantic/测试并查diff；②定义严格类型和结构化错误，建立九类合成输入/预期；③实现纯确定性守卫与schema验证，不由模型自报完成；④正负fixture与类型/边界/不变性回归、已有director测试、ruff/guard/规格回归；⑤记录实现范围和未接入边界，交接下一WP。参数为camelCase wire aliases，版本不随显示标签改变，时长未知不计0，关闭/刷新不发新供应商任务。

现场：main e7b1fbce，与zhonggwv/main同步；现有两个Director工作线diff归属明确，18线382claims且无锁。拟改新路径git diff为空；本地origin/main与origin/fix/skill-save-and-workflow-retry在对应域/测试无同路径差异；未fetch/pull。新文件已查不存在，不覆盖首切片。领取唯一锁后按上列路径preflight；新增测试fixture逐文件认领，不扩展宽泛目录。

风险/回退：最主要风险是把输入schema合法等同语义或产品通过；分别返回验证错误/UNKNOWN，并保持未接入项not_implemented。新模块无import副作用、不修改运行数据，回退只撤本批独立文件。验证命令采用现有虚拟环境离线pytest与ruff、node verify-spec --self-test、git diff --check、agent_guard。uv默认缓存受沙箱限制时用现有.venv解释器，不改机器配置。

### 2026-09-25 · 全量方案收口 v2.1（仅文档与规格校验）

用户要求把上一轮明确指出的方案缺口做完。本轮完成定义：149动作/8能力/24方法/18规则/工作流每条转移/夹具全部建立唯一ID和需求→组件→领域用例→接口/本地命令→schema→测试→证据/差异的机器追踪；新增九类实测约束迁入五份权威合同；主指南和历史开发指南仅引用权威规则，不再各自定义；所有剩余源站N有明确产品决策、验收办法与阻断范围。未知不伪造为T，设计就绪不伪称软件已实现。

步骤：①完整复核五合同、最新补证、short-drama主技能/相关方法与当前代码落点；②固定方法来源相对路径/哈希与命令映射；③迁入sourceOrdinal、缺失补位、执行版本receipt、取消恢复、实际媒体偏差、accepted/UNKNOWN、分享allowlist、删除/撤回及OAuth约束；④补实施拆分/旧API迁移/精确命令表、机器矩阵和只读校验器；⑤校验所有ID完整、跨引用闭合、路径存在或明确planned、非法/缺行/假PASS变异样例能报错；⑥文档/安全/guard交接。

基线e7b1fbce/main与zhonggwv/main同步；当前首切片及研究文档未提交均保留。拟改文档git diff为空（已归属未跟踪），对本地origin/main及origin/fix/skill-save-and-workflow-retry无同路径变更；未fetch/pull。guard为18线378claims、无活动锁。新增四路径逐一认领后acquire/preflight；研究报告只读，开发和验收共享由本会话串行修改，研究台账仅追加交接，不改其历史事实。

非目标：不改业务代码/配置/三语/现有测试，不创建运行时Skill，不新发第三方请求/付费生成，不删除项目，不提交推送。风险是把规划路径当已实现、复制旧待测状态、为“收口”降低未知验收门；用不同状态字段及负向校验防止。回退只撤本轮规格增量，不覆盖既有diff。验证命令为node docs/guides/tv-director/verify-spec.mjs及--self-test、git diff --check、定向gitleaks、agent_guard check/handoff/release；业务pytest/build不适用于本轮。

### 2026-09-25 · 审核意见落实（本轮仅文档）

用户要求按审核建议修改。可验收目标：九项审核缺口在五份专项合同中各有唯一权威规则，137 个已编目按钮均映射到命令、持久状态、恢复与测试；消除旧文档的自动末集完成、读块即语义完整、音画简单求和及费用后置等冲突。明确非目标：本轮不写业务代码、不调整模型配置、不运行付费生成，不把文档完整冒充产品已等价。

步骤：① 对照 short-drama 原创/改编方法和现有研究编号；② 完成全功能矩阵、逐 Skill 合同、状态/费用合同、文档语义合同、量化验收合同；③ 主指南改为 v2 权威索引与实施依赖，旧开发指南只对冲突设计作替换/指向；④ 检查按钮 ID 唯一且齐全、链接存在、围栏/空白、敏感数据和 guard；⑤ 台账记结果并 handoff/release。缺 LibTV 实测的分支保留 N 和明确取证动作，不编造成功。

Git/冲突审计：当前 main 基线 e7b1fbce；两条 Director 线既有未提交内容保留。拟改文档为对应工作线已归属新增文件，STATE 原有增量逐行保留。已查本地 origin/main 和相关 skill 分支的路径差异；拟改路径无远端同类实现；未 fetch/pull。开发指南改成双方共享，实现线为本轮最终集成者，研究线不并行写。五份新合同为精确独占路径。

风险与回退：规格分拆可能产生重复权威或断链，主指南建立职责表并检验交叉引用；回退仅恢复本轮文档增量，不动已有业务实现、用户资料或研究观测。验证命令：文档 ID/链接/围栏断言、`git diff --check`、gitleaks 文档扫描、`python3 scripts/agent_guard.py check` 与 handoff/release；没有业务代码修改，不以未运行的 pytest/build 冒充验证。

历史v1文档方案（2026-09-25，已由上方v2续轮替代）：对照本地 `short-drama` Skill、LibTV 取证与当前代码建立初版融合指南，只写设计、不调用付费生成；当时两份研究文档只读。v2已将旧开发指南调整为双方共享以消除冲突，事实分析仍只读。原方案的按阶段/规则/模型/参数/测试追踪原则保留，完整细节以v2为准。

1. 定义 `Work/Preset/Source/EpisodeIdentity/DocumentVersion/ChangeSet/Event` 合同，SQLite 事务、预期版本与安全来源绑定；先用 EP02 编号/选区范围/刷新恢复测试证明行为。
2. 建立服务端原创/改编阶段编译器：从冻结输入和版本化方法包构建提示词，模型输出只落待审稿；硬约束与无法验证项明确展示；需人工定稿后才推进集数，不凭模型自述通过。
3. 新建导演工作台：画布式节点与 400×640 右浮窗、模式菜单、Top8 双栏设定器、输入附件/引用、会话历史、文档全屏编辑/差异接受。三语键及 `DESIGN.md` 与 CSS 同步，旧 story 页面不变。
4. 路由/API 集成后运行聚焦后端测试、前端测试/构建、i18n/ruff/guard；用 Playwright 在 1200×863 和 1920×1080 对照实测页面，真实文本模型一例需明确用户操作且留请求/结果摘要，不浪费供应商积分。
5. 按融合v2 P0–P8补全多集、Skill、导演/全能/媒体与界面；费用基础设施P1先于真实模型，不能沿用旧顺序到最后才加。每片以专项合同验收，不把首切片标作全量完成。

浏览器验收分叉：已有作品重新打开“剧本设定器”时，初版只修改前端临时草稿，不能保证界面参数等于模型入参。补充 `PATCH work` 的修订号 CAS：仅在没有正式文档、待审修改和成功/进行中的模型运行前允许改题材、时长、来源、集数等；失败调用保留审计但允许修复模型配置。一旦开始写作，原参数冻结，设定器只读。前端从服务端作品详情恢复所有设定与来源，不显示虚假的可保存状态。此修改仍在上述独占路径内。

真实模型试跑分叉：预览中的 `DC-content-rewriter-LLM` 请求收到上游 502，未产生待审稿。为使此配置可恢复而不偷偷换模型，给设定器增加显式文本模型名称；服务端以持久值作为唯一生成模型，与预览哈希绑定。旧作品缺此字段时使用原别名，界面明示实际值；上游 502 的本地环境原因待配置核实，不能宣称完整联机验收。

质量门补充：真实中文剧本标题可能用“第九集”而非“第9集”；若只认阿拉伯数字，来源 EP09 与正文第九集的错配会漏检。将中文数字标题识别加入同一服务端检查，并补聚焦测试；不扩展到正文全文猜集号，避免误读剧情文字。

V4-Flash 联机验收分叉（2026-09-25）：定位到此前的 502 是本机 HTTP 客户端继承代理环境对 loopback 请求的影响；显式 `NEWAPI_TEXT_TRUST_ENV=false` 后，经现有 3001 网关实际收到 `deepseek-ai/DeepSeek-V4-Flash` 的 200 响应，Director 生成一份待审大纲并经人工接受，刷新后版本 1 仍在。此结果不代表内容质量或完整 TV Director 验收：30 秒大纲过密且“单集完结”与续集伏笔矛盾。另发现本机网关强制使用其配置模型，作品手填模型可能只改预览、未改上游。此轮只在本线已认领的 `director/**`、`routes/director.py`、`frontend/features/director/**`、`frontend/api/director.ts`、三语键和 `tests/test_tv_director.py` 内：服务端识别本机网关并将固定模型写入预览合同，拒绝显式不一致；提供只公开模型 ID 的能力查询，前端显示真实模型且本机固定时禁改；为生成记录沉淀安全的请求参数与返回摘要（不落密钥/完整带个人信息正文），补一致性和刷新回归。被 local-stack 工作线独占的 `config.py`、`local_gateway.py`、启动脚本不改；本机忽略的启动环境可单独校正。随后以合成样例跑分集/审阅/定稿，失败如实记录。

## 风险与回退

- **风险**：新 API/SQLite 状态、长模型任务、自动生成路由和三语文件与既有工作线共享；模型可能输出质量不足。服务端事务/版本与质量状态禁止误定稿；浏览器对照只读，不改第三方作品。
- **回退**：新模块/路由可逐提交回退，先停止新入口；旧 story/freezone 不受影响。SQLite 新数据单独位于项目 state_dir/director，不删除用户数据。

## 验收标准

- [x] `uv run pytest tests/test_tv_director.py`：建作、来源绑定、EP02 编号、版本冲突、局部差异、审阅/恢复；中文集号补测后 16 passed。
- [x] `uv run ruff check src/novelvideo/director src/novelvideo/api/routes/director.py tests/test_tv_director.py`。
- [ ] `cd frontend && pnpm build && pnpm test`；构建通过，三语定向测试/检查通过；全量测试仍有未归属的既有失败项。
- [x] 浏览器 1200×863 / 1920×1080：浮窗、Top8、模式/设定、节点、编辑器与确认动作；网关 502 时不假装生成成功。
- [ ] `python3 scripts/agent_guard.py check`、handoff/release、本线改动均在范围内，无凭据进入 Git。

## 进展记录

### 2026-09-26 · 已按授权完成本地提交（未推送）

实现219文件已提交为`cb3833ee`，取证2报告为`180aac9f`，两线协调依赖为`ba101496`。提交前候选指纹无变化，逐组实际索引diff-check、gitleaks/guard/banned-words全通过，三条DCO有效。沿用同字节471后端/78前端/build结果；本轮未修改业务或重跑模型。提交不是完整功能/文学质量验收，也未授权push/部署；第三方素材许可仍需核验或替换。只剩三份受保护原稿/旧文件未跟踪。

提交工作线收口见`docs/agent/archive/git-sync-preparation.md`，本线仅以三条精确coordination claim承接其归档与活动台账/claim移除，旧内容可从已创建commit恢复。临时ui-parity共享随该线归档撤回，本线继续持有视觉文档。后续开发开工须将本线基线更新到实际HEAD后重新acquire/preflight，不能凭已提交推定可绕过基线复核。

### 2026-09-26 · 提交准备复验（无业务源码变动）

git-sync-preparation按用户要求在独立干净检出pull，zhonggwv/main已最新e7b1fbce；备份及按工作线候选见该线台账。含共享回环代理的后端471项、前端78项及build通过；实际独立候选pre-commit首次抓到本台账和ui-parity各一处第三方依赖描述用词，已双向共享/preflight后改为公开发行包/第三方富文本依赖，重跑三钩子全通过。业务源码与备份逐字一致，未commit/push；素材再分发许可与文学质量遗留不变，不能把提交准备当完整产品验收。

### 2026-09-26 · 大纲独立证据审查与6笔同稿复验（链路通过，文学未过门）

改了什么：新增outline_review合同、完整来源逐句覆盖、剧情/自评元数据分层与引文/位置/hash校验；有效VIOLATED不被坏兄弟项抹掉，全正面最多REVIEWED而非PASS。接入既有review报价/批准/派发/持久回包、viewer读取API、故事大纲报告入口和三语实验提示；单独审稿不清空输入、不改稿或自动定稿。M07 2.2.0和全局技能不变，M12已校验short-drama参考继续复用。发现整包正文六项指令与大纲合同混用，适配器1.1.0只取verified references、独立schema，旧报价绑定版本失效；M12原包不改。费用说明不再把请求token上限写成结算承诺。

为什么：上一轮生成器与审稿器都混淆实际代价和条件风险，只校验JSON会误放行。本轮独立证据入口使原文/要求/原回包可追溯，但逐句覆盖不等于原子事实完整、精确引文不等于推理正确，因此不能声称可靠质量门已完成。已保存大纲可用，规划WAIT_OUTLINE待审包、人工事实确认及下游强制门仍未接。

真实复验：旧五稿各1次独立审查，另职场1次reference-only对照；共6次，无新稿生成、自动重试或采纳定稿。供应商报告V4-Flash，输入57049+输出21197=78246tokens，实际费用unknown；5份UNAVAILABLE、1份REVIEWED，**6份都未抓出已知关键硬错**。温情虽引文有效仍把桌角拾取当直接交接；职场去除模板冲突后仍把可能绩效损失当实际后果，故无法证明内容改善，停止加购。各次system/冻结参数/报价批准/原回包/report/usage/隔离SQLite完整留在忽略`output/playwright/director-outline-review-20260926/`，逐项结论见literary-benchmark §9。

怎么验证：新增16项后端合同/权限/hash/CAS/重放/一次dispatch及HTTP system/JSON模式/双token参数测试；全Director+API **454 passed/10弃用告警**。4前端文件 **78 passed**；pnpm build通过、既有大chunk告警保留；全仓ruff、三语/前后i18n(0/475)、CE11端口、定向gitleaks、diff/guard通过。Playwright合成provider连真实UI/API/SQLite点测只读报告→报价取消→再次报价和费用勾选→单次授权→持久失败报告→重载，2quote/1grant；1200/390截图已实际查看，窄屏无横向溢出，只有关闭/审稿无定稿按钮。初始Vite代理变量错致500，改实际VITE_API_URL后复验200；CLI旧network命令改requests，原问题不掩盖。UI合成FAIL不当真实模型成绩。

交接：功能入口可用、真实审稿不可靠；没有宣称与LibTV文学对齐，没有提交推送部署或更换供应商。下一步按§9.5建立可编辑确认的原子事实表和有编辑依据的最小正反反例，再评审对照，不能继续靠补长提示或重复购买初稿。收尾停止本轮3001/18780/15173与独立浏览器，移除临时HTML但保留所有证据；未触碰用户运行栈/原稿/Cookie。最终guard/handoff/release由本轮owner执行；完整工作线保留执行中，不归档。

### 2026-09-26 · 五套文学基准、14真实请求与LibTV完整大纲对照（内容未过门）

改了什么：新增`outline_benchmark.py`冻结五套原创/改编/单多集案例、独立证据审稿、显式一次调用与目录拒绝覆盖、自由主线/结构投影诊断；`live_outline.py`复用生产quote/grant/dispatch并记录case输入。新增11项离线测试与`literary-benchmark.md`逐段编辑结论/成本/失败试验/复跑说明，outline-parity链接新证据。M07实验2.2.1做过两次实测，因仍有语义错误且新增结构失败，已精确撤回本轮method/manifest/provenance/runtime/pinned/test版本变化；原2.2.0包hash恢复80fdc1d2…d76ea，无新生产提示词上线、无UI/配置改动，保留所有原有dirty工作。

为什么：用户强调结构只是基础。五份初稿结构均有效，但温情交接顺序、职场实际代价/配角行动、悬疑备用衣/调查机制、奇幻固定规则/人数均失败，改编主链较稳但跨栏目道具主体/位置/雨况需局部修订。五次审稿四次证据或维度不合格，一次自报pass漏判硬条件，宿主至少降为revise；不能拿平均文学分报喜。两阶段诊断让职场具体到色卡/页面，但没解决实际代价，投影还添语义漂移，因此不直接改变产品费用/调用链。

真实开销/留档：5初稿+5新上下文评审+2修订复测+1自由主线+1投影，共14个本方供应商回报请求，输入180478/输出84256=264734tokens，金额无结算unknown；无自动重试、正式采纳或定稿。全请求/系统方法/冻结规格/原始回包/usage/隔离SQLite存忽略`output/playwright/director-literary-20260926/`。输出上报可能含推理且超过请求上限，不承诺硬账单封顶。LibTV新建唯一合成职场项目：同brief、方向2、1集180秒，最终《页脚》大纲及源站自动附带的四种筹备文本已到询问卡，未点击定稿/正文。前后界面余额未变（数值只留本机），无额外付费弹窗，不把余额未变当后台费用为零。记录init_work、两次skeleton写入（more/append/plan）及finish_script_task，HTTP/WS脱敏回执在completed-evidence.json；旧项目不动，未发布媒体或分享。

怎么验证：最终`.venv/bin/python -m pytest tests/director tests/test_tv_director.py -q` **438 passed/9既有弃用警告**，基准11项独立通过；全仓ruff、前后端i18n（0/475无新增）、CE11端口、M07指纹及skill quick_validate、gitleaks测试/指南/源站证据目录、diff/guard通过。初期离线mock补丁打错已修正并复验；浏览器取证先修复监听的URL沙箱错误，发送前已核验http/ws统计，原异常不隐藏。本轮未跑前端构建、像素/Windows/完整24份与真人盲评，不声明全目标完成。

交接：最新文学结论与下步为literary-benchmark §8；先实现独立事实义务及逐证据门，再比较固定方向下的单/双阶段和不同模型，不从M07字段重写开始。全局short-drama没改，项目技能根基保留；本轮无提交/推送/部署。收工只停本轮3001回环网关与独立浏览器，保留付费回执和源站合成项目。锁按本轮owner完成handoff/release。

### 2026-09-26 · 大纲要素实接与用户时长权威

收尾追加：`pnpm test --run src/__tests__/i18n/locales-json.test.ts` **12 passed**，与三份Director前端64项合计本轮76项；最后`agent_guard.py check`为18线454claims通过，前端Director目录与本台账定向gitleaks也无发现。关闭自己启动的网关后3001无监听，不是停止用户原有服务。

本轮按用户新优先级对齐故事大纲，不丢弃short-drama。使用short-drama的/plan及开篇/节奏/爽点参考，按skill-creator更新应用内M07派生包2.2.0；三个来源参考文件/hash不变，未改全局个人技能。用Playwright只读原站现存大纲与既有write_artifact证据交叉核对，建立概要/简述/背景/压力/分段/追看/钩子/伏笔/反转/禁区十类要素合同。`OutlineMethodContext`适配原创及单文档改编，但不冒充来源审计。

实际完成：两条大纲生成入口共用同一技能和严格StoryPlan；新`outline.py`拒绝重复JSON键、漏项、错集号/顺序/伏笔链接、结构或总时长不符，三语言确定性渲染不泄露内部UUID。WAIT_OUTLINE预览/采纳与单文档待审投影同源，旧稿及旧2.1产物保守读取不迁移。M07实际HTTP请求带JSON模式和批准的token参数，失败原文、用量留存且无自动重试；测试provider同步新合同。详见[大纲对齐报告](../../guides/tv-director/outline-parity.md)。

真实V4-Flash两次独立合成验收：第一笔71.84秒、19413/2388输入/输出tokens，重复/未知字段导致正确拒绝且无候选；修正JSON传输及事实规则后第二笔58.94秒、19583/8356tokens，十类要素/schema/ID/结构/时长通过并留下待审稿，未采纳定稿。人工仍发现制作限制被写成戏内压力/代价，补强最后语义提示后仅离线回归、未买第三笔；不得称最终hash文学质量已复验。两笔合计49740tokens、金额未知；第二笔供应商上报输出超过请求8192且缺推理分项，不能承诺实扣硬封顶。每笔请求/原始回包/usage/quote/approval/hash/独立SQLite留在忽略的`output/playwright/director-outline-live-20260926{,-json-mode}/`，不含鉴权头。

用户明确时长自己决定：30秒从来只是测试样例。本轮实查并去掉旧设定器5–3600秒静默钳制及后端上下限，保留正整数秒规则；默认120不是强制值。输入清空/0/负数/小数不偷改，禁止确认；选模板不改时长、取消不保存。测试1/120/5400秒通过UI确认与保存后真实编译参数，其他1–5400秒样例验证大纲合同遵循用户值；模型回报总时长不符直接拒绝，不反向改preset。UI布局/CSS未动，无新像素或物理设备验收。

验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py -q` **427 passed / 9依赖弃用warnings**；`pnpm test --run src/__tests__/director-ui.test.tsx src/__tests__/director-execution.test.tsx src/__tests__/director-richtext.test.tsx` **64 passed**；`pnpm build`通过（既有>500kB chunk警告）；`.venv/bin/ruff check src/novelvideo/director tests/director`、前后端i18n棘轮通过；M07 `quick_validate.py`通过，包hash与合同fixture含在上述后端测试；`node docs/guides/tv-director/verify-spec.mjs --self-test`22突变正确拒绝（仅规格非产品）；gitleaks对新域/测试/指南扫描无发现；`git diff --check`通过。uv缓存权限受限故使用已有venv，没重装环境。原站浏览器会话及本轮临时启动3001网关均关闭，常驻用户栈未动。未提交/推送/部署，整体Director仍执行中。

### 2026-09-26 · UI续轮：设置/历史/富文本/完整模板与逐题交互

做了什么：继续同视口取证，补全600宽设置、320宽历史弹层、680正文全屏Tiptap编辑器、原站54 SVG/14题材图/21画风图、8个完整模板、345宽四类参数弹层/413×407画风及373×249结构。新增标题CAS/幂等软归档恢复，保留正文/历史/费用；运行或UNKNOWN阻断变更。接实际通知权限/本机偏好与Token上限、附件.md/.txt/拖入/来源chip、当前文档引用/真实模型/手动菜单、单文档画布平移缩放/底部工具条、方向问卷序号/逐题翻页/答案保留。新增Tiptap7直接依赖，锁文件仅504新增行，旧importer未升级。三语、DESIGN和ui-parity验收同步。

为什么：只换首屏/图标无法满足用户“全部对齐”；本批从真实DOM测量重建子界面并接实际操作。模板纠正职场成长融合职场行业、仙门团宠融合古装言情、重生复仇主体家庭伦理，避免同名预设提交错方向。源码保底保留未知Markdown；格式/保存不绕过CAS/私稿；打开/缩放/只读变化不会自动改正文。浏览器发现同作历史重开清空正文、重复重开浮钮遮住画布缩放，已修复并实点复验；历史不确定响应只准同意图重试。自动扣费/预算无服务端权限仍禁用，不造成功按钮。

怎么验证：68项定向前端（4文件）/357项Director后端通过（8既有依赖警告）；TypeScript+Vite构建通过，Director懒加载约652kB有大chunk警告。pnpm离线frozen lock安装、定向ruff、前后i18n、diff-check、guard18线451claims、DESIGN lint0错误/15既有警告，前后Director与指南gitleaks无泄漏。浏览器真实组件+隔离API/SQLite验证历史重命名→归档→恢复→同作重开；六弹层/21图加载；设置/编辑器/目录/菜单；画布150%→复位；1920/1200/390，窄屏scrollWidth390。六参数宽高与参考一致、位置≤1px；设置600×478.25对参考600×478.672；编辑器正文680居中x620。调试旧选择器/遮挡超时已重验，不隐去失败。原站只读UI，无付费调用；未跑全仓全部测试、生产认证、OS通知声音或Windows。

未完成与接续：ui-parity §6明确六组差距：全运行/审批态逐屏、块级diff/稳定选区、媒体资产/多节点画布、Skill/导演/分享插件、自动策略/跨设备、全应用壳与Windows。方法说明不是Skill库；相同图标不等于149动作交付。下一批先比对E22–E31待审差异视图与现有canonical changeset接口，写精确计划后接diff导航/依赖组接受撤回；不重复本批已完成布局。未提交、推送、部署；任务仍执行中，第三方素材发布许可未解决，旧真实内容FAIL/UNKNOWN保留。

收尾：最终68项定向前端与build再次通过；附件菜单153×77已实点测量。已移除本轮临时预览HTML、关闭本轮两独立浏览器会话，核对命令后停止18780隔离API与15173测试Vite；截图/合成记录保留，用户数据与常驻服务未动。最终guard/handoff/release按当前owner执行，不将未完业务归档。

### 2026-09-26 · UI优先：实测几何、原站SVG/题材图与操作回归

做了什么：按用户新优先级重构独立中性灰创作表面、400×640浮窗/标题拖动/八向缩放/停靠、欢迎Top8、1232×640双栏设定器、15题材与融合双圆、六摘要卡/94选项及八种结构/1–100集数；旧完整字段保留到高级区，取消保持模态草稿隔离。节点增加参考工具栏/Markdown富文本预览/实际下载。按追加“图标也用它的素材”，固定36种原站SVG与14张720×720公共题材图，原站Top3裁切/玻璃边缘/图后光晕；静态SVG白名单与实例渐变ID，来源/字节数/hash留清单，无运行时热链。编辑器只换关闭X，API/方法/审批和已有正文逻辑不变。

为什么：先前通用图标/表单堆叠并不符合用户要的LibTV交互；不能仅换色后称像素一致。按同视口DOM测量修正主窗、卡片、结构弹层尺寸，完善取消/焦点回归、停靠返回语义与窄屏。相同素材不代表获得再分发许可，发布前使用权待核验；本轮没有提交推送这些资源。用户源稿/旧画布/研究凭据未改。

怎么验证：定向Vitest三文件49 passed（新增SVG安全/渐变ID/14图hash/取消/参数保留/只读/选项上限/焦点/几何状态），tsc+Vite生产构建通过（既有bundle警告）；i18n 0新中文/三语检查通过，DESIGN lint 0错误/15既有警告，预览脚本ruff、diff通过，新增域和指南gitleaks无泄漏。浏览器1920/1200/390真实组件+隔离合成API：14图加载均720×720，主窗与设定器尺寸一致；结构弹层373×249，位置最大1px偏差；拖动从1504/424到1404/374、Home复位，融合移除/滑块/取消20→3/7后仍20/停靠返回/关闭重开/编辑器及下载已点测。手机scrollWidth390无整页横溢出。调试HMR导入错误/旧选择器超时已修正重验，不能将其隐去当一次全绿。全量前后端/Windows未跑；本轮零真实模型调用，不替历史内容FAIL结案。

证据与边界：新增`docs/guides/tv-director/ui-parity.md`列精确尺寸、素材清单、命令与本机截图名。已对齐首屏/核心设定器并非整套像素验收；设置/历史原有布局、富文本编辑/选区操作、完整题材/画风/Top8模板、无限画布/附件/模型浮层、问卷和执行全状态、媒体/分享/插件、Windows仍有缺项。保留“高级设置”、真实模型名和禁用原因，不能伪装原站行为。业务未提交推送部署，任务仍执行中。

收尾：已移除本轮临时`frontend/director-preview.local.html`（只含合成页面挂载，可按预览模块重建），关闭本轮两浏览器会话；核对进程命令后仅终止18780隔离API/15173测试Vite，两个端口已无监听。没有删除合成回执/截图或用户数据，没有重启用户服务。最终diff/guard通过（18线426认领），按本轮owner执行handoff/release；保留已声明的其他工作线脏文件。

### 2026-09-26 · 原创方向/筹备主流程实接，真实四阶段内容FAIL留证

做了什么：本轮按WP03–WP07新增M03/M07/M08/M09四方法适配包、严格结构化产物、原创workflow父计划/预算/顺序子调用、持久问卷/忽略返回/旧卡拒绝、自定义方向与必答问题、全部四文档CAS原子采纳。页面接真实费用/问卷/候选/阶段执行卡；刷新只读、丢响应原意图重放，UNKNOWN不重发。新增测试验收器可最多1+3次真实请求。修复采纳后画布停留旧版本、预览受JSON键排序影响、末次响应与停止竞争卡住付费结果、历史卡错误断言未采纳等问题。

为什么：用户问还剩多少并要求继续实现；先按完整22包退出条件逐项审计而不是从测试数推完成率，结果是22包仍有缺项，6/24实际包、9/33类gold，完整UI/方法/导演媒体生态未完。short-drama按阶段实际载入并保持用户短片/集数优先；生成候选与采纳、采纳与定稿、确认方向与付费分别处理。未把M10或完整逐集链包装成已完成。

验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py tests/test_newapi_text_gateway.py -q --tb=short`365 passed/8既有依赖警告；定向vitest两文件39 passed；生产build通过/已有bundle警告。25项workflow/验收器回归覆盖全链、并发重复批准、失败只重购未完成、UNKNOWN隔离、停止竞争、全事务回滚、错集/时长/ID/结构/输出字段。全仓ruff、前后i18n、CE11端口/导入、禁用词/包名、diff、gitleaks和规格22负向突变通过。离线wheel66方法源/资源逐字节相等。浏览器真实组件/API/SQLite的合成链验证忽略刷新/恢复/无默认选择/1+3预算/四文档顺序/采纳v1/刷新，无自动正文与定稿；不是生产认证或物理Windows验收。

真实模型：四阶段分别35.27/234.92/22.53/11.70秒，均一次请求与stop、provider-reported V4-Flash；合计43752输入+6062输出=49814 Token，实际金额未结算保持null。全部命令/快照/系统方法/JSON输出/usage/SQLite保留在忽略`output/playwright/director-live-planning-20260926/`。**内容验收FAIL**：M03编祖孙/退休/告别，测试器机械选择首项与泛答澄清，M07/M08继承为确定事实；M07/M09眼镜佩戴与手持缺过渡，30秒只是目标非实测。没有自动采纳或定稿，没有追加付费或重放旧UNKNOWN。`content-review.json`明确模型、宿主和测试决策各自问题；下一步优先修事实确认与M10，不用补一句prompt或换模型冒称解决。

剩余清单权威为implementation-closure §0，完整证据为runtime-validation §0.2。筹备期间规格变化后的重规划、实质改写、M10/结构化M11/逐集父计划、全改编/全UI/Skill生命周期/导演全能媒体分享/Windows均未完成。当前新增代码未提交、未推送、未部署，不归档。

收尾：本轮设计lint为0错误/15既有警告；最终中文/英文/越南语JSON回归39通过。实际点击四类正文均v1、EP01仍v0，1920/375截图已检查；不是全移动/全UI验收。已删除本轮临时HTML入口（可按既有预览方式重建，所有运行证据保留），关闭独立Playwright会话，仅核对并停止本轮启动的三项回环测试服务；未删除任何用户项目或付费回执。guard18线410claims；handoff核对159条已认领脏路径通过，按同owner执行release，任务仍执行中。

### 2026-09-26 · 持续实施实收：修订/私稿/方法包与真实审稿故障闭环

做了什么：本轮从canonical AST、18条件规则/上下文、参数冻结、独立M12与人工Finalization继续推进；现已接已完成集显式重开、设定影响预览/CAS、减集归档及稳定ID恢复、任意集只读浏览、固定编辑基线/显式私有稿恢复。现有M11/M12入口实际加载两个自带方法适配包，含许可/来源指纹/模板/schema/正反例，校验后才报价；升级/损坏使未消费授权不能派发。其他22个方法与全阶段仍未实现，不用两个适配包冒称24包完整。

为什么：用户指出“落实完”而不是继续只做文档；本轮实改用户可操作路径，并用真实模型发现引用ID漂移、坏引用吞掉已证实FAIL两个问题。输出schema枚举实际引用ID，逐check核验保留有效FAIL；旧UNAVAILABLE原报告不重写，本地复核保留回包只能增加失败阻断，不能放宽旧门或触发付费。字数/时长仍不信模型自报，不把流畅输出当质量通过。

验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py tests/test_newapi_text_gateway.py -q --tb=short`最终340 passed/8既有依赖警告；`pnpm exec vitest run src/__tests__/director-execution.test.tsx src/__tests__/i18n/locales-json.test.ts`34 passed；`pnpm build`通过，已有大bundle警告。全仓ruff、前后i18n（0/475基线无增加）、CE端口11/导入、diff、gitleaks源/UI/测试/文档、guard通过。`uv build --wheel --offline`通过；26个方法源/资源逐字节在wheel，缺失/差异0。规格22负向突变通过仍只证明规格，不当482产品测试。全量pytest/前端与Windows未跑。

真实模型与证据：新版M11 7.44秒/15383输入/105输出；M12初回27秒/3066输入/1130输出，引用`inputs.document`无效；修正enum后二次60.25秒/3147输入/1681输出，成功指出开锁后取眼镜环节遗漏，但另一检查误绑brief。三次都是一次请求、无自动重试，已知24512 Token，金额无结算仍null；沙箱失败0.41秒UNKNOWN与旧300秒UNKNOWN均保留不重放。宿主本地重核后原报告仍UNAVAILABLE、有效失败结论FAIL/REVIEW_FAILED、readyForHumanReview=false，原费用与历史未改，新增模型调用0。真实正文仍未达到质量通过，其他两例早先质量失败未关闭。完整请求/方法/schema/回包/SQLite及host-validation在忽略output，详见runtime-validation §0.1。

真实浏览器已验设定影响/重开EP2/2→1归档只读/私稿保存→重开→恢复且正式v1不变；截图保留。最后新增本地复核提示由组件测试/构建覆盖，未重开真实浏览器，明确不算其视觉验收。临时HTML入口删除；仅本轮启动且核对PID的3001网关/18780合成API/15173 Vite及浏览器关闭，没有部署/重启用户栈、修改原稿或第三方账户，没有提交推送。

完整目标未完成，不归档、不标验收通过：缺阶段父预算/持久会话问卷与33转移、全ConfirmedSpec/来源追踪、M03–M10筹备/事件独立审计/容量计划、其余方法、逐hunk/富文本、完整LibTV UI、Skill生命周期/导演/全能/媒体、分享/OAuth/导出导入/物理多设备。下一动作见末尾，不再从AST或旧prompt重复开始。

最终收尾检查：`npx --yes @google/design.md lint DESIGN.md`成功返回0 errors/15 warnings（现有对比度及孤立token警告未改邻域）；禁用词/包名检查通过；三个本次测试监听均已消失。guard为18线409claims，handoff核对114条已认领脏路径通过，收工release按同一owner执行，不影响另一研究线/原稿/用户资料。

### 2026-09-26 · WP06 方法文件实际加载续轮方案门

审计确认目前规则有来源指纹，但写作/审稿仍未读取自带方法文件。本批先将现有可调用的M11与M12落成校验包，不伪造其余22包已实现。新增`src/novelvideo/director/skills/runtime.py`及`skills/builtin/`下两个明确版本包、共享short-drama参考快照与MIT许可；每包有manifest/method/输入输出schema/template/正反fixture/provenance。由宿主固定注册key、允许validator、只读工具白名单；拒绝目录逃逸/符号链接/篡改/外部schema引用，校验文件hash再加载。M11当前输出仍为Markdown→canonical AST适配，不冒称完整EpisodePlan/ScreenplayDraft合同已经实现；M12沿既有严格六检查与证据验证。仅接已存在入口，不能悄悄增加模型次数。

源参考按实际阶段与集数加载（首集开场、非末集或开放结局钩子），确认参数和条件规则高于长篇范例。请求记录实际包revision/method/template/reference/schema摘要，能力指纹包含全包摘要；报价后升级/改动必须重新报价，派发前拦截，已返回的旧结果继续按原快照保留。运行不读开发者本机技能目录。新`tests/director/test_skill_runtime.py`覆盖破坏包、错schema/工具、条件选择、包升级/0调用、实际prompt及回执绑定；现有writing/quality/execution测试回归。源目录与目标域git diff和本地origin对照无同路径他线实现，唯一锁保持。风险/回退：数据不迁移；可回退编译入口但不得恢复旧quote执行，保留所有费用历史。静态包完整不代表源事件审计/容量规划/全TVDirector完成。

前一批实际结果：299后端网关、33前端定向测试及构建通过；浏览器已验证EP2重开、2→1归档再读取、私有草稿保存→关闭→重开→预览→恢复（正式v1保持不变）。私有稿是显式保存，不宣称自动保存/富文本已完成。

方法包接点增加既有context.py的独立HOST_VERIFIED_METHOD_JSON区，预算包括实际方法文本；M12方法和schema同时冻结。既有live_execution.py增加单case选择，允许只验证新版方法而非默认买三份正文。授权测试使用全新隔离目录/新意图，先最多一次M11原创、4096输出Token；失败或UNKNOWN即停，不重发旧审稿UNKNOWN。若有完整回包再人工检查是否满足原硬约束，不把包schema/38静态回归当生成质量；所有新参数与完整响应仍存忽略目录。此验证未增加自动修订或自动定稿。

真实验证分叉：沙箱内首次0.41秒UNKNOWN保留；只读loopback对照默认curl连接失败、提权可获HTTP响应，确认环境访问边界，不改业务重试规则。获准网络环境下新的M11测试意图7.44秒成功（15383输入/105输出、1请求），不是重放旧任务。生成两场/默剧且96汉字，但自报约180字不实、盒中取眼镜动作略过，仍未做30秒排演。下一步仅用这份新方法输出买一次独立M12（同4096上限），新增review单case筛选避免买其他正文/审稿；旧300秒审稿UNKNOWN不触碰，若再次UNKNOWN立即停止。完整回执与费用未知均保留。

M12真实回包27秒/3066输入/1130输出；模型输出引用ID `inputs.document` 而合同要求 `document`，正确拦为UNAVAILABLE。源头修复不是接受任意别名：compile_review将当前可用ID写入动态enum/schema，明确禁止路径写法，冻结实际responseSchemaHash，并将review编译版本升2.1.1使旧审批失效。新增实际失败最小重放、合法ID/伪造ID/参数hash回归；历史失败不改判，不覆盖原回执。用户已授权必要真实测试，新编译版本可再验证一次同样保留正文的独立新意图，非自动重试，仍4096/1次且UNKNOWN停。

第二次真实M12回包60.25秒/3147输入/1681输出：ID已正确，source_fidelity有brief/正文逐字证据指出开锁→取眼镜环节遗漏；continuity另一条quote却错挂brief。原整报告UNAVAILABLE会吞掉其余已证实FAIL，可能被全项人工接管绕过。修复为逐check核验：坏证据该项UNKNOWN/不可用并清除不可信引用，其他合法FAIL优先保留；整JSON/hash错仍全不可用。旧UNAVAILABLE报告不覆盖历史，读取时对已保存原回包本地复核，只能追加阻断、不能借复核放宽旧门；UI单列“保留回包本地复核”，不伪造新模型运行。新增旧报告/费用/定稿拒绝/原记录不变测试。精确沿quality.py、API-client、QualityReviewDialog与三语/现有测试，本轮不再付费调用。

### 2026-09-26 · WP11 已定稿修订续轮方案门（执行中）

验收发现的相邻安全接点：编辑器目前背景刷新会把保存使用的version换成新值，有覆盖他人正文的风险；按WP12补打开编辑器时固定work/doc/version，后台变化不更换编辑基线。接已有private draft API，以独立组件 `frontend/src/features/director/components/DirectorDocumentEditor.tsx` 保存私有稿/恢复列表，显式恢复而非自动覆盖；私有稿与正式保存分开，原有稿跨版本仍可读。新增保存不准隐式rebase，失败保留输入；正式保存需要初始版本CAS，完成后私有稿仅作为历史保留。三语及当前组件测试覆盖刷新/保存失败/切换作品不串写；无模型调用。该组件仍非完整富文本/hunk编辑器，不虚报WP12完成。

接通实际用户路径：设定器不再永远冻结；已有写作的作品通过服务端影响预览→逐项确认归档集→CAS原子提交。新 `revisions.py` 与 `schemas/revisions.py` 保存不可变 before/after 设定快照、预览和幂等回执；旧 preset 仅作为兼容适配数据，不冒称已实现完整 ConfirmedSpec provenance。源文本、模式与来源标签不在本轮可改范围，页面锁定并由服务端拒绝越界。创作参数变化使全部审稿/定稿/派生产物失效，保留正文及全部历史，从第一集重审；仅改标题不重开已完成作品。增集按稳定ID分配；减集仅归档，要求逐项确认与原因，不物理删除，也不自动重写/调用模型。

同时接“重开指定集”：独立影响预览保留该集及后续集的所有正文，失效该集起的审稿与定稿，后续工作流回到选中集。页面可查看任意已有/归档集，只有当前检查点可编辑；历史/未来集不误用当前集号调用模型。预览绑定actor/work/revision/doc版本/已定稿回执/待审和运行状态；运行或UNKNOWN期间不得改设定/重开；新增待审或新报告使旧预览失效。提交重放幂等，预览取消无正式状态变化。

精确新增边界：`src/novelvideo/director/revisions.py`、`schemas/revisions.py`、`tests/director/test_revisions.py`、`frontend/src/features/director/components/RevisionImpactDialog.tsx`；已有 store/repository/quality/API、DirectorStudio/PresetDialog、API client、三语及定向UI测试仅增加接点。源/API路径均本线独占无远端同类实现，共享翻译只加键。步骤：严格schema/事务→故障测试→UI接点/逐项映射→浏览器→回归→记录。回退只撤新接点，SQLite additive表与历史不删除。验证含并发重复提交、跨用户/跨作品、过期/CAS、故障回滚、增减恢复稳定ID、旧报告不可重新生效、标题不误失效、API权限与真实组件点击；不把合成模型与真实质量混淆。

### 2026-09-26 · 持续实施：独立审稿与新版定稿权威，未收工

已实现：canonical AST及完整版本投影/稳定ID/显式备份迁移；18规则选中/禁用/来源hash、必需上下文完整性和预算校验；八结构与基调/画风/结局/语言/保真/新增/锁定/来源交付参数保存→重载→模型请求逐字段验证。独立M12审稿通过purpose=review走同一quote/approval/dispatch账本；冻结原稿/上游/修改前稿/原始修改指令，六检查/证据引用宿主核验，模型不能直接定稿、写稿或自报实测。canonical bool定稿入口拒绝，新v2逐项HumanReview绑定DV/hash/report/actor并幂等提交；旧确认表仅历史，升级从首集复审，两集重审不覆盖历史。按finalizationId保留失效记录，写第二集不误伤第一集，上游变更则使依赖定稿失效。

为什么：上一轮仅安全传输仍未实现方法/正文权威，本轮补真实接点而非只造纯函数。审稿回包与正文回包分流；UNAVAILABLE不是PASS，已证实FAIL不能勾选绕过，尚未排演可仅确认文学稿但不标productionReady。UI审稿任务不能显示“草稿已保存”；原始改写指令必须输入独立评审，否则发现不了先后时机错误。

验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py tests/test_newapi_text_gateway.py -q --tb=short`为282 passed/8既有警告；定向vitest26 passed；pnpm build通过（已有大bundle警告）。全仓ruff、前后i18n、diff-check通过，guard407claims。真实浏览器实际组件/API/SQLite：设定基调/非线性保存并出现在审稿报价→手工合成正文→未审稿阻断→显式费用→合成独立审稿→逐项证据→单集定稿/只读；截图output/playwright/director-{parameters,review-quote,human-review,finalized,review-mobile}-20260926.png。浏览器为隔离测试后端，不是生产栈/物理Windows验收；最后canonical历史衔接增量由后端回归覆盖，测试服务需后续收尾时关闭。

真实模型：复用原已保存合成正文，首个独立审稿在300.08秒后UNKNOWN，无输出/usage；其余两例未发，未重买正文、未重试。请求/系统方法/完整源及正式稿/quote/approval/SQLite保存在忽略目录output/playwright/director-independent-review-20260926。只读授权GET models为200/2.29秒，配置V4-Flash在模型列表，不能据此判定生成没收费。该次费用仍unknown；M12真实内容质量尚未验证通过，不能将合成审稿PASS当真实结果。

仍在继续：完整ConfirmedSpec/33转移/会话与问题持久化、全阶段父预算及24包加载、M04/M05/M10实际编排、hunk与联动修改、Skill/全能/导演/H3/分享/导入导出/多设备及全量验收。已有文档/运行/质量模块可复用；不要重新写一遍或把函数级测试计入482完整用例已通过。当前锁仍由本会话持有，未handoff/release、未提交推送。

### 2026-09-26 · 持续实施中：AST正文/稳定ID/显式迁移接入

已增加严格AST、语义hash、稳定块lineage与UTF16选区，同SQLite新表保存正文权威、派生依赖、私有草稿与导入备份；新作品默认启用，旧接口读写适配同一权威，缓存Markdown不能覆盖正式AST。旧作品预览和确认hash、备份全部历史、事务中断回滚、重放幂等已接API与页面；旧确认不会作为新质量PASS。联动失效保留历史，不自动调用模型。首次28新增测试通过，扩展回归找到保存/读取字段差异及后集误失效前集问题并修复；当前40项正文/旧接口回归通过，完整Director回归正在补充后重跑。前端23项含新增迁移确认回归通过、build通过。此为连续实施过程记录，未收工、未归档；下面继续WP06，完整TV Director仍未达验收，不以局部通过结束。

### 2026-09-26 · v2安全执行层已接真实API/页面，真实模型三例完成并保留质量失败

做了什么：新增严格execution命令、additive SQLite quote/approval/operation/cost/outbox/event事务，哈希/版本/用户绑定、幂等重放、原子单次派发、未派发取消、UNKNOWN隔离与旧回包保留；页面改走新路径，费用预览/Token上限/任务恢复/只读结果接通。旧v1生成接口409拒绝升级绕过，其读取/手工编辑保持兼容。修复设定取消未回滚、异步预览跨作品及375px顶部挤字；三语齐全。实际usage/finish reason进入回执，金额未知不记0，截断不生完整候选，活跃/未知任务在同事务阻止定稿。`config.py`共享窄改修复loopback默认继承代理的502，明确开关/远端不变。

为什么：仅纯函数通过未进入用户路径；刷新/重复批准/断线都可能产生重复调用或误用草稿。实际模型测试又证实，流程成功不等于内容正确，所以安全执行、源头方法和质量必须分别验收，不能用模型自评分或换模型掩盖缺少阶段。

怎么验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py tests/test_newapi_text_gateway.py -q`175通过（104基础+17旧Director+37执行+17网关）；`pnpm exec vitest run src/__tests__/director-execution.test.tsx src/__tests__/i18n/locales-json.test.ts`21通过；`pnpm build`、全仓ruff、前后端i18n、CE闭合11项、CE导入边界、禁用词/包名、gitleaks、diff检查通过；规格检查22反向变异通过仅说明规格。真实浏览器以实际组件/API/SQLite+合成模型验证预览→批准→候选→刷新、UNKNOWN不重发、保留结果只读，并检查1200/1920/375和浅色；临时HTML移除，自己启动的三个本机验收服务及浏览器已关闭，用户服务/数据不动。

用户追加必要真实模型授权后：首请求1.12秒UNKNOWN无回包立即停；只读模型列表对照True代理502空体/False直连200。代码修复后新批次3个独立意图经生产审批/派发路径用配置的V4-Flash返回：7.79/22.79/7.41秒，输入564/770/914 Token，输出414/728/181 Token，各一次、无重试、全为待审稿。合计3571 Token，不含未知首请求；金额未取得结算。原创两场161汉字但30秒未测；改编正文561汉字超450上限且新增年龄等未完整标记；改写场2逐字不变但犹豫动作发生时机不符。没有宣称质量全部通过或完整融合完成。

详细参数/回包位置、失败事实和下一阶段修复顺序见`docs/guides/tv-director/runtime-validation.md`。公开报告仅合成故事和安全指标，本地完整JSON/SQLite/截图在忽略的output/playwright；凭据与原稿未写入公开文档。没有提交、推送、部署或真实媒体调用。

范围与遗留：本轮是WP02–WP05的一部分执行基础，不是其全部（还缺正式v2正文/稳定ID/全部状态机/全局预算与人工对账）；写作仍单文档编译器，24方法包及全量UI/Skill/导演/全能/媒体链未接。下一步按交接摘要推进正文权威与阶段产物，不能再只改提示词声称融合到位。

### 2026-09-26 · WP00/WP01首批可执行基础校验（已写代码，尚未接入产品链路）

做了什么：新增8个Python源文件，定义strict/extra-forbid/camelCase wire合同及确定性守卫；F01/F03/F05/F11/F17/F19/F23/F27/F28九类合成fixture含58个正负变体，真实调用代码而非匹配文档编号。覆盖设定参数及来源逐项往返、稳定来源集号、读取覆盖与独立漏事件审计分开、强依赖修改全选/全拒、声画依赖图与资源冲突、UNKNOWN接单恢复决策、引用顺序/双编号命名空间、固定Skill版本回执、问卷版本与答案校验。补充时长实测证据必须绑定当前文档版本/语义hash；仅有模型的measured标记不放行。

为什么这么改：把反复返工中已确认的硬约束先变成能失败的函数与测试，避免换模型或增加提示词后同类错误重现。外部请求只收canonical camelCase，拒绝未知/错型/越界字段；素材展示顺序不受异步返回顺序影响，文本独立计数，图/音/视频共用mixed计数；供应商接单不明只返回人工核对，有taskId只查询原任务，不建议重建。

怎么验证：`.venv/bin/python -m pytest tests/test_tv_director.py tests/director/test_foundation.py -q`为**121 passed / 8 warnings**（104项新增基础测试＋17项既有Director；警告来自现有Starlette/Cognee/Pydantic依赖弃用）。`.venv/bin/ruff check src/novelvideo/director src/novelvideo/api/routes/director.py tests/test_tv_director.py tests/director/test_foundation.py`通过；仅格式化本轮9个Python文件。`python3 scripts/check_backend_i18n.py`通过、预算未增加；`.venv/bin/python scripts/lint_ce_imports.py`通过；`node docs/guides/tv-director/verify-spec.mjs --self-test`通过22组反向突变（这是单独规格检查，不把482个计划测试算通过）；定向gitleaks扫描director源和fixture目录均无泄漏。uv离线入口因沙箱缓存权限未启动，改用已安装.venv运行，未修改环境配置。最终diff/guard/handoff/release按仓库协议执行。

边界：纯函数返回的是校验结果/拟执行动作，**未接API/UI、未执行数据库原子CAS、未实现费用授权/outbox/实际重试，也没有实现完整阶段Skill执行器或语义抽取器**。时长artifact真实归属/内容与来源独立审计回执仍需宿主repository验证；时长结果不会宣称productionReady。未改旧models/store/writing/API/UI或用户数据；未发模型/LibTV请求，费用0；未提交推送。机器矩阵全场景状态继续not_implemented，不把九类fixture的局部守卫通过改成对应端到端通过。

下一步：按WP00/WP01补其余24类fixture及完整schema/命令注册，随后按WP02–WP05接入版本化持久化、原子状态转移、事件恢复和费用/outbox；先更新逐文件scope并preflight。旧常驻API/全量前端/真实质量与第二设备验收仍保留，不因基础测试通过关闭。

### 2026-09-25 · v2.1全量方案收口及可执行规格检查

做了什么：主方案/五份合同/历史开发§19.6已统一，修正K20删除与归档混用、Spec集数/AST/评审状态命名、源站旧N整类结论。九项研究增量迁入各自权威合同，新增F25–F33。新增implementation-closure.md的22个代码工作包、类型/严格命令守卫、迁移/回退与13项已决定差异；implementation-map.json逐项覆盖149动作+8能力、24方法、18规则、33转移、184语义命令/25运输入口/49字段词典，登记482个计划测试ID。source-inventory.json冻结24个short-drama文件hash和15条路由；用户源目录与安装副本24/24相同，空知识库未包装成已有案例。

为什么这么改：把“方案写过”变成可检查的逐项合同，避免遗漏入口、版本/状态漂移、源站失败被仿制、未执行测试被涂绿。源码位置是计划路径，不是实现声明；设计ready和产品not_implemented/resultRef=null分开；U01–U13各有独立决定/责任域/阶段/发布门，不再留“后续完善”行为空洞，也不假称原站未知已测。

怎么验证：node docs/guides/tv-director/verify-spec.mjs通过；--self-test拒绝22组缺项/断引用/假PASS/假来源等突变；node --check通过；git diff --check通过；gitleaks dir（专项合同目录/主方案/历史开发方案，--redact）无命中；agent_guard check为OK:18 workstreams/382 claims。check只读、不调用供应商，482用例是计划、不是本轮业务测试通过。业务pytest/build/UI/真实模型/物理设备未执行，现有业务diff保持不动；未提交/推送/付费生成。

下一步：按implementation-closure WP00+WP01写F01/F03/F05/F11/F17/F19/F23/F27/F28匿名case与strict schema负例，随后补齐33类，进入WP02–WP05持久化/状态/事件/费用安全门；精确认领后再写业务代码。完整产品仍待实施验收，研究事实与第二设备/真实质量等发布门未被这次设计收口伪造关闭。


### 2026-09-25 · 测试 Skill 删除与公开失效取证交接（未改业务）

研究线按用户精确许可删除自建合成“连续性清单”：delete HTTP200/code0，刷新私有列表保留另外两条；匿名公开详情两次HTTP200/code10051/data=null，页面失效。完整本机备份保留，源站没有可恢复承诺。开发§19.6及验收N08新增这条失败码夹具：按业务code解析，不能以HTTP200误判；整体删除与保留私有的独立撤回必须分开，不能推断样例直链或下载副本已销毁。聊天分享仍未撤销，物理第二设备未实测。62条离线证据断言不是本方产品验收；仅研究文档串行交接，不修改业务首切片或其他v2合同。

### 2026-09-25 · 授权后续轮实证移交（仅文档，未改业务）

研究线持同一唯一锁补充补证报告§13、分析§12.2、开发§19.6、验收§6：两集长稿正文完整流转且尾事实保留，但E10/E11仍逆序；对话提炼apply v1.0.0恢复，执行版本自述却称草稿；真已删节点返回C/A需按A/缺失/C重排；唯一H3请求5s768P16:9，实际5.167s1344×768；受理后断线恢复未重复create。预算/可见余额共130（正文60＋H3 70），不再自动收费补测。

分享实际上传整幅7节点快照且匿名可读，Skill发布/匿名源码可读；源站未见单独撤回/归档恢复，不可逆整体删除不冒充撤回。官方隔离MCP完成最小scope OAuth/48工具/read_project/refresh/revoke/旧token401，原生CLI和自然到期仍未通过。物理双设备等用户在第二设备改合成项目名；待办及副作用见研究台账，不以研究样例代替本方验收。

实现接手先加入sourceOrdinal顺序、manifest缺失补位、Skill引用revision/contentHash、目标/实际媒体参数、accepted断线与UNKNOWN分域、分享allowlist/revoke、private/public快照分离等确定性fixture，再按融合v2推进。其余四份专项合同及业务首切片均未改；本轮离线证据校验不是新增业务测试。最终guard/隐私检查在研究台账记录。

### 2026-09-25 · 研究线N01–N10实测交接（仅文档）

discovery持唯一锁串行更新共享验收合同§6、开发指南§19，新增证据链接`docs/guides/tv-director-liblib-gap-validation.md`。源站实测不是本方通过：5秒→6秒、720p工具请求→2K节点、强依赖改名可部分采纳形成混名、全能不能创建文本、Skill对话提炼失败/画布路径恢复均需加入反例。P0先冻结这些匿名fixture，P1实现参数回读一致性/依赖组原子提交/状态费用约束；别靠增加Skill警告或换模型重复生成。N08/N09公开发布及外部授权待许可，实际媒体/物理双设备未验。其他四份v2专项合同与首切片业务代码未改，研究证据32断言不能计入本方产品通过率。研究线收工后按正常acquire/preflight再开始实现。

### 2026-09-25 · 审核九项意见落实为融合v2

做了什么：主指南改为v2权威索引；新增feature-contracts、skill-contracts、workflow-contracts、document-semantics、acceptance-contracts五份细化规格。定义137个既有按钮、12个补充动作、8项完整能力；24方法包/4改编策略/18条件规则；唯一转移表与全阶段费用/UNKNOWN恢复；正文AST权威与语义失效、独立漏事件审计、依赖组部分采纳、稳定集ID和并行声画估时；24类正负例、12类×2次质量样本及10项待补实证。旧开发文档修正自动完稿、工具直写正式稿、时长简单求和、状态/API/Skill双规范、费用后置等冲突，未改原研究分析报告与其事实。

为什么这么改：审核指出的返工根因不是多加提示词就能解决，而是方法输入输出、正文/派生状态、审批/费用、部分采纳和验收不闭合。现在每类规则有一个权威落点，关键来源未知/未排演/评审不可用不再包装为PASS；末集收束和短篇规则有条件化，未实测LibTV行为仍列N及最小测试动作。

怎么验证：Node只读断言遍历7份方案文档，137既有按钮+12补充+8能力、24方法、18规则、24夹具、12质量组、10待证项各自编号唯一且齐全，failures=[]；相对链接、代码围栏、JSON示例及尾随空白检查通过，旧自动完稿/正文直提交/简单累加估时的代码片段断言不存在。`git diff --check`通过；`pre-commit run gitleaks --files`本轮12个文档/协调路径通过，另用`gitleaks dir --redact --no-banner`分别扫描五份合同目录、主指南和旧开发指南，均no leaks found（避免仅依赖Git钩子对未跟踪文件的覆盖）。`python3 scripts/agent_guard.py check`为OK:18 workstreams/374 claims。handoff/release在最后协调记录后执行。

本轮只有文档/台账/scope更新，没有修改业务代码、模型配置、源稿或Cookie，没有付费生成；因此未跑pytest/build/浏览器，不声称功能已通过。锁归属为codex/tv-director-plan-v2-20260925。下一步先把P0匿名F01–F24和schema做成可执行断言，再进入P1数据/费用/幂等；既有17项聚焦测试结果未收口和旧API问题仍未解决，不因文档修订抹掉。

### 2026-09-25 · short-drama × TV Director 融合方案补全

做了什么：新增 `docs/guides/tv-director-skill-fusion.md`，逐项对照本地 short-drama 原创/改编阶段与已取证的 LibTV 行为，明确证据等级、现有实现缺口、领域对象及不变量、两条状态机和人工门、来源事件覆盖、四方向改编、逐集时长/连续性/评审质量闸、Skill 运行合同、按钮→命令/API→测试矩阵、失败恢复、P0–P7 实施和退出门。特别注明本地 evolution 快照当前规则/案例均为零，隐藏私有 Skill 无法从输出唯一还原。

为什么这么做：当前写作服务只有一次模型调用和少量静态提示，尚未执行 Skill 的阶段方法；把运行链路成功误当质量合格，会重复出现30秒过密及EP02道具/时序返工。方案先固化可执行合同与反例夹具，后续按切片实施，不再仅靠改 prompt 或换模型。

怎么验证：对照两份 LibTV 报告、`short-drama/SKILL.md` 与对应 references、现有 Director API/UI；`python3 scripts/agent_guard.py preflight tv-director-implementation --owner codex/tv-director-v4-20260925 --path docs/guides/tv-director-skill-fusion.md` 通过；`git diff --check`、新文档尾随空白检查、`python3 scripts/agent_guard.py check`（18 workstreams/366 claims）通过。本轮只改方案/台账/scope，没有业务代码或付费生成；故不把方案标为功能已实现。

下一步：先冻结三个黄金夹具与匿名硬断言（1×30秒、2×30秒、EP02），再按指南 P1 schema/迁移和 P2 状态机进入业务实现；每片另行 preflight、测试与浏览器验证。

### 2026-09-25 · V4-Flash 模型合同与真实原创链路

做了什么：定位旧 502 为本机 loopback 请求继承代理环境，忽略的本机 `local.env` 已显式设置 `NEWAPI_TEXT_TRUST_ENV=false` 与 `SILICONFLOW_TEXT_MODEL=deepseek-ai/DeepSeek-V4-Flash`，未写入凭据。Director 服务端增加本机固定网关模型合同：预览和执行均解析为真实模型，明确选错时在调用前拒绝；页面展示真实模型，本机固定时不可在设定器改写。运行记录新增冻结参数、提示词字数及输出 SHA-256/字数（完整正文仍在对应待审变更，不复制凭据到台账），既有 SQLite runs 表按缺失列增量迁移。清理 V4 偶发输出开头的思考标签。

为什么这么做：固定模型路由会覆盖请求里的 `model`，若只让用户在界面填模型名，会产生预览与真实扣费模型错配；首轮真实大纲还暴露“30 秒内容过密、单集完结却留续集伏笔”，不能把技术链路成功等同内容质量通过。记录参数和响应摘要用于追查，不把可识别原稿或密钥写入公开台账。

怎么验证：通过本机网关的最小 V4-Flash 请求返回 200/模型 ID `deepseek-ai/DeepSeek-V4-Flash`；合成原创样例经浏览器生成故事大纲、接受版本 1、刷新持久；再以服务端预览的 `episode-001`、大纲版本 1、30 秒和精确 V4 模型调用，运行 completed、输出 1497 字，待审接受后分集文档版本 1，SQLite 记录的 request/response 字段可读。定稿前警告指出时长未经试读/分镜和连续性需人工复核；因实际内容仍显著超出 30 秒可拍容量，未勾选人工复核，也未定稿。`ruff`、`pnpm build`、前端 i18n 与 `git diff --check` 通过。聚焦测试第一次新合同断言发现测试构造缺 `mode`，已修；随后 17 项中的前 15 项通过，但本机 pytest 对异步用例前的导入/收集耗时异常，完整结果仍在隔离复核，不能写已通过。所有浏览器付费操作仅用于合成测试作品，未操作第三方项目。

与目标的差距：本次验证的是原创大纲→单集草稿，不是《非妖哉》改编，也不是 LibTV 全量等价。多轮对话、四类改编硬约束、差异块接受、真实 Skill 生命周期、导演画布/媒体事务及内容时长实测仍缺；页面虽有部分外形，不应称为“跟 Liblib.tv 一样”。

### 2026-09-25 · 首切片实现与本机验收

做了什么：新增项目内独立 Director 域、SQLite 版本化作品/文档/待审变更/事件/运行记录、冻结参数的写作编译器与 API；新增独立画布式剧本节点、右侧浮窗、Top8 双栏设定器、五类文档编辑、草稿审批、发送前参数/未知费用确认和定稿前质量报告。设定由服务端修订号 CAS 保存；产生正式文档、待审稿或成功/运行中模型记录后冻结，失败调用允许修复模型名。来源集号、交付集号与工作流序号分开存储。旧 story/freezone 页面未改。

为什么这么做：UI 参数须对应实际提交，不能仅留在前端；模型输出须先进入待审稿，不能覆盖正式文本；定稿须由人工确认，且模型不能自称已测时长/连续性。两次上游 502 后停止付费试错，保留失败运行供诊断，不宣称联机出稿成功。

怎么验证：`uv run pytest tests/test_tv_director.py -q` 为 16 passed；`uv run ruff check src/novelvideo/director src/novelvideo/api/routes/director.py tests/test_tv_director.py`、`python3 scripts/check_frontend_i18n.py`、`git diff --check` 均通过；`cd frontend && pnpm build` 通过。全量前端测试首次揭示本线越南语两个翻译键误入 ingest，已移回 director；`pnpm exec vitest run src/__tests__/i18n/locales-json.test.ts` 12 passed。最终 `pnpm exec vitest run` 为 430 files/3153 tests passed，3 files/7 tests failed，分别是未改动路径的 local-storage-quota 5 项、canvas prompt-mention 1 项和 ingest 1 项；不能据此宣称全量门通过，也未在本线修改这些路径。浏览器在 1200×863 和 1920×1080 核验了新建作品、设定修改/刷新保留、手工正文 v1→待审→接受 v2、已定稿作品只读、质量确认弹窗；一次合成作品手工定稿，另一次质量弹窗只验证后取消。实际调用分别以 `DC-content-rewriter-LLM` 和 `DC-freezone-story-script-writer-LLM` 送达网关，均收到空体 502，未生成待审稿、费用是否产生不可确认。

与目标的差距：这只是可用的第一个端到端切片，尚非完整 LibTV TV Director。未做实时多轮对话、来源事件映射/改编四方向硬校验、逐 hunk 差异、可执行 Skill 管理/自测、导演角色与画布事务、媒体生成及费用账本；第三方私有 Skill 无法仅凭界面反推。页面目前只展示独立方法包版本，不应称作原站同款 Skill。

### 2026-09-25 · 方案门与只读取证

做了什么：核对 STATE/Git/guard，浏览器只读确认现存项目中的剧本节点与右浮窗；读取 `short-drama` 方法中的事件覆盖、改编、单集、可拍性和反转规则，确定只取阶段方法与质量门，不把 50–100 集经验写成产品强制值。

为什么这么做：原有四阶段故事工作台与镜头表节点的语义均不等价于 TV Director；独立域可保护旧功能，并让新参数/版本/审阅合同可验收。

怎么验证：`agent_guard.py check` 为 `OK: 17 workstreams, 348 claims`，`status` 无活动锁；Playwright 登录态成功加载且只读页面显示剧本节点/浮窗，无付费操作。业务实现尚未开始，测试待跑。

## 已定下来的决策

- 新 UI/业务域独立；仅复用项目权限、模型网关、画布技术和导入边界，不改旧“虾本”体验。
- Skill 方法包必须版本化，关键事件与原稿行号相连；场次时长未实测只能标估算。
- 作品、文档审阅、费用审批分开；草稿接受不等于定稿，也不等于同意生成媒体。

## 2026-09-25 根因审计：不再用换模型掩盖方法缺口

- **已证实的传输问题**：旧 502 来自本机 loopback HTTP 继承代理；本地网关强制覆盖 `model`。前者已用本机环境修复，后者已由服务端模型合同在调用前校验。V4-Flash 真实请求返回与作品预览一致，所以这轮低质量不能归因于“模型没被调用”。
- **主要方法问题**：当前 `writing.py` 只摘取了 `short-drama` 的场次目标/阻力/动作/结果与不冒充实测时长等几条静态原则，未实现其 `/events → /skeleton → /adaptation → /episode → /review` 阶段路由、事件覆盖、逐场时长复核。该 Skill 默认面向 50–100 集，不能原封套到一集 30 秒；项目参数优先。`METHOD_VERSION` 是我们自建提示词版本，并非 LibTV 私有 Skill，也不是把本地 Skill 全部执行了。
- **观测与推断边界**：LibTV 研究证实方向问卷、总纲审批、每集单独费用确认、`review_episode` 及其可能 `skipped`、差异采纳和状态恢复；其隐藏系统提示词/Skill 全文不可从输出唯一反推。我们能复刻的是可观察合同和可测行为，不能把一次生成结果当内部源码。
- **本轮质量失败证据**：一集 30 秒的 V4 大纲引入过多动作且同时写“单集完结/续集接口”；第 1 集将至少 5/6/4 条动作分别塞入 6/9/15 秒，1497 字正文未按台词、行动、停顿、转场逐项估时。模型遵守了四个核心事件和“不要叮声”，说明基础指令跟随正常；缺的是生成前的容量预算、生成后的独立评审/限次修订，而不是简单换 V3.2。
- **纠偏顺序**：先冻结原创 1×30 秒、原创 2×30 秒和有来源 EP02 的 golden fixtures 与人工判据；再建版本化阶段产物（来源事件图、方向确认、每集 beat/场次预算）及服务端硬/软校验；输出未过门时明确标记评审失败，最多在已批准预算内限次修订，人工可看 diff 后采纳。最后在同一 fixture 下 A/B 比较 V4-Flash 与 V3.2。未建立这些门之前，不继续靠增加泛化提示词或重做 UI 宣称质量改善。

## 待办

- [x] M07故事大纲十类要素、short-drama方法根基、两入口统一合同/三语言投影、时长由用户决定；427后端/64前端/build通过，真实两笔失败和成功格式均留证。
- [x] 冻结五套多题材、非30秒单多集判据并实测；14次本方请求及一个LibTV完整大纲对照留证，失败均未删除，实验提示未晋级。
- [x] 已保存大纲独立证据审查接入、单独费用批准及失效合同；6次真实同稿审查留证，实验模板冲突消除，漏判明确展示；454后端/78前端及浏览器链路通过。
- [ ] 文学门仍未通过：本轮6次均漏判，按literary-benchmark §9.5补原子事实人工确认/正反例集与方向到大纲一致性，再做受控评审模型对照；引用证据入口不等于可靠事实门。两阶段创作仍只为诊断；M10完整容量、来源审计和完整24份/真人盲评未完成。
- [x] UI首批：原站36 SVG/14公共题材图本地固定、核心浮窗/设定器/参数/节点/三视口操作回归；49定向测试和build通过，具体边界见ui-parity.md。
- [x] UI第二批：设置/历史布局与真实命令、富文本工具栏/源码保底、完整Top8/自定义题材/21画风、单文档画布/文本附件/实际模型菜单/方向问卷分页；68前端/357后端与build通过，局部几何和三视口实点见ui-parity.md。
- [ ] UI剩余：E22–E31稳定选区/逐处差异、改编专用面板、全运行/审批态、Skill库/导演角色/媒体素材/分享插件、自动策略/跨设备、应用壳/Windows与全页像素验收；发布前核验素材使用权。
- [x] 完成首切片 API、存储、前端与聚焦测试。
- [x] 查明文本模型网关 502 并以 V4-Flash 对原创大纲/分集各跑一例，确认返回待审稿、接受后持久化。
- [ ] 用用户提供的《非妖哉》EP02 原稿跑改编端到端；生成前需检查来源和用户授权的费用/资料范围，保留源集号与交付集号证据。
- [x] 按九项审核意见修订融合v2：五份专项合同、完整按钮/方法/状态/语义/验收与旧设计冲突收口；仅文档完成，不代表功能通过。
- [x] v2.1设计收口：149动作/24方法/18规则/33转移/33类fixture逐项追踪、24源文件hash、22工作包与13差异决定；规格检查及22组反向突变通过。
- [x] WP00/WP01首批九类匿名fixture与strict合同/确定性守卫：104项新测试及17项旧Director测试通过；仅基础切片，未接API/UI/事务/费用，九类完整端到端仍未验收。
- [x] WP02–WP05首批安全执行接入：持久批准/派发/费用未知/任务恢复/保留结果、API与页面；37项故障/事务回归、9组件与12翻译测试通过。不是完整P1。
- [x] 真实V4-Flash原创/改编/定向修改3例，参数/完整输出与质量失败保留；loopback代理默认修复、17网关测试通过。
- [ ] 按融合v2.1 WP00–WP21完成匿名可执行fixture、严格schema及P1费用/幂等/正文权威，再实施阶段方法、完整UI、Skill/全能/导演/媒体并逐项验收。
- [ ] 清理或归档本机合成测试作品前先核对其无用户资料；不要以删除项目数据作为自动收尾。

## 阻塞

当前没有阻止继续本线编码的外部阻塞。五套大纲文学未PASS；新独立证据审查6次仍漏判，模板分离不能宣称解决语义问题；旧UNKNOWN无结算不重发。源站同简报仅一例并多经过方向选择，不是同模型盲测；尚无24份与真人评审。454后端/78前端/build与本轮合成报告UI通过，未复验物理第二设备或全量前端（历史3文件7项失败仍未解决）。时长实测、原子事实确认、完整来源审计/阶段编排和完整UI是未完成实现，不包装成外部阻塞。素材再分发许可待核验；未部署用户常驻栈。

## 交接摘要

- **最后完成到**：已保存大纲独立证据审查UI/API/费用/报告完成；6笔同稿真实审查仍漏判，1.1.0去掉正文模板冲突仍未修好语义。提交准备复验含网关471后端/78前端/build及钩子通过；全部付费证据/用量落档。历史14次生成诊断及LibTV《页脚》对照保留。M07仍2.2.0、short-drama根基与用户时长权威不变。实现已本地提交cb3833ee，未push/deploy；整套目标未完成，本实现线不归档。
- **下一步唯一动作**：先读literary-benchmark §9.5与workplace-reference-only/warmth审查原回包，在本台账开精确边界，把五类漏判沉淀为带原要求/剧情锚点及最小正反变异的反例fixture；设计可人工确认的原子事实版本，联通来源/方向/大纲，区别模型提议与用户事实。当前句覆盖与引用检查不代替该事实表。反例能区分正反后才做同稿已配置模型对照；不先加长prompt或购买新稿，旧UNKNOWN不重发。后续M10/完整来源/完整UI仍照原合同。
- **先读这些文件**：本台账顶部、literary-benchmark.md §9、outline_review.py/schemas/outline_review.py及test_outline_review.py/live_outline_review.py、outline_benchmark.py、outline-parity.md；M07看story-plan/{SKILL.md,method.md,manifest.json}。总目标看implementation-closure/runtime-validation和skill/workflow合同，UI看ui-parity/DESIGN/feature-contracts。6适配包不等于24完整方法，历史开销不等于内容改善。
- **不要动这些文件 / 决策**：现有 story/freezone/canvas 业务代码、用户源稿、研究 Cookie。

### 2026-09-28 · 连线配色串行协调

既有 DESIGN 内容先保留，canvas-lod-perf 后续仅补用户指定的 LibTV 连线三色与流星说明，由 codex/edge-meteor-20260928 串行集成；不改变本线视觉或接口。
