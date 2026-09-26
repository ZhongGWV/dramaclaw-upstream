# MiniMax H3 画布默认参数

**状态**：执行中
**最后更新**：2026-09-26
**基线**：`17436a2`，分支 `codex/sync-main-remotes`
**认领者**：`codex/minimax-h3-canvas-defaults-20260925`
**相关工作线**：`minimax-h3-liblib-parity`（已完成合同）、`sync-main-remotes`（已合并内容只允许窄范围产品调整）

## 目标

新建或未自定义参数的 DramaClaw MiniMax-H3 视频节点，默认将 `quality_mode=balanced`、
`inference_steps=8`、全能参考的 `model_mode=fl2va`，并提交一条强度为 1 的 LoRA：
`minimax_h3_fl2v_turbo_8step_v1.0_768p_comfyui_bf16.safetensors`。
新建视频节点无历史模型选择时默认 MiniMax-H3；H3 分辨率增加 544P（960×544）与 480P（864×480），默认 544P。
同时修复全能参考视频在没有时长边界时仍要求 `ffprobe`、导致本机无 `ffprobe.exe` 时提交前失败的问题。
全能参考支持混合图像/视频/音频素材；本机工作台的 FL2VA 与 Ref2VA 都可用于 R2V，保留用户选定的模式。

## 非目标

- 不改变 MiniMax H3 的其他产品模式、其他视频模型选项或既有保存节点上的用户自定义值。
- 不扩建通用 LoRA 编辑器；只把节点现有目录参数传入 H3 工作台。
- 不改外部 MiniMax 工作台或 ComfyUI 安装文件。

## 现状与证据

- `official_media_models.json` 当前给 H3 的目录默认值是 `fast`、4 步、全能参考 `ref2va`；通用参数芯片会读取该目录定义。
- H3 工作台适配器对缺省字段再次设为 `fast`、4 步、`ref2va`，且稳定 API 与 QuickUI 都硬编码 `loras: []`；只改目录显示值不足以确保后端实际提交一致。
- 现有 `MediaModelParameterChip` 支持多选，画布已经把 `model_params` 原样透传；因此沿用通用节点能力，无需改节点组件。
- 指定 safetensors 文件已在本机 ComfyUI `models/loras` 目录找到。
- 精确代码路径在工作区无未提交 diff。上游同步已将 `official_media_models.json` 纳入基线；本次仅更改 MiniMax-H3 条目，保留其他合并内容。

## 写入边界

| 路径 | 模式 | 作用 |
|---|---|---|
| `docs/agent/STATE.md` | 协调 | 登记本次 follow-up 与共享顺序 |
| `docs/agent/tasks/minimax-h3-canvas-defaults.md` | 协调 | 本次目标、计划与交接 |
| `docs/agent/claims/minimax-h3-canvas-defaults.toml` | 协调 | 精确机器可读范围 |
| `docs/agent/claims/minimax-h3-liblib-parity.toml` | 协调 | 将已完成 H3 线涉及的两个文件标成共享 follow-up |
| `docs/agent/claims/sync-main-remotes.toml` | 协调 | 将已合并官方目录的窄 H3 产品调整标成共享 |
| `docs/agent/tasks/sync-main-remotes.md` | 协调 | 记录不会重写其余上游合并结果 |
| `src/novelvideo/official_media_models.json` | 共享 | 设置 H3 节点参数默认值与 LoRA 默认项 |
| `src/novelvideo/generators/minimax_h3_workbench.py` | 共享 | 校验并将 LoRA / 模式 / 步数传给两种工作台传输 |
| `.dramaclaw-local/local.env` | 共享 | 修复本机 ComfyUI portable 安装路径，便于本地栈重启 |

## 协调与冲突

- 2026-09-26 与 `text-node-liblib-visual-parity` 串行共享 Freezone route：该线只修改 DeepSeek 文本模型选择与透传，由其集成；本线原有功能及写入边界保持不变。

