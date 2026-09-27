# 唯一工作流、审批、费用与恢复合同

设计 v2.1 / 2026-09-25，属于[完整融合方案](../tv-director-skill-fusion.md)。这里的转移表覆盖旧稿的流程箭头/伪代码；流程名称是我方设计I，不冒充LibTV私有状态机。其余文件只能引用这里，不能再定义自动完成条件。

## 1. 数据对象与互不替代的状态

| 对象 | 必须字段 | 不变量 |
|---|---|---|
| Work | id/projectId/specRevision/state/activeCheckpointId/episodeOrder[] | state=active/needs_review/completed/archived；completed不是run成功 |
| ConfirmedSpec | revision/mode/brief/genres/audienceIds/structureId/totalEpisodes/defaultDurationSeconds/episodeDurations/endingType/outputLanguage/market/narrativeTone/visualStyle/lockedFacts/provenance | 当前规格不可原地改；每字段来源user/template/inferred |
| Episode | id/workId/orderKey/sourceEpisodeLabel/deliveryLabel/documentId/finalizationId | ID不随重排/显示号改变；ordinal由order推导 |
| StageRun | id/stage/skillBinding/snapshotHash/modelBinding/status/parentRunId/attempt | queued/running/waiting/succeeded/failed/cancel_requested/cancelled/unknown；succeeded仅本阶段产物完成 |
| Checkpoint | id/workId/revision/kind/status/payloadHash/expectedVersions/resumeToken | kind见下表；open/answered/skipped/superseded；只允许CAS转移一次 |
| Question | id/checkpointId/toolCallId/version/questions/answers | 单多选/自由输入结构化，忽略单独事件，不填默认答案 |
| QualityReport | id/documentVersion/contentHash/inputSnapshotHash/reviewerRunId/checks/status | 同版本才有效；PASS/FAIL/UNAVAILABLE不能混用 |
| Finalization | id/episodeId/documentVersion/semanticHash/reportId/actor/time/attestations | 人工确认；下游前置变更即stale，历史记录保留 |
| Approval | id/actor/scope/requestHash/policyVersion/limits/expiresAt/status | pending/granted/denied/expired/consumed；不能授权自身或泛化到未列任务 |
| CostEntry | id/operationId/providerTaskId/estimate/reserved/actual/currency/status | amount未知为null，不是0；独立于run成功 |
| Event | eventId/projectId/workId/sessionId/runId/seq/type/schemaVersion/payloadVersion/payload | 持久化后推送；按作用域序号回放，不能用时间相近关联工具结果 |

作品语义、草稿/正式文档、选区、依赖和部分采纳的权威细节见[文档合同](document-semantics.md)。Work.completed表示合同内所有必交付集已人工确认；productionReady另算，未试读/未验证媒体不得偷换为“可直接成片”。

## 2. 正常路径：后台工作不等于多弹一次确认

原创：创建 → 方向分析 → WAIT_DIRECTION → 总纲/人物/场景/道具/目录 → WAIT_OUTLINE → 每集计划 → 正文/评审/限次修订 → WAIT_EPISODE → 人工定稿 → 下集，或全剧完成。

改编：创建/源验证 → 全文事件抽取 → 独立漏检/矛盾核验 → 必要时WAIT_FACTS → 方向/改编决策 → WAIT_DIRECTION → 总纲 → 同一逐集链。来源分析与方向可以展示阶段进展，但不能在关键源事实未解决时写骨架/正文。

episode plan是后台校验阶段，**正常路径没有强制 WAIT_EPISODE_PLAN**。仅出现超容量、锁定事实冲突、需要改规格或预算不足时弹具体问题。普通界面人工门为方向、总纲、逐集“改/定稿”和所需费用批准；上传、抽取每块、每个资产文件、每张估时表不各弹确认。

费用门是覆盖任何stage的中断栈：若已有合法范围授权，后台扣减对应预留并展示；没有则WAIT_COST，批准后回到唯一resumeToken。剧情问卷和费用卡可以同屏，但答案不可兼当费用批准。

## 3. 唯一转移表

表中后台执行统称EXEC(stage)。每次转换写state transition event（before/after/reason/actor/commandId/版本）。前置不满足返回具体409/422/403，不部分执行。

