# 硅基流动与火山 Agent Plan 模型接入

**状态**：待验收
**最后更新**：2026-09-27
**基线**：`1fa3c1b`；`codex/sync-main-remotes`，与 origin/codex/sync-main-remotes 一致，工作区初始干净。
**认领者**：`codex/providers-20260927`
**相关文档**：无
**相关分支 / PR**：无

## 目标
两家云供应商和本地模型共同列出，用户选择启用及默认模型；文本节点可选 Seed-Evolving、DeepSeek-V4.1-Flash，所有模型标明供应商；目录选择与实际路由一致，密钥不回传前端。

## 非目标
不迁移画布，不改本地工作流 JSON，不提交密钥，不自动切到按量收费地址。

## 现状与证据
现有 local_gateway 固定硅基流动、文本正则筛选，媒体目录走 NewAPI 兼容层；本线保留兼容层并加稳定供应商前缀与能力元数据。已有 origin/main 有传统 volcengine 配置和 NewAPI 渠道管理，无 Agent Plan 多目录接入；相关远端当前只有 main、minimax-h3-upstream 和本分支，复用已有文本流式与媒体生成器。
硅基流动模型列表实测 98 项。火山 ListArkAgentPlanModel 需要 AK/SK；只有 API Key 时使用注明来源/日期的官方目录，不伪称账户实时清单。Medium 不含视频权益。初始套餐凭据返回 401；用户更新密钥后，两个指定文本模型已真实返回成功。历史 Coding 入口返回 InvalidSubscription，不回退到按量地址。

## 写入边界
下列精确文件均由本线串行集成；已有认领改为双方共享，新文件独占：
- `src/novelvideo/local_model_catalog.py`
- `src/novelvideo/local_provider_api.py`
- `src/novelvideo/local_gateway.py`
- `src/novelvideo/api/routes/model_gateway.py`
- `src/novelvideo/api/routes/freezone.py`
- `src/novelvideo/freezone/text_node.py`
- `src/novelvideo/generators/nanobanana_grid.py`
- `frontend/src/api/ops.ts`
- `frontend/src/components/settings/settings-dialog.tsx`
- `frontend/src/components/settings/local-model-catalog.tsx`
- `frontend/src/lib/local-model-catalog.ts`
- `frontend/src/features/canvas/nodes/shared/TextModelPicker.tsx`
- `frontend/src/features/canvas/nodes/shared/H3PromptOptimizer.tsx`
- `frontend/src/features/canvas/nodes/TextAnnotationNode.tsx`
- `frontend/src/features/canvas/ui/ProviderModelPicker.tsx`
- `tests/test_local_model_catalog.py`
- `tests/test_local_provider_api.py`
- `frontend/src/__tests__/local-model-catalog.test.tsx`
- `frontend/public/locales/zh/translation.json`
- `frontend/public/locales/en/translation.json`
- `frontend/public/locales/vi/translation.json`

私有运行配置与凭据仅在被忽略目录读取/保存，禁止写入台账值。

## 协调与冲突
此前功能已提交，相关工作线先完成；共享 claims 互认后串行集成。用户本次授权替代 local-stack 的固定供应商历史决策。供应商标识单独显示，媒体传输仍用既有 NewAPI 兼容协议。

## 实施方案
1. 独立本地模型目录：稳定 ID、能力、来源、启用/默认值、刷新保留用户选择、原子保存。
2. 网关按模型供应商鉴权/路由，保留流式；图像和视频协议适配与套餐能力限制。
3. 后端模型目录与提交校验复用目录；本地工作流保持可用。
4. 设置管理页支持供应商、类型筛选、搜索、启用、默认、刷新与连接验证；节点选择显示供应商。
5. 针对性路由/刷新/禁用/媒体/前端回归、类型检查、安全检查，重启本地服务并实测。

## 风险与回退
模型目录过期、协议差异、禁用默认模型需显式处理；刷新失败保留缓存并标明错误。按本线差异回退，保留私有配置和历史节点。

## 验收标准
- [x] 两家供应商可并存、保存后刷新仍保留启用选择。
- [x] 指定模型路由、禁用拦截、SSE 与附件合同回归通过；两项火山文本真实调用已成功，图片单独待验收。
- [x] 前端类型、构建及临时预览管理页的选择/持久化验证通过。
- [x] 密钥仅后端私有保存，改动精确匹配扫描及 gitleaks 均通过。

## 进展记录
### 2026-09-27 · 配置代码提交前审计通过
- 逐文件确认 54 个候选路径均为本线业务、测试、三语文案及必要协调记录；暂存区与精确清单一致，无本地工作流 JSON、私有配置、密钥或运行产物。
- 对候选完整文件与实际私有凭据进行内部逐字比对，无命中；Gitleaks 8.30.1 按仓库配置扫描暂存差异约 119KB，no leaks found；`git diff --cached --check` 通过。
- 按用户要求建立本地配置功能提交，使用 Signed-off-by。实现验证与实际调用证据见下文，未重复跑测试，未推送远端；火山图片真实生成待验收不影响本次代码留档。