- `minimax-h3-liblib-parity` 已完成，其原 claim 对目录和适配器为只读；本次按其原有 H3 合同做 follow-up，并互相登记共享顺序。
- `sync-main-remotes` 对官方目录原为只读导入。只允许在已合并结果上修改 MiniMax-H3 的精确条目，保留 G25 等无关上游内容；不更改视频节点三方合并文件。
- `ProviderModelPicker.tsx` 是新建节点静态默认模型常量的唯一修改点；保留已有“上次选择优先”行为。
- `freezone.py` 与多个已完成画布工作流共享；只改提交函数的视频时长探测条件，保留各自端点与其他逻辑。
- 本机栈配置与 `local-stack` 共享；只更新 `COMFYUI_DIR` / `COMFYUI_PYTHON` 指向已确认的 portable 安装，不读取或记录其他私有配置值。

## 实施方案

1. 把官方目录默认值改为 balanced / 8 步 / FL2VA，并声明固定候选 LoRA 的多选默认值与强度 1。
2. 适配器为缺省请求应用相同默认值；校验 LoRA 名称与强度，再分别组装 stable API 的 `loras` 和 QuickUI 的 `lora_models` / `lora_strengths`。
3. H3 目录新增 544P / 480P 并默认 544P，适配器将两档换算到目标尺寸；无历史选择时新建视频节点默认 MiniMax-H3。
4. H3 的 `all_reference` 且无时长边界时跳过源视频时长探测；显式时长边界、`video_edit` 与其他模型保留原探测行为。H3 参考视频不需要本地输入时长计费。
5. 对照 7860 工作台检查 R2V 的混合引用协议；FL2VA 与 Ref2VA 都使用 `referenceVideos` 附件槽，保留 FL2VA 默认值，不做强制模式映射。
6. 静态解析 JSON、Python 和前端相关 diff，检查 `git diff --check`；不运行测试（本轮请求未要求测试）。
7. 重启本地 DramaClaw 并检查 gateway、API、前端、ComfyUI 健康状态。

## 风险与回退

- 风险：稳定 API 与 QuickUI 的 LoRA 字段形状不同；适配器负责转换，避免改变通用画布参数协议。
- 风险：MiniMax H3 工作台需要接受 `544p` / `480p` 尺寸请求；适配器同时按短边策略计算宽高，16:9 下分别为 960×544 / 864×480。
- 风险：已有节点保存的 `model_params` 会优先于目录默认值；本次不会覆盖用户明确保存的自定义值。
- 回退：恢复 H3 目录的四项旧参数定义及适配器 LoRA 默认处理；保留本机模型文件和已保存节点状态。

## 验收标准

- H3 官方参数定义缺省为 balanced、8 步、FL2VA，并传指定 Turbo LoRA 与强度 1。
- 无历史选择的新视频节点默认 MiniMax-H3；H3 目录默认分辨率为 544P，并提供 480P 选项。
- 16:9 的 H3 544P / 480P 请求尺寸分别为 960×544 / 864×480。
- 缺省值由适配器校验后，stable API 与 QuickUI payload 都包含等价的 FL2VA / 8 步 / LoRA ×1。
- H3 全能参考且无时长边界时不启动 `ffprobe`；视频编辑、显式时长边界和其他模型仍按原规则探测。
- H3 全能参考的 QuickUI R2V 请求应将视频附件写入 `referenceVideos`、音频附件写入 `referenceAudios`；FL2VA / Ref2VA 只决定模型，不应过滤引用列表。
- JSON / Python 静态解析与 `git diff --check` 通过。
- 按本轮约定不运行测试；本地 DramaClaw 栈重启后 API、前端及 ComfyUI 健康检查通过。

## 已定下来的决策