| ID | 当前 | 事件/动作 | 守卫与副作用 | 下一状态/用户可见结果 |
|---|---|---|---|---|
| WT01 | 新作品 | create/send | 校验权限、preset、source可读、reference；冻结输入 | EXEC(source或direction)，需要费用则WAIT_COST |
| WT02 | EXEC(source) | 所有读取块成功 | 必须再做独立语义覆盖、别名、跨块、矛盾审计 | 无关键问题→EXEC(direction)；有问题→WAIT_FACTS |
| WT03 | WAIT_FACTS | 回答事实/批准删改关键事件 | 每项绑定sourceVersion+factId+旧新值；冲突不得批量默选 | 修正source graph后重审→EXEC(direction) |
| WT04 | WAIT_FACTS | 忽略 | 不解决事实、不写后续产物 | WAIT_INPUT，显示缺哪项及返回回答入口 |
| WT05 | EXEC(direction) | schema及约束通过 | 四个方向或缺信息问卷，不提前生成全文 | WAIT_DIRECTION |
| WT06 | WAIT_DIRECTION | 选择/自由填写并提交 | 方向、集数、时长、结构合成新confirmedSpec；消除auto | EXEC(outline/bible/directory) |
| WT07 | WAIT_DIRECTION | 要改/返回 | 保留已答草稿；变方向仅重新分析受影响阶段 | WAIT_DIRECTION或EXEC(direction) |
| WT08 | EXEC(outline) | 筹备产物完成 | 机检、事实/目录/结构检查；形成待审CS | WAIT_OUTLINE，文档交付与总纲决策 |
| WT09 | WAIT_OUTLINE | 差异采纳 | 原子提交DV，不等于“继续写正文” | 仍WAIT_OUTLINE，显示可“采纳并继续” |
| WT10 | WAIT_OUTLINE | 确认/采纳并继续 | 无待审CS、关键错误、来源未知；冻结规格与总纲版本 | EXEC(episode_plan)；不足授权插入WAIT_COST |
| WT11 | WAIT_OUTLINE | 要改 | 明确修改范围→影响计划→CS | WAIT_DIFF（returnTo=WAIT_OUTLINE） |
| WT12 | EXEC(episode_plan) | 计划通过 | 时间/因果/资源预算可行；不是把未知当PASS | EXEC(write/review)，无额外人工计划门 |
| WT13 | EXEC(episode_plan) | 容量/规格冲突 | 列压缩内容、延长、增集等具体选择 | WAIT_CONSTRAINT；不得自行改秒数/集数 |
| WT14 | EXEC(write/review) | 完成或预算内修订后完成 | 保留草稿；每轮校验绑定新版；质量失败照实交付 | WAIT_EPISODE，显示可改/可定稿及阻断原因 |
| WT15 | WAIT_EPISODE | 接受草稿/单处修改 | CS事务提交新DV、重建派生状态 | 仍WAIT_EPISODE；接受不是定稿 |
| WT16 | WAIT_EPISODE | 要改 | 指定场次/全文/关联范围→草稿CS | WAIT_DIFF（returnTo=WAIT_EPISODE） |
| WT17 | WAIT_EPISODE | 确认定稿，非末集 | 本节质量守卫通过，创建Finalization及边界快照 | WAIT_NEXT；“确认并续写”可原子记录续写意图 |
| WT18 | WAIT_NEXT | 写下一集 | 验上集定稿及语义边界；冻结下一集输入；独立子授权 | EXEC(episode_plan)，需要则WAIT_COST |
| WT19 | WAIT_EPISODE | 确认定稿，末集 | 所有当前episodeId正式稿与有效Finalization齐全；无CS/阻断/缺交付 | Work.completed；不可仅靠文件存在complete |
| WT20 | WAIT_DIFF | 单/多组采纳并提交 | 依赖闭包、全baseVersions CAS、重检、原子事务 | returnTo；影响旧定稿则Work.needs_review |
| WT21 | WAIT_DIFF | 全拒绝/退出保留 | 全拒绝回正式稿；保留则CP仍可恢复 | returnTo或仍WAIT_DIFF；不丢正式稿 |
| WT22 | WAIT_CONSTRAINT | 批准规格变更 | SpecChangeSet及影响范围确认；旧quote/quality按依赖失效 | 重新计划；不从失败正文直接定稿 |
| WT23 | 任意open问卷 | 忽略 | 记录skipped；必须答案仍缺 | WAIT_INPUT，显式显示“尚未继续” |
| WT24 | 任意EXEC | 需新费用授权 | 保存stage及输入hash的resumeToken | WAIT_COST；不得先请求供应商后补审批 |
| WT25 | WAIT_COST | 批准 | 报价/策略有效、参数一致、资金预留原子成功 | 返回原EXEC；不重新创建作品 |
| WT26 | WAIT_COST | 取消/忽略/过期 | 不调用供应商；释放未发送预留 | WAIT_INPUT，保留产物；过期可重新报价 |
| WT27 | 任意EXEC | 用户停止 | 发cancel_requested；未发送子任务停止；已发送尝试取消 | CANCELLED或UNKNOWN，保留已产生稿与费用状态 |
| WT28 | EXEC | 可判定失败 | 保存错误/副作用/费用；有限重试需范围授权 | FAILED_RECOVERABLE及单阶段恢复按钮 |
| WT29 | EXEC | 供应商接单结果不明 | operationId与预留保留；禁止自动重发 | UNKNOWN，查询/核对，不显示零费用 |
| WT30 | FAILED/CANCELLED | 恢复 | 校验snapshot依赖是否仍当前；旧输入失效先重编译/报价 | 从checkpoint恢复；完成阶段不重跑 |
| WT31 | WAIT_INPUT | 补充/选择继续 | 明确解决原resumeToken要求；新要求先算影响 | 回原CP/EXEC，不跳过原门 |
| WT32 | completed | 请求改正文/风格/集数/语言 | 预览影响；原正式版本与定稿历史保留 | WAIT_DIFF；提交后needs_review，重审后才再completed |
| WT33 | 任意 | 刷新/切会话/关闭浮窗 | 只读恢复最后event与CP；关闭不取消 | 不改变运行/定稿/批准状态 |

