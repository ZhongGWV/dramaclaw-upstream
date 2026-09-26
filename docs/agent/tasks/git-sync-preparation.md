# 当前跟踪远端同步与提交准备

**状态**：执行中
**最后更新**：2026-09-26
**基线**：`e7b1fbce7ee814fb3fd7343b74f68d331f24ec70`；main跟踪zhonggwv/main，fetch后ahead 0/behind 0；14已跟踪改动、215未跟踪文件，暂存区为空
**认领者**：`codex/git-commit-20260926`
**相关文档**：`docs/agent/README.md`、两条Director工作线台账
**相关分支 / PR**：无

## 目标

按用户先pull/准备、随后明确“提交”的授权，将已核验候选按工作线创建本地DCO提交，保留未完成验收与素材许可说明。不push，不把未完成质量验收写成完成。前轮“仅准备”的边界已由本轮明确提交指令扩展。

## 非目标

- 不合并origin上游，不切换主检出分支，不自动stash/reset/rebase，不改业务代码。
- 不提交运行态、Cookie、模型凭据、原稿、付费回包；不移动或删除受保护旧文件。
- 不解决本轮发现的无关存量功能问题，也不修改第三方素材许可状态。

## 现状与证据

- 已读STATE、README、模板、Git状态及legacy保护规则；guard为18线459claims，无活动锁。
- fetch zhonggwv main成功；HEAD与最新跟踪引用相同。当前默认远端为zhonggwv，不是origin。
- 工作区新域/API/UI/测试/共享配置增量属于Director实现线，研究文档属于discovery；local-stack台账明确将回环HTTP默认修复交由实现线集成。
- `_to_delete/`与原始故事稿仍是受保护未跟踪资料。既有ignore覆盖Cookie、output与本地配置，需在最终候选再核验。
- 本轮只改三份协调文档；STATE现有diff已读，原Director记录保留。远端没有新commit，业务重叠为空；origin仅保留既有审计事实，不混入拉取。

## 写入边界

| 路径 | 模式 | 作用 |
|---|---|---|
| `docs/agent/STATE.md` | 共享 | 同步与准备状态 |
| `docs/agent/tasks/git-sync-preparation.md` | 独占 | 本轮方案/候选清单/验证/交接 |
| `docs/agent/claims/git-sync-preparation.toml` | 独占 | 协调路径范围 |
| `docs/guides/tv-director/ui-parity.md` | 共享 | 仅修提交钩子发现的第三方依赖描述禁用词；与Director实现线串行 |
| Director实现线台账/claim | 共享 | 协调该单行文档修正及同类台账表述 |

前三项及实现线台账/claim为coordination；ui-parity只允许上述单行文档修正，所有业务源码只读。忽略output内生成备份、候选路径清单及检查日志，不含凭据，不能提交。本轮按明确授权将既有NUL候选清单分组加入正常索引并commit，不改业务内容；不纳入清单外文件。结束归档增加精确`docs/agent/archive/git-sync-preparation.md`，移除本线活动claim及索引行，并撤回临时ui-parity共享。

## 协调与冲突

- 两条Director与local-stack已有改动只读取证、分组，不重认领或改其业务。
- 单写者锁由本线持有；不触碰其他已登记worktree。
- 若fetch/pull出现新远端提交或分叉，停止主检出合并，记录重叠后请求明确集成选择；不以准备提交推定允许提交/推送。

## 实施方案

### 2026-09-26 · 用户授权实际提交

恢复检查：main/e7b1fbce；19线465claims无锁；228候选逐文件SHA-256全部一致、无新增未归属路径，真实索引空，跟踪远端仍0/0。读取STATE、本台账、claims及拟改协调文件diff；不重复pull，不动origin。Git hooks目录只有sample，没有已安装pre-commit或自定义hooksPath，因此每组先手工运行实际仓库`pre-commit run --all-files`、staged diff检查再`git commit -s`；不安装会自动stash的默认hook，不使用--no-verify或跳过检查。