- 通过官方目录声明默认值，并在后端适配器重复应用相同缺省，避免 UI 展示与实际 payload 分叉。
- 用现有 multiselect 透传模型文件名，适配器固定转换为强度 1；不新增前端节点专用 LoRA 状态字段。
- 新建节点的默认视频模型通过现有静态默认常量指向 MiniMax-H3；用户已经选过其他模型时仍沿用“上次选择”。
- MiniMax-H3 全能参考无时长边界时不读取源时长，也不计入源视频时长用量；视频编辑、显式时长边界和其他模型继续按原规则探测。
- 本机 `http://127.0.0.1:7860/` 覆盖脚本允许 R2V 请求选择 FL2VA 或 Ref2VA，并分别映射到本机 INT8 模型文件；本机工作台行为优先于上游通用模式说明。

## 进展记录

### 2026-09-26 · H3 默认项代码提交

做什么：将本轮 MiniMax-H3 节点默认模型、544P / 480P 分辨率、FL2VA / 8 步 / LoRA 默认值及无时长边界全能参考的探测修复提交为 `8e024ac`。提交仅包含四个实现文件。

怎么验证：提交前 `git diff --cached --check` 通过；前端 `pnpm build`（含 `tsc -b`）通过。按本轮约定未运行测试。

### 2026-09-26 · 排查与扩展请求登记

做什么：从画布文档 `liblib_72c039ea0dd1485493c4c54e3590bab7` 定位 MiniMax-H3 视频节点，错误详情为 `unable to read reference video duration: [WinError 2]`。代码对未配置时长限制的全能参考模式仍执行 ffprobe；本机只有 ComfyUI 附带 ffmpeg，没有 ffprobe。登记条件探测修复和用户新增的默认模型、分辨率请求。

怎么验证：读取当前节点保存的错误状态、H3 目录能力及 `video_billing.probe_video_duration_seconds` 实现，确认 `WinError 2` 来自调用不存在的 `ffprobe` 命令。未修改画布数据，也未提交实际生成任务。

### 2026-09-26 · H3 分辨率、默认模型与视频引用排错

做什么：新增 544P / 480P H3 分辨率并以 544P 为目录首选；16:9 时按用户给定尺寸得到 960×544 和 864×480。把无历史视频模型选择的新节点默认值改为 MiniMax-H3。参考视频错误确认来自未安装到 PATH 的 `ffprobe`，并将路由探测调整为仅对显式视频时长边界和 `video_edit` 执行。

为什么：H3 的普通全能参考没有时长限制，也不需要源片时长计费；此前公共路由仍无条件 probe，导致 WinError 2。ComfyUI portable 中虽有一个 ffmpeg 可执行文件，但没有 ffprobe。

怎么验证：JSON 与两个 Python 文件静态解析通过；`git diff --check` 仅提示原有 routeTree 换行格式；agent guard 通过。重启后 gateway、API、前端、ComfyUI 均 HTTP 200，运行 API 的 MiniMax-H3 目录返回 544p / 480p / 768p / 2k，默认推理步数为 8。按本轮约定未运行测试，也未提交实际生成任务或扣费。

### 2026-09-26 · 按自用场景收窄参考视频探测

做什么：将跳过时长读取的条件收窄为 MiniMax-H3 的 `all_reference` 且没有目录时长边界；其他模型保留原来的总时长探测，显式时长约束与 `video_edit` 行为不变。

为什么：用户说明是本机自用、不需要源参考视频时长计费；该 H3 模式没有源时长限制，调用缺失的 `ffprobe` 只会阻断提交。

怎么验证：Python AST / 模型目录 JSON 静态解析通过，`git diff --check` 通过（仅提示原有 `routeTree.gen.ts` 换行格式）；重启后 gateway、API、前端、ComfyUI 均 HTTP 200，H3 视频模型目录返回 544p / 480p / 768p / 2k，并显示 balanced、8 步、FL2VA 和指定 LoRA。未执行测试，也未提交实际生成任务。