### 2026-09-27 · 配置代码提交方案
- 用户要求提交配置代码：将本线模型目录、供应商路由、设置与节点选择器、相关测试和三语文案作为一个功能提交，附必要路径协调和交接记录。
- 暂存前逐文件比对本线认领及既有差异；密钥、本地配置、目录数据库、生成结果和工作流 JSON 不进入提交。运行暂存差异与密钥检查，使用既有 Git 身份及 Signed-off-by，不推送远端。
- 本轮不改业务实现，不重新生成素材或重复运行实现测试；复用上文前端 9 项、后端配置 API 8 项、类型/构建及两项火山文本真实调用证据。火山图片待验收项继续保留。

### 2026-09-27 · 新套餐密钥及文本真实调用通过
- 用户更新原凭据文件并要求复测；确认文件比已保存凭据新后，通过正式本地设置接口同步至私有密钥文件，未输出或写入仓库凭据内容。
- 正式设置连接测试：Seed-Evolving HTTP 200，connected=true，约 1.09 秒。正式本地网关 SSE：DeepSeek-V4.1-Flash HTTP 200，返回 OK 且完成标记正常，首内容约 1.51 秒、总耗时约 1.52 秒。
- 服务每次请求读取供应商凭据，本次替换无需重启；连接检查已清除旧 authentication_failed。当前火山文本鉴权阻塞解除，图片仍保留单独真实生成验收项；此次无业务代码修改。

### 2026-09-27 · 用户授权管理员重启完成
- 用户明确授权关闭重启后，普通停止仍被 Windows 拒绝。通过正常 RunAs 管理员确认调用系统进程管理器，核对端口/PID 后成功停止旧 API、网关和前端；未修改系统权限策略。
- 使用原本地启动脚本重新启动，同一 API、网关和前端端口恢复服务；ComfyUI 与 H3 复用原进程。网关健康响应确认加载新版，API 与前端代理的本地目录接口均返回 200，共 120 项，两项指定火山文本模型已启用。
- 正式浏览器设置页确认 Base URL 可见、两家供应商密码输入均可编辑，目录加载错误已消失。真实密钥未改动；火山既有鉴权错误仍待用户替换有效套餐密钥。此次无业务代码或画布修改。

### 2026-09-27 · 设置配置可见性修复验收
- 供应商卡片直接显示后端返回的 Base URL、已配置状态和密码输入框；留空不替换，保存成功清空输入框，失败保留草稿。三语言文案齐全。
- 修复目录请求失败时整块配置消失：404 明确提示重启后端及本地网关，409 提示本地配置未加载，其余失败保留重试；未加载时只读展示明确标注的内置地址，不冒充已保存配置，禁止提交密钥。目录读取限时 10 秒、关闭自动重试，保留人工重试。
- 前端 `local-model-catalog.test.tsx` 9 passed，后端 `test_local_provider_api.py` 8 passed（含两供应商独立密钥替换、不回显及无效值保护）；`tsc -b`、Vite build、Ruff、前端 i18n 与 diff check 通过。按真实相对路径扫描 54 个工作区改动文件无密钥泄露；路径缺失的 stdin 扫描曾将源代码误报，恢复文件路径后正确通过，未修改扫描规则。
- 浏览器确认正式页面准确显示 404 原因及配置预览；临时预览连接新接口时，两家供应商地址可见、密码输入可编辑，实际排版检查通过。临时页面和预览服务已关闭，包括此前遗留的预览 Python 子进程；未修改用户真实密钥、画布及工作流。
- 正式 API 与网关仍为旧版本，当前会话无法终止用户启动的 Windows 进程。功能正式启用等待用户关闭原项目启动窗口，再按现有脚本启动新版本；火山 401 鉴权问题仍独立待解决。

### 2026-09-27 · 设置配置可见性修复方案
- 现场目录接口在当前 API 和前端代理均返回 404，旧网关健康响应也缺少新供应商字段：正式服务尚未加载本线后端；前端错误分支只显示一句加载失败。
- 在既有范围内修复供应商卡片：直接展示 Base URL 与密码输入框，保存不回显旧密钥；加载失败显示区分旧后端、服务不可用的提示与重试入口，保留明确标注的内置地址预览，未连接前禁止保存。
- 优先完成可验收 UI 与针对性回归；正式启用仍需旧服务退出后重启，不通过更换运行端口或启动重复任务服务绕过进程权限。
- 范围仅现有面板、目录类型、三语言与既有前端回归文件；不改画布、本地工作流和供应商地址路由策略。
- 验收追加既有 `tests/test_local_provider_api.py` 中的配置接口合同：保存只修改选定供应商，响应不含新旧密钥，无效输入保留原配置。