顺序：①7份协调台账/claim/STATE建立依赖（本地进度锚点，不声称功能完成）；②2份discovery取证报告；③219份实现/测试/接口/共享配置/设计合同；每组精确pathspec，不跨线混成单提交，原业务文件与冻结hash相同；④更新真实提交hash/STATE、DCO范围验证，完成本次提交任务的协调收尾归档。前三组后可追加仅交接文档提交，不把代码重复提交。锁内正常commit仅HEAD快进，收尾写协调文件前先handoff/release，更新本线baseline后重新acquire/preflight。

验收沿用前轮已对同字节业务候选运行的471后端/78前端/build，不为无业务变化重复购买模型或声称新质量结果。最终检查`e7b1fbce..HEAD`的DCO、gitleaks、guard/完整pre-commit、工作区只余3份受保护原稿/旧文件，所有本轮业务/文档均已提交。公开push未授权且第三方素材再分发待确认，不能自动推送。

提交钩子分叉（实际候选索引触发，非业务故障）：普通未暂存lint未覆盖未跟踪报告；完整pre-commit抓到ui-parity:11与实现台账:124的第三方依赖描述禁用词。分别改为“第三方富文本依赖”和“Tiptap 3公开发行包”，不豁免规则、不改变项目许可证。ui-parity与实现线scope改双向shared，preflight后修两处，重跑实际候选pre-commit；备份对照显式允许这两份文档及协调文件，代码字节必须不变。

1. 用git列出的修改及未跟踪文件生成忽略目录下本地tar备份与binary diff，核验文件数/hash；不备份或输出ignore凭据。
2. 创建独立临时detached worktree（不带脏文件），明确pull --ff-only --no-rebase zhonggwv main；HEAD相等则主检出不需要更新；有新变化按协调规则停下。
3. 分研究与实现候选，排除受保护资料和运行态；使用独立索引暂存并检查diff、逐文件许可/敏感信息及遗漏，不改用户index，不commit/push。
4. 跑本轮相关后端/前端、ruff、i18n、CE闭合、构建及gitleaks；全量/其他门未测明确写出，不声称全部CI绿。
5. 保存候选清单与实际阻塞，更新STATE，handoff/release。删除仅本轮创建的干净临时worktree；保留备份与检查记录。

## 风险与回退

- 隔离pull避免影响200余文件脏现场；若远端恰在fetch后推进，临时检出保留供审计，主检出不自动改。
- 候选索引不改变正常index，可直接不采用；tar/binary diff提供恢复锚点，不用反向应用清理现场。
- 第三方参考图形许可尚未核验，是否公开发布作为独立待办，不用无泄漏代替许可验收。

## 验收标准

- [x] pull输出及前后HEAD/跟踪远端一致性记录。
- [x] 备份可读、候选manifest与受保护资料排除可核对。
- [x] 相关测试/扫描结果如实记录；候选与真实index分开。
- [x] 无业务源码变化、无commit/push；收尾按handoff/release执行。
- [ ] 用户核阅候选及公开发布素材处理方式；本轮不代替最终提交/发布批准。

## 进展记录

### 2026-09-26 · 明确提交授权与冻结候选复核

用户已明确要求提交，范围为前轮准备的三组候选及必要交接文档，只创建本地commit、不push。228份原候选指纹全一致、无新未分类文件、主索引空；已更新计划与owner，未改业务代码。提交结果及哈希在执行完成后补记；既有文学/全工作流/素材许可缺口保留。

已取得本轮唯一锁，协调三路径preflight通过（19线466claims）；开始按冻结路径清单正常暂存，每组先检查实际索引及运行完整钩子，不使用前轮候选索引直接一把提交。

### 2026-09-26 · 已pull最新，228文件候选与提交钩子准备完成

同步：fetch默认zhonggwv/main后，在本轮新建的干净detached临时worktree执行`git pull --ff-only --no-rebase zhonggwv main`，返回Already up to date。主检出与远端仍同为e7b1fbce，ahead0/behind0；没有合并origin、stash/rebase、切换或清理主目录。临时检出无改动后正常worktree remove，仅移除可由同一提交重建的测试副本，其他worktree不动。