同一作品不允许两个改变正式内容的活跃编排器并行提交；用户新消息可排队、明确停止旧run后再处理或开新会话，不悄悄并发续写。阅读/界面操作可并发。

## 4. 定稿、人工接管和质量守卫

`canFinalize(episodeId, DV, actorAttestation)`必须同时满足：正文解析可用、语义快照与DV/contentHash一致、必保事实与引用检查无FAIL、没有未处理依赖CS、上游版本有效、评审与目标版本对应、人工明确确认。绝不让模型调用finish工具直接绕过此函数。

质量状态区分三类：

1. **已证实硬错误**（错集号、关键事实丢失、确定性道具冲突、非法版本、明确超时下界等）：必须修正或走有依据的“修改锁定约束”流程；不能用“我承担风险”变成PASS。
2. **评审模型UNAVAILABLE**：不能自动通过。可重试一次且预算允许，或用户打开逐项人工审核表，填写对应证据/结论后形成独立HumanReview；report仍保留UNAVAILABLE，最终显示“人工审定，自动评审不可用”。人工也发现疑点则不能定稿。
3. **未测时长/不确定语义**：确需继续时可以作为“人工确认文学稿，制作验证未完成”交付；不标productionReady。关键来源事实不明、未解释规则冲突必须先解决；纯表演时长未知允许在无已证实超量的条件下带限制定稿。严谨性不能变成把所有未知一律冒充成功或一律禁止保存。

人工声明绑定具体checkId与版本，不是总开关qualityAck=true。修订之后全部受影响的HumanReview/Finalization失效，未受影响证明需依赖hash相同。是否真人试读、分镜排演分别记录证据和时长；LLM给的“414秒”不是实测。

## 5. 全阶段费用合同（P1先实施）

### 5.1 哪些阶段入账

| 成本类别 | 纳入调用 | 默认授权边界 |
|---|---|---|
| source | OCR/媒体转写/逐块抽取/独立漏检/矛盾复核 | 上传本地解析可免费；任何远程模型需source范围与块数/金额上限 |
| planning | 方向、总纲、角色/场景/道具、目录、上下文压缩 | 一次筹备授权覆盖列明子阶段；“设置确认”不等于授权 |
| episode | 单集计划、正文、独立评审、最多一次自动修订、修订稿再评 | 每集独立额度；未显式批量政策则逐集问 |
| revision | 局部/联动/风格/集数/语种改写、派生语义更新 | 预览影响及范围报价后批准；手工编辑的本地保存无费用 |
| skill_test | Skill构建所需模型、自测/对照/角色生成 | 按fixture数、模型和最多尝试数估计；不拿自测当免费 |
| directing | 镜头分析、批量优化、画布视频/音频理解 | 明示多少节点/时长和允许工具，子任务独立记录 |
| media | 图像、H3视频、音频、上传转换等远程服务 | provider能力报价；文档接受/定稿绝不代替媒体批准 |