### 2026-09-26 · 核对本机全能参考协议并撤销错误假设

做什么：查看本机 7860 工作台页面、bootstrap 能力和 `h3-reference-model-switch.js`。确认其 R2V 请求可以选择 FL2VA / Ref2VA，脚本只切换模型模式与模型文件；工作台前端与 DramaClaw 适配器使用 `referenceVideos` 字段。此前“FL2VA 不支持全能参考”的推断不适用于这台本机工作台，已撤销强制 Ref2VA 的文档决策，代码保留 FL2VA 默认。

怎么验证：只读查看 7860 页面和本机 assets；画布 JSON 显示目标 H3 节点 `v-IC2oUgtWqC` 有 2 个图像、1 个音频、1 个视频上游。前端 `VideoNode.tsx` 会将它们按各自媒体类型组装，API route 保留类型，H3 adapter 将视频上传至 `video-1` 并写入 `referenceVideos`。没有发起生成提交；尚未捕获该节点真实运行请求，所以仍需定位用户所见“缺视频附件”的具体断点。

### 2026-09-25 · H3 默认参数实现

做什么：依据用户截图定位为 DramaClaw 画布 H3 节点；把目录与适配器缺省改为 balanced / 8 步 / FL2VA，并把指定 LoRA ×1 转换到 stable API 和 QuickUI payload。为恢复本地服务，另将私有环境配置中的 ComfyUI 路径加入共享边界。

怎么验证：JSON 与 Python 静态解析通过；`git diff --check` 通过（仅提示此前已有的 routeTree 换行格式）；未运行测试。修正私有配置后重启 DramaClaw，ComfyUI、gateway、API、前端四端健康检查均为 HTTP 200。ComfyUI portable 路径及 LoRA 文件存在；其 Python 环境目录附带 ffmpeg，但该目录未在栈的 PATH 中，且未找到 ffprobe。

## 待办

- [x] 通过 agent guard acquire / preflight 后，修改目录和 H3 工作台适配器。
- [x] 静态解析、精确 diff 检查；未运行测试。
- [x] 更新本机 ComfyUI 路径并重启本地栈，确认 ComfyUI、gateway、API、前端健康。
- [x] 静态确认新建视频节点默认 MiniMax-H3；运行 API 返回 H3 544P / 480P 档位，目录首项 544P。
- [x] 查看本机 7860 工作台，确认 FL2VA / Ref2VA 均可用于 R2V 混合引用，且协议包含视频附件字段。
- [ ] 找到用户所见缺附件发生在哪一层；先检查真实任务日志或请求中的媒体类型/附件计数，不通过新生成任务盲测。
- [ ] 用含视频引用的全能参考节点确认提交前检查不再因 ffprobe 缺失被拦截；不替用户实际提交生成任务。

## 阻塞

无代码阻塞；共享路径顺序已在 `minimax-h3-liblib-parity`、`sync-main-remotes` 与其他 freezone 路由工作线 claim 中互认。未运行测试，遵照本轮“不主动测试”的执行约束。ComfyUI 自带 ffmpeg 不含 ffprobe；本次代码修复将避免无时长边界的 H3 全能参考依赖该工具。实际生成任务未触发。

## 交接摘要

- **最后完成到**：H3 默认模型/分辨率与 H3 全能参考跳过源时长读取已更新；已核对本机工作台 FL2VA 与 Ref2VA 都可用 R2V 混合引用，代码路径包含 `referenceVideos`。
- **下一步唯一动作**：基于真实任务日志或请求确认媒体类型/附件计数在哪一层丢失，再做窄范围修复；不通过新生成任务盲测。
- **先读这些文件**：H3 目录与适配器、`freezone.py` 中模型能力时长分支、`ProviderModelPicker.tsx` 默认常量。
- **不要动这些文件 / 决策**：不改用户画布 JSON；不改其他模型默认值；不改变无视频编辑模式的计费时长口径。