安全备份：忽略目录`output/git-sync-prep-20260926.Ed1Hr9/`的`uncommitted-files.tar.gz`含231条逻辑文件（包括三份受保护资料），约5.8MiB，SHA-256 `92bc6ff1ccab9b282cdcffbb3bc22647cf8947117a11e4d0c4b134716ec93f9a`；另有working-tree.patch。归档存在性/内容核对通过，macOS附加元数据使tarfile看到460成员，不把它误报为460份业务文件。备份不含ignored凭据/运行数据，也不入提交。

候选：`candidate-manifest.json`按每文件SHA-256/字节数冻结，NUL路径清单为coordination.paths（7）、research.paths（2）、implementation.paths（219），合计228文件。candidate.index为独立索引，正常用户索引仍为空；全部业务源码逐字比对备份未改变。排除`_to_delete/`两文件及原始故事稿三份；ignore的Cookie、本地配置、生成媒体/付费证据不纳入。第三方35张参考图片与SVG随实现列为**仅本地审查候选**，现有reference-assets许可警示保留，尚不能据此批准公开发布。

验证：`.venv/bin/python -m pytest tests/director tests/test_tv_director.py tests/test_newapi_text_gateway.py -q` **471 passed/10弃用告警**；4个Director/翻译前端文件 **78 passed**；`pnpm build`通过，现有大chunk告警。全仓ruff、前后i18n（0/475）、11CE端口、EE词/CE导入/违禁词检查通过。独立候选`gitleaks git --pre-commit --staged --redact`无发现；实际`GIT_INDEX_FILE=... pre-commit run --all-files`的gitleaks、guard、banned-words最终全通过。首次钩子发现两处未跟踪文档用词，已双向共享/preflight后仅修对应两处，无规则豁免；普通lint之前未覆盖它们，所以不隐去首次失败。verify-spec仅规格PASS（149动作/24方法/33转移，productTestsExecuted=0），不当功能验收。

本轮没有真实模型调用、没有commit/push、没有重验全部前后端/Windows/浏览器/文学质量；保留已知全量前端历史失败和文学漏判，不把准备成功等同完整产品通过。后续提交必须带DCO Signed-off-by，并在每个实际提交边界重新核验guard/钩子及路径闭合。

### 2026-09-26 · 只读恢复与远端确认

已完成STATE/Git/guard恢复，fetch默认zhonggwv/main成功且0/0；未在脏检出pull。创建协调计划，以独立干净检出验证用户要求，独立索引准备候选。未改业务、未提交推送。后续备份与验证待执行。

## 已定下来的决策

- 使用main实际跟踪的zhonggwv/main；origin不在本次同步范围。
- “准备提交”不等于实际commit/push；保持用户暂存区为空，提供可审查候选索引。

## 待办

- [x] 备份、隔离pull、独立候选索引、相关测试与提交钩子完成。
- [ ] 用户要求实际提交后，先复核candidate-manifest文件hash与HEAD/远端；按协调依赖→研究报告→实现代码三组拆分提交，使用`git commit -s`，每步通过guard/钩子，不直接提交当前独立索引的全部228文件为一个跨线commit。
- [ ] 公开推送前取得参考素材可再分发依据或另开替换方案；不擅自删图破坏已有界面，也不把用户请求等同第三方许可。

## 阻塞

提交准备无技术阻塞，实际提交/推送未执行。第三方素材发布许可与文学质量失败是既有发布/产品验收缺口，不作为代码已完成的承诺；两处文档提交钩子问题已修复。

## 交接摘要

- **最后完成到**：隔离pull最新，备份可恢复；228文件三组候选，471后端/78前端/build/提交钩子通过；源码未改，正常暂存区空，未提交推送。
- **下一步唯一动作**：收到实际提交指令后，复核候选hash与远端，先处理协调文档依赖组，再研究/实现分别提交并保留未完成标记；公开发布前单独解决素材许可，不能直接push。
- **先读这些文件**：本台账、STATE、Director两线台账的写入边界及最新进展。
- **不要动这些文件 / 决策**：业务源码、现有暂存区、受保护原稿/旧文件、凭据与用户数据。