请求只含本地函数时记录costClass=local/actual=0及无外部调用证据，不创建虚假的付费审批。供应商没报价/未知价格时amount=null；只有可计算安全上界或用户明确unknownCostConsent+可执行用量上限时才允许。无法约束未知费用时暂停，不能用“私有/不重要”当无限授权。

### 5.2 同意的粒度与预算

`ConsentScope = {projectId, workId, stages[], episodeIds[], modelBindings[], allowedToolKinds[], maxPerOperation, maxTotal, currency, maxTokens?, maxMediaSeconds?, maxAttempts, expiresAt, unknownCostConsent}`。自动模式只是在此范围内自动生成**不同的子Approval**，不是把第1集的approvalId复用于第2集。每次 UI 显示已批准、已消耗、预留、待结算余额和本次动作范围。

单阶段重试/格式修复同样计费；默认自动修订最多1次，但预算不足就不修。用户再次手动要求重写是新operation与新报价，不被请求内容相同的去重逻辑吞掉。费用变化、模型/输入素材/用户规格变化、范围扩大/过期必须重新批准；同一批准范围内的后台派生输入以父snapshot和stage DAG绑定，其实际hash写入子操作，不需要每个chunk都弹卡。

当不能提前知道下一阶段精确prompt时，父批准绑定StagePlan的输入依赖hash/规则版本/模型/上限，子调用实际promptHash单独冻结且不得超范围。已报具体价格的媒体调用必须精确requestHash一致，不能借“动态prompt”改变素材或费用。

### 5.3 预留、发送、结算状态机

`estimated → reserved → dispatch_pending → submitted → settled`；分支为 `rejected/released`（确定未发）、`settlement_pending`（接单已知未结算）、`unknown`（发送/接单不确定）、`refund_pending/refunded`。失败不等于免费，取消不等于退款，返回token用量不是供应商真实金额时标estimatedActual。

预算检查与reserve、operation插入、outbox插入必须在一个数据库事务完成；并发两次生成不能都消费同一余额。worker只读取outbox，dispatchKey唯一。跨本地DB与供应商不存在天然原子事务：

- 支持幂等键：传同operationKey查询/重送，验证供应商语义；未验证不得宣称exactly-once。
- 返回providerTaskId：先查询其状态，不能重复创建任务。
- 请求已发但没拿到ID、供应商也无幂等/查询：标unknown保留最大预留；只能人工核对或供应商证明未接单后重试。网络异常不自动再次发出。
- 结算webhook/poll重复到达按provider ledger key幂等；金额对不上列差异，不随手修余额。

本地可保证命令与账本幂等，不承诺不支持幂等的远端服务“绝无重复扣费”。这是明确的能力限制与禁止盲重试路径。

## 6. API和事件：落实到代码的边界

沿现有 `/projects/{project}/director` 扩展，新合同置于`/v2`命名空间，旧路由保留。下表是领域接口族；精确路由/判别命令/字段以implementation-map.json的transports/commands/schemas及implementation-closure.md§3为准，不再从下面简写自行拼URL。下面类型为字段清单，实施P1需落Pydantic/OpenAPI并生成TS；所有时间ISO UTC，金额用整数最小单位+currency或十进制定点，不用浮点求账。

```ts
type CommandEnvelope<T> = {
  schemaVersion: 2; commandId: string; clientRequestId: string; projectId: string;
  workId?: string; sessionId: string;
  expected: { workRevision?: number; checkpointRevision?: number;
    documentVersions?: Record<string, number>; capabilityVersion?: string };
  payload: T;
};
type CommandResult<T> = {
  schemaVersion: 2; commandId: string; eventSeq: number; checkpointId?: string;
  runId?: string; result: T;
};
type DomainError = {
  code: string; retryable: boolean; recoveryAction: string;
  checkpointId?: string; affectedIds: string[];
  sideEffects: 'none' | 'known' | 'unknown'; costState: string;
};
```