### 2026-09-27 · 实现及验证
- 新增私有 SQLite 统一目录；硅基流动 `/models` + 官方分类接口同步 98 个模型，火山使用 18 项注明日期的官方目录，本地保留 4 个工作流模型，共 120 项。管理页支持筛选、搜索、启停、默认、保存密钥与连接测试。供应商命名空间贯穿文本/图片/视频路由，不静默替换未知或禁用模型。
- 文本新增指定两个火山模型、媒体能力及供应商标签；保留流式，引用图片/视频抽帧传入视觉模型；H3 格式转换只发文本绑定。默认文本实发与目录一致；新建图片/视频使用目录默认，复制和现有节点保持显式选择。
- 云图片编辑直接上传本地素材；SF 旧版编辑一图、2509 三图并省略不支持的尺寸参数。SF 视频按官方 `image_size` 720P 三种比例提交、保留供应商任务 ID、规范化状态。Medium 视频权益明确不可启用。未修改本地工作流 JSON、画布内容或位置。
- 针对性 `pytest tests/test_local_model_catalog.py tests/test_local_provider_api.py tests/test_local_gateway.py tests/test_h3_prompt_optimizer.py -q`：65 passed。加上 `test_model_gateway_settings.py` 的较广回归：166 passed / 1 failed（新增默认测试前的次数），唯一失败为原有 H3 导出目录仍期待仅 768p/2k，当前基线已支持 544p/480p。
- 前端 `tsc -b`、`vite build` 通过；local-model-catalog + catalog-image-model-request 两文件 9 tests passed。此前较广的 video-model-capabilities 有一项源文本 LF/CRLF 断言失败，涉及未改动的 VideoNode.tsx，已记录不覆盖。
- Ruff、双端 i18n、CE 11 个端口闭合、agent guard、diff check 均通过；gitleaks 扫描全部本轮差异约 130KB 无泄露，真实凭据精确匹配扫描 54 个改动文件无命中。
- 真实调用：SF DeepSeek 流式返回 200 / 2.64s；Z-Image-Turbo 图片成功 / 17.52s；Wan2.2-T2V 五秒视频成功且取回结果链接 / 203.61s。两个火山文本和 Seedream 图片均返回 401；请求体及鉴权分流由 mock 合同覆盖，不能认定火山生成已通过。
- IAB 临时预览实际验证供应商/用途筛选、启用 Z-Image、文本与图片默认选择、刷新持久化。测试后恢复 SF 文本、Qwen 图片、H3 视频默认及 Z-Image 禁用；临时页面及预览服务已关闭。无用户画布写入。
- 原运行 API/网关是当前会话无法终止的 Windows 进程：Stop-Process 返回系统拒绝访问（不是审批拒绝）。旧服务均继续运行，尚未加载新后端。已异步请用户关闭原项目启动窗口，保留 ComfyUI/H3。准备好的私有重启帮助程序可在窗口关闭后使用。

### 2026-09-27 · 方案门
完成当前实现和官方文档审查，记录密钥失效；准备 acquire/preflight。

## 已定下来的决策
火山只使用 Agent Plan 专用地址；默认视频仍 MiniMax H3。视频素材在文本模型处采样帧传入并标明，不静默忽略附件。

## 待办
- [x] 用户授权后通过管理员流程关闭旧进程，用原启动脚本启动新 API/网关/前端，验证正式设置页目录和配置入口。
- [x] 新密钥下两个指定文本模型真实成功验证，DeepSeek 流式返回完成。
- [ ] 新密钥下火山图片模型真实生成验收。

## 阻塞
火山文本鉴权与旧服务权限阻塞均已解除；火山图片真实生成仍待单独验收。

## 交接摘要
- **最后完成到**：正式服务与设置入口已正常，SF 真实生成及新密钥下两项火山文本真实调用通过。
- **下一步唯一动作**：完成火山图片模型的最小真实生成验收，并记录结果。
- **先读这些文件**：本台账及 local_gateway.py。
- **不要动这些文件 / 决策**：本地工作流、密钥内容和画布位置。

### 2026-09-27 · 扩展精确范围
新增共享路径 `src/novelvideo/generators/video_generator.py`（云模型首帧通过本地网关上传）、`tests/test_local_gateway.py`（更新原有静默替换测试为严格模型选择合同）。现有 70 项回归 67 项通过，3 项是本轮明确替代的静默模型选择和脱敏错误返回，针对性更新。

### 默认值及官方协议补齐
扩展精确边界 `frontend/src/features/canvas/application/nodeFactory.ts`：只在新建节点且未显式传 model 时用目录默认值，加载或复制保持原 model。官方硅基流动接口证据确认视频字段为 image_size、只支持 720 档；Image-Edit 不传 image_size，旧版仅一图，2509 三图。补齐契约测试。