| 接口/命令族 | 关键payload | 返回及领域用例 |
|---|---|---|
| POST sessions / messages；GET sessions/events | mode、richText、references、preset、clientMessageId / afterSeq | session/run/snapshot；message.send只入队一次 |
| POST works；GET work | specDraft、sourceVersionRefs | W/CP；source可读后事务初始化，重绑另走命令 |
| POST works/{id}/commands | type=continue/plan/generate/revise/change_spec/cancel/resume，目标episodeId及版本 | workflow.execute；状态表白名单，不接受模型随意指定目标state |
| POST checkpoints/{id}/decisions | questionVersion/toolCallId/decision/answers/explicitFinalization | question或outline/episode决策；返回next CP及有效DV |
| POST sources / audits | uploadId、fileHash、extractorVersion / coverageSnapshot | source/audit run；缺块或歧义明确返回 |
| POST quotes / approvals | stagePlanHash或mediaRequestHash、scope、expiry、limits | quote/approval；hash、预算与权限验证 |
| GET runs/{id}/events；POST runs/{id}/cancel | afterSeq / reason | durably stored event stream / cancel_requested |
| POST documents/{id}/drafts / change-sets | baseVersion、AST或selection、instruction、scope | Draft、ImpactPlan、CS；只在明确提交后产生正式DV |
| POST change-sets/{id}/decisions / commit | groupDecisions、所有baseVersions、semanticValidationHash | 原子版本集合、invalidatedIds或409 |
| POST episodes/{id}/finalizations | DV/contentHash/semanticHash/reportId/humanChecks | Finalization、next CP或Work.completed |
| GET/POST skills / versions / tests / publish | manifestHash/files、baseSV、fixtureIds、approvalId | draft/SV/TestRun/独立发布状态 |
| POST canvas/transactions / media/tasks | base node revisions、accepted candidate ids / frozenManifest、approvalId | canvas receipt / providerTaskId；画布写入和媒体执行分离 |
| POST shares / revoke；plugins/connect/disconnect | snapshot scope/readOnly/expiry / provider capability scope | revocable grant / connection；密钥字段永不返前端日志 |
| POST exports / imports | frozenVersionManifest、assetPolicy / packageHash | artifact或恢复报告；secret不默认打包 |

事件type枚举最低包含：message.accepted、run.queued/started/stage/progress/failed/cancel_requested/cancelled/status_unknown/finished、question.opened/answered/skipped、checkpoint.changed、document.draft_created/versioned/semantic_stale、changeset.created/decided/committed、review.completed/unavailable、episode.finalized/finalization_invalidated、work.completed/reopened、cost.reserved/submitted/settled/unknown、approval.requested/granted/denied/expired、canvas.committed、media.updated、skill.versioned/tested/published。每个schema必须有版本；未知type前端保留日志并提示刷新，不丢弃关键状态。

## 7. 重放、取消、并发与审计

1. SSE或WebSocket只是运输层；数据库事件是事实。重连发送lastSeq，服务端补缺；客户端对同seq去重、乱序缓冲、超时请求快照，不重新Send。
2. 幂等键绑定一次用户意图（commandId + actor + scope），相同键不同payload返回冲突；同payload新意图可新run。不能仅以prompt hash永远去重。
3. 工具参数分片按runId/toolCallId/seq组装，schema完成后才执行；晚到结果必须对应目标snapshot/DV，已取消/过期只入审计，不写正式稿。
4. 取消传播到未开始的子任务；正在调用的供应商按能力取消，未知状态保留账本。关闭面板、切换任务、浏览器断网不传播cancel。
5. 旧CP点击返回409及新CP摘要；重复批准/定稿返回原receipt。两设备同时编辑全baseVersions CAS，不“最后写入者赢”。
6. 原始请求与返回保存在受控项目运行记录，正文按用户资料权限保管；公开仓库只存匿名fixture和白名单摘要。记录模型实际路由、方法/规则版本、输入输出hash、错误体结构、token/费用、不确定性、截图索引。清除Cookie、Authorization、签名URL与第三方私有素材；日志有保留期及用户导出/删除策略，审计删除只保留不含内容的必要tombstone。

## 8. 代码落地顺序与明确禁令

先实现纯状态转移函数及表驱动测试，再repository事务、outbox/成本账本、schema/API、worker、前端投影。CP提交、CS提交、Finalization分别是独立用例，禁止把这些逻辑堆进FastAPI路由或聊天组件。后台服务不能从“模型说完成”解析出Work.completed。

禁止：文件存在即定稿；接受diff即同意生成；忽略即批准；评审skipped即PASS；失败即退款；刷新即重试；同一付款授权无限续写；固定网关显示别的模型；旧hash的报告覆盖新文稿。这九类都必须有自动负例，见[验收合同](acceptance-contracts.md)。

## 9. 对象字段及状态命名的唯一边界

- `ConfirmedSpec.totalEpisodes` 是确认后的整数；`episodeCountDraft` 只在未确认输入中容许auto。`defaultDurationSeconds` 与 `episodeDurations[episodeId]` 均为秒。旧API的episode_count/duration_seconds只由legacy adapter转换，不能进入新合同。
- `DocumentVersion.ast` 为正式AST字段，contentHash对应规范化AST；documentAST仅是旧设计别称，不是另一存储字段。前端、接口、导出schema由同一版本生成。
- `WorkflowCursor={phase,stage?,returnTo?,resumeToken,checkpointId,revision}` 承载EXEC/WAIT_*等用户流程；StageRun.status是单次阶段任务状态，Work.state是作品交付状态，三者不能共用枚举。FAILED_RECOVERABLE/CANCELLED/UNKNOWN是流程阶段；表中FAILED恢复指FAILED_RECOVERABLE。
- 单条 `ReviewCheck.verdict=PASS|FAIL|UNKNOWN`；汇总 `QualityReport.status=PASS|FAIL|UNAVAILABLE`。证据/DV不匹配为DomainError MISMATCH并使报告UNAVAILABLE；有效硬FAIL优先为FAIL，关键UNKNOWN/缺评审为UNAVAILABLE，只有全部必需检查可判定且通过才PASS。
- `SkillRunReceipt={runId,skillId,revisionId,methodHash,origin,inputSnapshotHash,modelBinding,toolReceipts,outputHash,status}` 由宿主记录，origin为system/private/imported/forked。模型不能回填或自报revision；请求版本与加载hash不一致在模型调用前失败。
- `MediaAttempt={operationId,requestHash,requested,providerEcho,observed,providerTaskId,status,costEntryId}` 独立于Work。observed含容器探测时长、像素尺寸、音轨及probeVersion；缺数据null，不用requested填observed。

## 10. 发布、授权及媒体恢复合同

### 10.1 分享与Skill发布

`ShareSnapshot={id,kind,sourceVersionRefs,publicFields,manifestHash,grantVersion,expiresAt,status}` 是冻结白名单快照；只读、不跟随未来私有编辑。默认排除原始请求、token、模型密钥、私有源文、未选附件、内部工具日志；私有素材必须复制为明确授权的公开资产投影或拒绝发布，不能泄露原签名地址。

create经preview+显式confirm；revoke写grantVersion并让缓存失效。服务端与CDN读取均校验有效grant；测试撤销前后匿名访问，已下载的合法副本无法回收。公开错误统一不泄露资源存在性。第三方HTTP 200/code10051/data=null映射RESOURCE_GONE，不因HTTP 200判成功；我方错误返回明确404/410领域码。

PrivateSkill与PublicSnapshot分别存储。publish冻结已选revision；withdraw只撤公开、不删私有；archive/restore只改私有可发现/可执行性，不回收既有公开快照，UI明示并可另撤；deletePrivate不可恢复、同事务撤销关联公开grant并保留非内容tombstone。删除后旧run凭证可读但不能再执行；详情公开404/410。流程中引用该Skill的未派发run阻断并要求重选，已派发任务按已冻结输入完成但不扩大权限。不能用删除实验推断源站独立撤回已存在。

### 10.2 Plugin/OAuth

连接存 `connectionId/provider/subjectHash/scopes/grantedAt/expiresAt/tokenRef/status`；token只存服务端凭据库。每tool调用校验scope、目标项目、授权期限；refresh加单飞锁，失败变reauth_required，不重放有副作用调用。disconnect先关本地新调用，再尝试远端revoke；撤销失败显示local_disabled/revoke_pending，不能假称远端已吊销。401/403/自然过期/断连分态；缺原生CLI只影响该适配器，不隐藏HTTP连接状态。浏览器OAuth callback校验state/PKCE/redirect白名单，最小scope；不在新产品依赖LibTV专用OAuth服务。

### 10.3 已受理与未知提交

`approved → dispatching → accepted → polling → succeeded|failed|cancelled` 是媒体生命周期；dispatching超时且接单未知→unknown。只要已有providerTaskId，恢复只能GET/poll原ID，不POST create；没有ID且供应商没有已验证的幂等/查询机制，保留预留等待核对。provider任务成功后下载/探测/入库失败为ingestion_failed，重试入库而非重生成。cancelled/failed保留实际或未知费用，不能一概退款。F19与F30分别测试“响应丢失”和“已受理后断网”，两者不混。

精确命令、接口模板和输入/输出类型ID登记在[机器追踪表](implementation-map.json)；API共享端点用判别联合type区分各命令，每条独立校验，不接受任意方法名或模型指定目标状态。
