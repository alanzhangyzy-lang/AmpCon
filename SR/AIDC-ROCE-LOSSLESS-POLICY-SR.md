# RoCE Lossless Policy Studio 软件需求规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-ROCE-FORM-001 |
| Studio 名称 | RoCE Lossless Policy |
| 版本 | v2.0 |
| 日期 | 2026-09-16 |
| 状态 | Draft |
| 适用产品 | AmpCon-DC AIDC Network |

## 目录

1. 背景与产品目标
2. SR 清单
   - 2.1 SR 表单拆解
   - 2.2 依赖与前置条件
   - 2.3 功能限制条件
3. 信息架构与页面流程
4. 功能需求详述
   - 4.1 Policy & CNP
   - 4.2 Queue Configuration
   - 4.3 Device & Interface
   - 4.4 Switch Templates
   - 4.5 Studio 公共表单
5. 功能评审（Review）

> 本 SR 定义 `RoCE Lossless Policy` 的产品目标态，只拆解 Studio 表单及其平台协作边界，不包含验收标准和测试场景矩阵。

## 1. 背景与产品目标

### 1.1 背景

AIDC RoCEv2 网络必须协同配置流量分类、队列调度、ECN/WRED 与 PFC。统一的结构化入口应避免分类与 Queue 映射不一致、批量接口结果不一致、设备能力被忽略、模板引用悬空，以及把 Workspace 保存误认为设备已生效。

`RoCE Lossless Policy` 是 AmpCon 提供的产品扩展，不得宣称为 Arista CloudVision 内置 Studio。它负责收集交换机侧结构化输入，不负责 GPU/NIC OS、DCQCN 主机参数、Inventory 事实、Workspace 生命周期或直接执行设备配置。

### 1.2 产品目标

1. 统一表达 CNP、RoCE Queue、接口 RoCE/PFC 和 Spine/Leaf 模板。
2. 对 DSCP/802.1q 联动、跨字段关系、Queue 引用、设备能力和跨源 ownership 冲突提供可定位校验。
3. 支持单设备、多设备和逐接口配置，并明确单行编辑与批量覆盖语义。
4. Studio 必须将结构化输入保存为 Workspace 候选变更；Save 不得表示 Build、提交或设备执行。
5. Build 必须权威校验输入、目标设备能力、ownership 和跨配置源冲突；Review/Submit 必须固定被审阅的 revision。
6. Change Control 必须负责审批、排期和执行；Running/Compliance 必须基于设备回采，不得由保存或提交状态推断。
7. Intent Center 只表达业务意图并调用 Studio，不拥有设备配置，也不得复制 Workspace、Tasks 或 Change Control。
8. Templates & CLI 是独立高级配置源，其变更必须汇入共同的 Workspace、Build、Review/Submit 与 Change Control 生命周期。
## 2. SR 清单

### 2.1 SR 表单拆解

| SR 编号 | 一级功能 | 二级功能 | 主要表单/操作 |
|---|---|---|---|
| SR-RLP-001 | Policy & CNP | Basic Configuration | Policy Name、Fabric |
| SR-RLP-002 | Policy & CNP | Congestion Notification | Trust Mode、CNP Value、CNP Queue ID |
| SR-RLP-003 | Queue Configuration | RoCE Queue | Create、Edit、Delete、调度参数 |
| SR-RLP-004 | Device & Interface | Assignment Management | Select Devices、Edit、Bulk Edit/Delete |
| SR-RLP-005 | Device & Interface | Device Selection | Role Filter、Search、Select All |
| SR-RLP-006 | Device & Interface | Interface Selection | Bulk RoCE/PFC、逐接口状态 |
| SR-RLP-007 | Switch Templates | Global Interface | PFC Watchdog、Deadlock 参数 |
| SR-RLP-008 | Switch Templates | PFC Configuration | Queue Buffer 参数 |
| SR-RLP-009 | Switch Templates | WRED Configuration | Threshold、Drop Probability、ECN |
| SR-RLP-010 | Studio 公共表单 | Workspace Context | Workspace、Review、Save、Previous/Next/Apply |

### 2.2 依赖与前置条件

| 依赖项 | 前置条件与职责 |
|---|---|
| Workspace | 必须提供可读/可写状态、baseline、Studio overlay、revision/ETag、审计与 Build 状态。所有写操作必须绑定可写 Workspace。 |
| Fabric | 必须提供稳定 Fabric ID 及候选设备范围；Fabric 切换必须重新解析 Assignment。 |
| Inventory | 必须拥有 canonical device/interface ID、设备角色、型号、接口事实与管理状态。 |
| Device Capability | 必须按设备、接口、ASIC/平台与软件版本提供 Queue、调度、PFC、WRED、Buffer/Threshold 单位及范围。 |
| RBAC | 必须区分读取、编辑、保存、Build、Review/Submit、Change Control 审批与执行权限；服务端必须再次鉴权。 |
| Telemetry | 必须为 Running/Compliance 提供设备回采证据。 |

### 2.3 功能限制条件

| 规则 | 说明 |
|---|---|
| Workspace 前置条件 | 必须选择可写 Workspace 才能创建、编辑、删除或保存 Studio 输入；不得直接在 Mainline、Designed 或设备 Running 配置上修改。 |
| Fabric 与 Inventory 范围 | Policy 目标 Fabric、Spine、Leaf、角色和接口必须来自固定的 Fabric/Inventory snapshot；Studio 不得手工伪造设备、接口或拓扑事实。 |
| Policy 作用范围 | 单个 Policy 必须绑定一个 Fabric，且只能选择一种 Trust Mode：DSCP 或 802.1q；Fabric 或 Trust Mode 变化必须重新评估所有引用和分配。 |
| CNP 分类范围 | DSCP CNP 值必须为 0–63；802.1q CNP 值必须为 0–7；802.1q 下 CNP Queue 必须由 CNP Value 确定性派生。 |
| Queue 最小数量与唯一性 | 有效 Policy 至少包含一条有效业务 Queue；Queue ID 必须策略内唯一；业务 DSCP/802.1q 分类值不得跨 Queue 重叠。 |
| Queue 引用完整性 | PFC/WRED 只能引用当前 Policy 中存在且有效的业务 Queue；被引用 Queue 必须先解除所有引用后才能删除。 |
| 调度与单位 | WRR/WFQ 的 Weight 仅适用于对应模式；Guaranteed Rate 仅适用于 WFQ。Weight、Guaranteed Rate、Buffer 和 Threshold 的单位、范围和步长必须由目标设备能力模型明确提供。 |
| 接口 PFC 依赖 | PFC 必须依赖同一接口的 RoCE Enabled；关闭 RoCE 必须同步关闭 PFC，任何 PFC Enabled/RoCE Disabled 组合均不得保存。 |
| 多设备接口范围 | 多设备 Assignment 只能选择所有目标设备共同存在、共同可写且共同支持的 canonical interface；不得仅依据第一台设备的接口名称直接应用。 |
| Assignment 编辑范围 | 单行 Edit 不得隐式改变设备集合；Bulk Edit 必须显示 Mixed 值、受影响设备/接口和覆盖确认；删除必须进行影响确认。 |
| 模板角色范围 | Switch Templates 仅适用于 Spine 和 Leaf；模板参数必须按目标角色设备的能力交集校验。没有共同能力时必须拆分作用范围或阻止保存。 |
| 模板 Queue 唯一性 | 同一角色内 PFC 与 WRED 的 Queue 引用必须分别唯一；PFC/WRED 不能引用不存在、不支持或已删除的业务 Queue。 |
| 设备能力与配置源冲突 | 表单范围不代表设备实际支持范围。Build 必须复核 ASIC、型号、软件版本、接口能力、Queue/Buffer/WRED 支持，以及与其他 Studio、Intent Center、Templates & CLI 的 ownership 冲突。 |
| 生命周期限制 | Save/Apply 只保存 Workspace candidate；Build 生成候选配置；Review/Submit 固定 revision；只有 Change Control 执行并完成设备回采后，才可显示已部署、Running 更新或 Compliant。 |
| Tasks 对象边界 | AmpCon Tasks 如存在，只能映射 Workspace revision 或 Change Control 执行对象；不得宣称每个 Studio 变更必然生成 Arista Classic Task。 |

## 3. 信息架构与页面流程

### 3.1 页面结构

```text
RoCE Lossless Policy
├─ Policy & CNP（含 RoCE Queue Configuration）
├─ Device & Interface
└─ Switch Templates
   ├─ Spine：Global / PFC / WRED
   └─ Leaf：Global / PFC / WRED
```

页面包含 3 个可见导航页，并按职责拆分为 5 个功能模块：Policy & CNP、Queue Configuration、Device & Interface、Switch Templates、Studio 公共表单。Workspace、Review Workspace、Save to Workspace 与末页 Apply 属于公共区域。

### 3.2 标准操作流程

```text
选择可写 Workspace → 加载 baseline 与 Studio overlay
→ 编辑 Policy、Queue、Assignment 与 Template → Save/Apply 保存候选 revision
→ Build 权威校验输入、能力、ownership 与跨源冲突
→ Review 固定 revision → Submit Workspace
→ Change Control 审批、排期与执行
→ 设备回采 → Running / Compliance
```

### 3.3 页面与生命周期边界

| 阶段/对象 | 职责与证据边界 |
|---|---|
| Studio Editing | Studio 收集和预校验结构化输入，不连接设备，也不拥有设备事实。 |
| Workspace Save | Save 与末页 Apply 必须调用同一原子保存契约，持久化 candidate revision 并返回 revision/ETag 与审计信息；保存不表示设备生效。 |
| Workspace Build | Build 必须生成候选配置，并对输入、设备能力、ownership、引用及跨 Studio、Intent Center、Templates & CLI 来源冲突进行权威校验。 |
| Review/Submit | Review 必须绑定不可变 revision；Submit 必须提交该 revision。若 revision 已变化，必须重新 Review。 |
| Tasks / Change Control | Change Control 负责审批、排期、执行、日志与恢复。AmpCon Tasks 如存在，只能作为平台执行对象的映射，不得声称每个 Studio 变更必然生成 Classic Task。 |
| Running / Compliance | 必须以设备回采和平台计算为证据；无回采不得显示已部署、合规或已回滚。 |

生命周期语义参考 Arista 官方 [Workflow Overview](https://www.arista.com/zh/cg-cv/cv-workflow-overview) 与 [Getting Started with Studios](https://www.arista.com/en/cg-cv/cv-getting-started-with-studios)。本 SR 对官方资料进行了概括，且明确本 Studio 为 AmpCon 扩展。

## 4. 功能需求详述

### 4.1 Policy & CNP

#### 4.1.1 功能说明

配置策略名称、目标 Fabric、Trust Mode 与 CNP 分类。业务 Queue 由 4.2 定义。

#### 4.1.2 产品设计及流程说明

Policy & CNP 必须先确定策略身份和设备作用范围，再确定分类模式。Fabric 与 Trust Mode 变化可能使 Assignment、Service Values 或 Queue 引用失效，因此系统必须提供确定性迁移、影响预览和阻断校验，不得静默保留无效数据。

#### 4.1.3 功能业务流程

```text
选择 Workspace → 输入 Policy Name → 选择 Fabric
→ 选择 Trust Mode → 预览并确认迁移 → 配置 CNP Value/Queue
→ 进入 Queue Configuration
```

#### 4.1.4 原型界面与交互说明

##### 4.1.4.1 交互说明（SR-RLP-001～SR-RLP-002）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Policy Name | 维护策略显示名称。 | 输入或修改文本。 | 实时显示 Local Dirty；字段错误就地展示。 | Trim 后为空或超过服务端长度限制时必须阻止保存并聚焦字段；保存失败必须保留输入。 | 名称只属于当前 Studio overlay，不得作为设备或 Fabric 标识。 |
| Fabric | 选择策略的设备作用范围。 | 选择 Fabric；确认切换影响。 | 显示受影响 Assignment 数量、可迁移数量和失效数量。 | 切换时必须清理旧 Assignment，或显式标记为失效并阻止保存；用户取消确认时必须保持原 Fabric 与 Assignment。 | Fabric 与设备事实由 Fabric/Inventory 拥有；上游固定 Fabric 时字段必须只读。 |
| Trust Mode | 选择 DSCP 或 802.1q 分类方式。 | 切换模式并确认迁移方案。 | 显示 CNP、Service Values 与 Queue 引用的迁移预览。 | 必须采用确定性映射；无法无损映射的值必须要求用户修正或明确删除。切换完成后不得留下越界 Service Values 或空 Queue 引用。 | 模式适用于整个策略；是否受目标设备支持必须由能力模型预检并由 Build 复核。 |
| CNP Value | 指定 CNP 报文分类值。 | 输入整数。 | 显示模式对应范围与即时错误。 | 空值、非整数、越界或与业务 DSCP 规则冲突时必须阻止保存并列出冲突 Queue。 | DSCP 为 0–63；802.1q 为 0–7；设备特定限制由 Build 权威判定。 |
| CNP Queue ID | 指定 CNP 出口 Queue。 | DSCP 下选择；802.1q 下查看派生值。 | 显示引用状态和设备支持情况。 | Queue 不存在、不受任一目标设备支持或映射后为空时必须阻止保存；错误必须定位到设备和 Queue。 | DSCP 下允许编辑；802.1q 下必须由 CNP Value 确定性派生且不得独立编辑。 |
| Form Validation | 汇总本模块字段、迁移和引用校验。 | 查看错误并点击定位。 | 按字段、对象和严重级别展示错误/警告。 | 阻断错误必须禁止 Save/Apply；服务端返回的新错误必须合并展示且保留草稿。 | 前端校验只用于即时反馈，Build 仍是能力、ownership 和跨源冲突的权威校验。 |

##### 4.1.4.2 参数说明（SR-RLP-001～SR-RLP-002）

| 区域 | 字段/API 字段名 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Basic | Policy Name / `policyName` | 用户可读名称；来源为用户输入；规范值为 Trim 后文本。 |
| Basic | Fabric / `fabricId` | Fabric 稳定标识；来源为 Fabric 服务或上游上下文。 |
| CNP | Trust Mode / `trustMode` | 分类依据；枚举 `dscp`、`dot1p`。 |
| CNP | CNP Value / `cnpValue` | CNP 分类整数；DSCP 单位为 code point 0–63，802.1q 单位为 priority 0–7。 |
| CNP | CNP Queue ID / `cnpQueueId` | CNP 出口 Queue ID；DSCP 来源为用户选择，802.1q 来源为 `cnpValue` 的平台映射。 |
| Derived | Effective Scope / `effectiveDeviceIds` | `fabricId` 与 Inventory 可用设备集合的交集，元素为 canonical device ID。 |
| Derived | Local Dirty / `localDirty` | 当前编辑值相对最近服务端保存 revision 的差异布尔值。 |

#### 4.1.5 列表字段

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 不适用 | 不适用 | 本模块为表单，无独立数据列表。 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 |

#### 4.1.6 权限控制要求

用户必须具备 Workspace 读取权限才能查看数据，具备 Workspace 写权限及 Fabric/设备对象访问权限才能修改。无可写 Workspace 时，本模块所有写操作必须禁用并显示原因；服务端必须对保存再次鉴权。

#### 4.1.7 非功能需求

Trust Mode 与 Fabric 影响分析应在 300ms 内给出本地结果；远端能力校验应显示进行中状态。错误必须使用文字并关联字段，控件必须支持键盘访问和辅助技术。
### 4.2 Queue Configuration

#### 4.2.1 功能说明

创建、编辑和删除业务 Queue 分类，并配置 WRR、SP 或 WFQ 调度参数。

#### 4.2.2 产品设计及流程说明

每个策略必须至少包含一条有效业务 Queue。DSCP 业务值在策略范围内必须跨 Queue 唯一；Queue ID 必须唯一。PFC/WRED 通过稳定 Queue 引用关联业务 Queue，删除操作必须先完成引用影响检查。

#### 4.2.3 功能业务流程

```text
读取 Trust Mode 与能力模型 → Create/Edit Queue
→ 配置 Service Values 与 Scheduling → 校验跨 Queue 唯一性
→ Apply 到策略草稿 → 引用检查后 Delete
```

#### 4.2.4 原型界面与交互说明

##### 4.2.4.1 交互说明（SR-RLP-003）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Create Queue | 新建业务 Queue。 | 点击并填写弹窗。 | 打开空白或能力建议值表单，不得创建未经确认的隐式行。 | 无可写 Workspace 或能力数据不可用时必须禁用并解释；重复或非法值必须就地报错。 | 策略保存时必须至少有一条有效业务 Queue；Queue 只定义候选意图，不创建 Running 配置。 |
| Edit Queue | 修改现有 Queue。 | 点击并编辑字段。 | 回填完整字段和 PFC/WRED 引用数量。 | 修改 Queue ID 或分类值导致引用/唯一性冲突时必须阻止应用并列出冲突。 | 编辑必须保持稳定 Queue 对象 ID；不得用数组位置作为引用。 |
| Delete Queue | 删除业务 Queue。 | 点击、查看影响并确认。 | 展示 PFC/WRED 引用、受影响角色和设备。 | 被 PFC/WRED 引用时必须阻止删除并列出全部引用；删除后少于一条有效业务 Queue 时必须阻止。失败时必须恢复原行。 | 所有删除都必须进行影响确认；不得级联静默删除模板引用。 |
| RoCE Queue | 选择业务流量 Queue ID。 | 选择能力模型允许的值。 | 显示通用 ID 和目标设备支持状态。 | 为空、重复或任一目标设备不支持时必须阻止应用；错误必须列出设备差异。 | DSCP 与 802.1q 均必须形成非空有效 Queue 引用；可选值取目标设备能力交集。 |
| Service Packet Values | 维护业务分类值集合。 | 输入、选择或移除值。 | 规范化排序并显示跨 Queue 占用情况。 | 空值、格式错误、越界、单行重复或跨 Queue 重叠时必须阻止应用并列出占用 Queue。 | DSCP 值在整个策略内必须唯一；802.1q 值也不得被多个业务 Queue 重复占用。 |
| Scheduling Mode | 选择 WRR、SP 或 WFQ。 | 切换模式并确认字段迁移。 | 仅显示适用字段，提示将清除的不适用值。 | 目标设备不支持模式时必须阻止应用；切换不得遗留不适用 Weight 或 Guaranteed Rate。 | 能力交集决定可选模式；Build 必须按设备复核。 |
| Weight | 配置 WRR/WFQ 相对权重。 | 输入整数。 | 显示能力范围。 | 空值、非整数或超出设备能力交集时必须阻止应用。 | 仅 WRR/WFQ 适用；单位为无量纲权重。 |
| Guaranteed Rate | 配置 WFQ 保证速率。 | 输入数值。 | 单位、最小值、最大值和步长必须由能力模型明确展示。 | 单位未知、值不满足范围/步长或任一目标设备不支持时必须阻止应用。 | 仅 WFQ 适用；不得使用未标注单位的裸数值。 |
| Dialog Close / Cancel | 关闭 Queue 编辑弹窗。 | 点击 X、Cancel、Esc 或 backdrop。 | 无修改时直接关闭；有修改时显示放弃确认。 | 用户取消放弃时必须保留弹窗数据与焦点；关闭失败不得写入主草稿。 | 所有关闭入口必须采用一致的脏数据判断。 |
| Apply Queue | 将弹窗内容写入策略草稿。 | 点击 Apply。 | 校验通过后新增或更新行，并更新 Local Dirty。 | 任何字段、唯一性、引用或能力预检错误都必须阻止关闭；服务端错误必须可定位。 | 仅更新当前 Workspace 草稿，不表示已保存、Built 或设备生效。 |
| Capability Validation | 汇总 Queue 与调度能力。 | 查看设备差异或按能力分组。 | 展示能力交集、差异设备、单位和范围。 | 能力数据缺失或过期时必须标记未验证并阻止保存；Build 失败必须回链到 Queue。 | 前端能力交集不得替代 Build；跨源 Queue ownership 冲突由 Build 权威判断。 |

##### 4.2.4.2 参数说明（SR-RLP-003）

| 区域 | 字段/API 字段名 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Identity | Queue Object ID / `queueId` | Workspace 内稳定对象标识；由服务端生成，用于模板引用。 |
| Identity | RoCE Queue / `roceQueue` | 业务出口 Queue 数字 ID；来源为用户从能力交集中选择。 |
| Classification | Service Packet Values / `serviceValues` | 分类整数集合；DSCP 为 0–63，802.1q 为 0–7；来源为用户输入并规范化去重排序。 |
| Scheduling | Scheduling Mode / `schedulingMode` | 枚举 `wrr`、`sp`、`wfq`；来源为用户选择。 |
| Scheduling | Weight / `weight` | WRR/WFQ 无量纲相对权重；范围来源于能力模型。 |
| Scheduling | Guaranteed Rate / `guaranteedRate` | WFQ 保证速率；数值与单位共同存储，单位、范围和步长来源于能力模型。 |
| Derived | Applicable Trust Mode / `trustMode` | 继承 Policy `trustMode`，决定 `serviceValues` 的解释。 |
| Derived | Reference Count / `referenceCount` | PFC 与 WRED 中引用该 `queueId` 的总数；由服务端引用图派生。 |

#### 4.2.5 列表字段

##### RoCE Queue Table

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | RoCE Queue / `roceQueue` | 显示 Queue ID；无有效值显示 Invalid badge。 | 始终显示 | 否 | 支持 | 左对齐 | `roceQueue` 升序 |
| 2 | Service Packet Values / `serviceValues` | 按 Trust Mode 显示规范化 DSCP/802.1q 集合。 | 始终显示 | 否 | 不支持 | 左对齐 | 不适用 |
| 3 | Scheduling Mode / `schedulingMode` | 显示 WRR、SP 或 WFQ Badge。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 4 | Weight / `weight` | SP 显示 `—`，WRR/WFQ 显示权重。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 5 | Guaranteed Rate / `guaranteedRate` | WFQ 显示数值和能力模型单位，其他模式显示 `—`。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 6 | References / `referenceCount` | 显示 PFC/WRED 引用总数并可打开引用详情。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 7 | Validation / `validationState` | 显示 Valid、Warning 或 Invalid。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Operation / derived | Edit、Delete。 | 始终显示 | 是 | 不支持 | 右对齐 | 不适用 |

#### 4.2.6 权限控制要求

查看 Queue 需要 Workspace 读取权限；Create、Edit、Delete 与 Apply 需要 Workspace 写权限。无可写 Workspace 时所有写入口必须禁用；服务端必须对对象修改和引用删除再次鉴权。

#### 4.2.7 非功能需求

弹窗最大高度应适配视口并支持内部滚动；错误必须紧邻字段。Dialog 必须管理焦点、支持键盘操作，并在大规模引用检查期间提供进度和可取消反馈。
### 4.3 Device & Interface

#### 4.3.1 功能说明

从当前 Fabric 候选设备中创建、编辑和批量管理接口 Assignment，并维护逐接口 RoCE/PFC 状态。

#### 4.3.2 产品设计及流程说明

Inventory/Fabric 必须拥有设备、角色和接口事实；Studio 只保存 canonical device/interface ID 与策略状态。多设备操作只能选择所有目标设备共同存在且共同支持的接口。单行 Edit 必须锁定设备集合；Bulk Edit 必须显示 Mixed 并要求覆盖确认。

#### 4.3.3 功能业务流程

```text
Select Devices → 筛选并选择设备 → 计算接口能力交集
→ 选择接口并配置 RoCE/PFC → Apply 创建 Assignment
→ 单行 Edit 或 Bulk Edit → 影响确认后 Delete
```

#### 4.3.4 原型界面与交互说明

##### 4.3.4.1 交互说明（SR-RLP-004～SR-RLP-006）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Select Devices | 打开 Assignment 创建流程。 | 点击。 | 清空临时选择并加载当前 Fabric 可授权设备。 | 无可写 Workspace、无 Fabric 或无可选设备时必须禁用并说明；加载失败允许重试。 | 候选必须来自当前 Fabric 和用户可读范围；设备身份使用 canonical device ID。 |
| Assignment Selection | 选择批量操作目标。 | 勾选行或表头全选。 | 显示已选数量、有效/失效数量和批量操作可用性。 | 失效或无写权限行不得进入修改集合；全选必须只选择当前筛选且可操作行。 | 选择只用于 UI 操作，不改变 Assignment ownership。 |
| Bulk Edit | 批量覆盖共享配置。 | 点击、查看 Mixed、设置值并确认。 | 不一致字段显示 `Mixed`；提交前展示将覆盖的设备、接口和值。 | 未明确选择覆盖值时不得把 Mixed 写入数据；覆盖必须二次确认，部分失败必须按对象报告并保持可重试状态。 | 只能修改已选 Assignment；不得把第一行值隐式当作批量模板。 |
| Bulk Delete | 批量删除 Assignment。 | 点击并确认影响。 | 展示设备、接口数量及候选配置影响。 | 必须确认；权限变化、并发或服务端失败时不得静默丢失行，必须逐项报告。 | 只删除 Studio Assignment，不删除 Inventory 设备或接口。 |
| Edit Assignment | 编辑单条 Assignment。 | 点击并修改接口状态。 | 回填该设备的接口与状态；设备控件只读。 | 单行 Edit 不得隐式改变设备集合；设备引用失效时必须显示失效原因并仅允许修复或删除。 | 设备集合固定；重定向到其他设备必须通过创建新 Assignment 与删除旧 Assignment 完成。 |
| Delete Assignment | 删除单条 Assignment。 | 点击并确认。 | 展示受影响接口和模板适用性。 | 必须影响确认；取消时保持原数据，失败时恢复并显示原因。 | 删除不改变 Fabric/Inventory 事实。 |
| Role Filter / Search | 筛选设备候选。 | 选择角色或输入关键字。 | Device List 实时过滤，空结果显示明确空状态。 | 搜索失败不得改变已选项；失效角色值必须提示刷新。 | 仅影响显示，不扩大权限或 Fabric 范围。 |
| Device Selection / Select All | 设置创建 Assignment 的目标设备集合。 | 勾选设备或筛选结果全选。 | 重新计算公共接口和能力交集，并提示被移除接口。 | 设备变化导致已选接口不再属于交集时必须要求确认后移除；无交集时必须阻止 Apply。 | 多设备接口候选必须是 canonical interface 与能力交集，不得只使用首台设备。 |
| Interface Search / Select All | 筛选并选择公共接口。 | 输入关键字、勾选或全选。 | 显示接口来源、覆盖设备数与能力状态。 | generated 名称必须标记为候选；任何目标设备无法解析时必须阻止 Apply，且 Build 前必须再次验证。 | 保存使用 canonical interface ID；generated 接口名不得作为已存在事实。 |
| RoCE Configuration | 设置逐接口 RoCE 状态。 | 选择 Enable/Disable。 | Disable 时同步预览 PFC 将关闭。 | 关闭 RoCE 但 PFC 仍启用时必须自动成对关闭并要求确认，或阻止提交。 | 只作用于所选 Assignment 接口。 |
| PFC Configuration | 设置逐接口 PFC 状态。 | 选择 Enable/Disable。 | RoCE Disabled 时 Enable 不可用并说明依赖。 | PFC Enabled 且 RoCE Disabled 必须阻止 Apply；不支持 PFC 的设备/接口必须列出。 | PFC 必须依赖 RoCE Enabled，并受接口能力交集约束。 |
| Bulk RoCE / Bulk PFC | 批量设置已选接口状态。 | 选择 Enable/Disable。 | 预览受影响接口及依赖联动。 | 未选接口、存在不支持设备或依赖不满足时必须禁用；覆盖 Mixed 状态必须确认。 | 只作用于当前弹窗已选公共接口。 |
| Dialog Close / Cancel | 关闭 Assignment 弹窗。 | 点击 X、Cancel、Esc 或 backdrop。 | 无修改时关闭；有修改时显示放弃确认。 | 用户取消放弃时必须保留数据和焦点；不得通过不同关闭入口绕过确认。 | 弹窗草稿与主表草稿必须隔离。 |
| Apply Assignment | 创建或更新 Assignment 草稿。 | 点击 Apply。 | 校验通过后写入行并更新统计和 Local Dirty。 | 未选设备/接口、PFC 依赖、能力、权限或引用错误必须阻止；服务端错误必须定位到设备/接口。 | Apply 只更新 Workspace 草稿，不表示保存、Build 或设备执行。 |
| Assignment Validity | 展示引用有效性并支持修复。 | 查看 Invalid badge、重新选择或删除。 | 显示失效 device/interface ID、原因与受影响字段。 | Fabric 切换、Inventory 删除或接口变化产生的失效引用必须可见并阻止保存，不得从列表隐藏。 | 有效性由当前 Fabric、Inventory、权限和能力共同派生，Build 必须复核。 |

##### 4.3.4.2 参数说明（SR-RLP-004～SR-RLP-006）

| 区域 | 字段/API 字段名 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Summary | Assigned Devices / `assignedDeviceCount` | 有效 Assignment 中 canonical device ID 的唯一计数。 |
| Summary | Device Interfaces / `assignedInterfaceCount` | canonical device ID 与 canonical interface ID 组合的唯一计数。 |
| Summary | Devices with PFC / `pfcDeviceCount` | 至少一个接口 `pfcEnabled=true` 的唯一设备数。 |
| Summary | Selected / `selectedAssignmentCount` | 当前批量选择的 Assignment 数。 |
| Assignment | Assignment ID / `assignmentId` | Workspace 内稳定 Assignment 标识，由服务端生成。 |
| Assignment | Device ID / `deviceId` | Inventory canonical device ID，来源于 Inventory。 |
| Assignment | Interface IDs / `interfaceIds` | canonical interface ID 集合，来源于目标设备接口交集。 |
| Assignment | Interface States / `interfaceStates` | 以 interface ID 为键的 `roceEnabled`、`pfcEnabled` 映射，来源于用户输入。 |
| Device | Role / `role` | Inventory/Fabric 提供的规范角色；显示名称可使用自定义角色标签。 |
| Interface | Candidate Source / `candidateSource` | `inventory` 或 `generated`；generated 仅表示待解析候选。 |
| Derived | Validity / `validity` | `valid`、`invalid` 或 `unverified`，由引用解析、权限和能力状态派生。 |

#### 4.3.5 列表字段

##### Assignment Table

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Selection / `assignmentId` | 行复选框及当前筛选可操作行全选。 | 始终显示 | 是 | 不支持 | 居中 | 不适用 |
| 2 | Sysname / `hostname`,`model` | hostname 主行、model 次行；失效引用显示原 device ID。 | 始终显示 | 否 | 支持 | 左对齐 | `hostname` 自然升序 |
| 3 | Mgmt IP / `managementIp` | Inventory 管理地址；缺失显示 `—`。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 4 | Role / `role` | 显示规范角色及可选自定义标签。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 5 | RoCE Interfaces / `interfaceStates` | 预览接口并显示 RoCE/PFC 计数。 | 始终显示 | 否 | 不支持 | 左对齐 | 不适用 |
| 6 | Validity / `validity` | Valid、Invalid 或 Unverified；可打开原因。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 7 | Modified / `updatedAt`,`updatedBy` | 服务端最后修改时间和操作者。 | 可隐藏 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Operation / derived | Edit、Delete。 | 始终显示 | 是 | 不支持 | 右对齐 | 不适用 |

##### Select Devices & Interfaces — Device List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Selection / `deviceId` | 行选择及当前筛选可操作设备全选。 | 始终显示 | 是 | 不支持 | 居中 | 不适用 |
| 2 | Device / `hostname` | hostname 与 canonical device ID。 | 始终显示 | 否 | 支持 | 左对齐 | `hostname` 自然升序 |
| 3 | Mgmt IP / `managementIp` | 管理地址。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 4 | Model / `model` | 设备型号。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 5 | Role / `role` | 规范角色及自定义标签。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 6 | Common Interfaces / `commonInterfaceCount` | 当前设备集合公共可用接口数量。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 7 | Capability / `capabilityState` | Supported、Partial、Unsupported 或 Unverified。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Access / `accessState` | Read/Write、Read Only 或 No Access。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |

##### Select Devices & Interfaces — Interface List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Selection / `interfaceId` | 公共接口行选择及当前筛选全选。 | 始终显示 | 是 | 不支持 | 居中 | 不适用 |
| 2 | Interface / `displayName` | 规范接口名称及 canonical interface ID。 | 始终显示 | 否 | 支持 | 左对齐 | 接口自然升序 |
| 3 | Source / `candidateSource` | Inventory 或 Generated Candidate。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 4 | Device Coverage / `deviceCoverage` | 支持该接口的目标设备数/总设备数。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 5 | RoCE Configuration / `roceEnabled` | Enable/Disable/Mixed。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 6 | PFC Configuration / `pfcEnabled` | Enable/Disable/Mixed；依赖 RoCE。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 7 | Capability / `capabilityState` | RoCE/PFC 公共能力状态。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Validation / `validationState` | Valid、Invalid 或 Unverified。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |

#### 4.3.6 权限控制要求

候选读取必须按 Fabric、设备和接口的对象权限过滤；创建、编辑、批量和删除需要 Workspace 写权限及全部目标对象写权限。无可写 Workspace 时所有写操作必须禁用。服务端必须逐个设备/接口再次鉴权，前端禁用不得替代鉴权。

#### 4.3.7 非功能需求

大列表必须分页或虚拟滚动；本地筛选目标响应应不超过 100ms。Checkbox、菜单和图标按钮必须提供可访问名称；状态不得只靠颜色表达。批量操作必须支持稳定选择和逐项失败反馈。
### 4.4 Switch Templates

#### 4.4.1 功能说明

分别维护 Spine、Leaf 的 PFC Watchdog、Deadlock、PFC Buffer 与 WRED/ECN 模板。

#### 4.4.2 产品设计及流程说明

模板必须按角色独立保存，并按该角色目标设备的能力交集与差异进行验证。没有目标设备时允许预配置，但必须标记为 Unverified，且在确定目标设备并完成 Build 前不得视为有效配置。PFC/WRED 必须引用有效业务 Queue，且同一角色内每类模板的 Queue 引用必须唯一。

#### 4.4.3 功能业务流程

```text
选择 Spine/Leaf → 加载角色目标设备与能力
→ 配置 Global/Deadlock → Create/Edit PFC 或 WRED
→ 校验 Queue 引用、唯一性、字段关系与能力差异
→ Save 到角色模板草稿
```

#### 4.4.4 原型界面与交互说明

##### 4.4.4.1 交互说明（SR-RLP-007～SR-RLP-009）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Spine/Leaf Tabs | 切换角色模板。 | 点击角色页签。 | 保留各角色草稿并显示设备数量、能力交集与差异。 | 角色无设备时必须显示 Unverified；加载失败必须保留草稿并允许重试。 | 只支持 Spine/Leaf；设备角色由 Inventory/Fabric 拥有，Studio 不得修改。 |
| PFC Watchdog | 配置角色级 PFC deadlock watchdog。 | Enable/Disable。 | 显示受影响设备和关联 Deadlock 参数状态。 | 设备不支持或与 PFC 状态组合无效时必须阻止保存并列出设备。 | 只属于当前角色模板；Build 必须按每台设备复核。 |
| Deadlock Granularity / Interval | 配置检测粒度与周期。 | 输入整数。 | 显示能力单位、范围和关系提示。 | 空值、非整数、非正数、违反粒度/周期关系或设备能力时必须阻止保存。 | 单位和步长必须由能力模型展示；不得使用未标注单位的值。 |
| Create/Edit PFC | 管理角色级 PFC Buffer 行。 | 打开弹窗并编辑。 | 展示有效业务 Queue、字段单位、能力交集和差异。 | Queue 无效/重复、数值非法、跨字段关系错误或设备不支持时必须阻止保存。 | 只能引用 4.2 的稳定 `queueId`；同角色 PFC Queue 引用必须唯一。 |
| Delete PFC | 删除 PFC Buffer 行。 | 点击并确认。 | 展示角色、Queue 与受影响设备。 | 必须影响确认；删除导致 Deadlock/PFC 组合不完整时必须阻止或要求先修复。失败时保留原行。 | 不得删除业务 Queue；仅删除当前角色的 PFC 引用。 |
| PFC Fields | 配置 Headroom、Guaranteed、Shared Ratio 与 Reset Offset。 | 输入能力允许的数值。 | 每个字段明确显示单位、范围、步长与来源平台。 | 负值、非整数/非数值、越界、单位不匹配及 Headroom/Guaranteed/Reset Offset 关系无效时必须阻止保存。 | Buffer 单位与范围由能力模型决定；设备差异不能用单一通用范围掩盖。 |
| Create/Edit WRED | 管理角色级 WRED/ECN 行。 | 打开弹窗并编辑。 | 展示有效业务 Queue、阈值单位和设备支持情况。 | Queue 无效/重复、阈值/概率非法、WRED/ECN 组合无效或设备不支持时必须阻止保存。 | 只能引用稳定 `queueId`；同角色 WRED Queue 引用必须唯一。 |
| Delete WRED | 删除 WRED/ECN 行。 | 点击并确认。 | 展示角色、Queue 与候选行为变化。 | 必须影响确认；失败时保留原行并允许重试。 | 不得级联删除业务 Queue 或其他角色行。 |
| WRED / ECN Toggles | 配置 WRED 丢弃与 ECN 标记开关。 | Enable/Disable。 | 显示适用字段和将保留/清除的参数预览。 | 不支持的组合必须阻止保存；关闭功能时不得留下会参与生成的隐藏参数。 | 组合可用性由目标设备能力交集决定。 |
| WRED Threshold / Drop | 配置最小/最大阈值和最大丢弃概率。 | 输入数值。 | 显示阈值单位、范围、步长及 Min/Max 关系。 | Min/Max 为空、非数值、负值、Min 大于 Max、Drop 不在 0–100 或能力不支持时必须阻止保存。 | Threshold 单位由能力模型明确展示；Drop Probability 单位为百分比。 |
| Dialog Close / Cancel | 关闭 PFC/WRED 弹窗。 | 点击 X、Cancel、Esc 或 backdrop。 | 无修改时关闭；有修改时显示放弃确认。 | 用户取消放弃时必须保留数据与焦点；不得绕过确认。 | 弹窗草稿与角色模板草稿必须隔离。 |
| Save Template Row | 写入 PFC/WRED 模板行。 | 点击 Save。 | 校验通过后新增或更新行，并更新 Local Dirty。 | 引用、唯一性、字段、能力或权限错误必须阻止关闭；服务端错误必须定位到角色和 Queue。 | 只更新 Workspace 草稿，不表示 Build 或执行。 |
| Role Capability Validation | 校验角色目标设备能力。 | 查看交集、差异并按平台筛选。 | 显示支持设备、差异设备、单位、范围和 Unverified 状态。 | 任一目标设备不兼容时必须阻止统一模板保存，或要求拆分为明确的受支持作用范围；能力缺失必须阻止 Build 成功。 | Template 必须按角色且按目标设备能力交集/差异验证；Build 是权威校验。 |

##### 4.4.4.2 参数说明（SR-RLP-007～SR-RLP-009）

| 区域 | 字段/API 字段名 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Role | Role / `role` | 模板目标角色；枚举 `spine`、`leaf`，来源于用户页签。 |
| Global | PFC Watchdog / `pfcWatchdogEnabled` | 是否启用 PFC deadlock watchdog；用户输入布尔值。 |
| Global | Deadlock Detection Granularity / `deadlockDetectionGranularity` | 检测粒度数值；单位、范围和步长来源于能力模型。 |
| Global | Deadlock Detection Interval / `deadlockDetectionInterval` | 检测周期数值；单位、范围和步长来源于能力模型。 |
| PFC | Queue Reference / `queueId` | 指向业务 Queue 稳定对象 ID；显示值派生为 `roceQueue`。 |
| PFC | Headroom / `headroom` | 暂停传播期间专用 Buffer 数值；单位与范围来源于能力模型。 |
| PFC | Guaranteed / `guaranteed` | Queue 保证 Buffer 数值；单位与范围来源于能力模型。 |
| PFC | Shared Ratio / `sharedRatio` | 共享 Buffer 比例或权重；语义、单位与范围来源于能力模型。 |
| PFC | Reset Offset / `resetOffset` | 恢复阈值偏移数值；单位与范围来源于能力模型。 |
| WRED | Queue Reference / `queueId` | 指向业务 Queue 稳定对象 ID；显示值派生为 `roceQueue`。 |
| WRED | Enabled / `enabled` | 是否启用 WRED 丢弃；用户输入布尔值。 |
| WRED | Min Threshold / `minThreshold` | 概率处理起始阈值；单位、范围和步长来源于能力模型。 |
| WRED | Max Threshold / `maxThreshold` | 概率处理最大阈值；单位、范围和步长来源于能力模型。 |
| WRED | Drop Probability / `dropProbability` | 最大丢弃概率；单位为 %，范围 0–100。 |
| WRED | ECN Enabled / `ecnEnabled` | 是否启用 ECN 标记；用户输入布尔值。 |
| Capability | Supported Range/Unit / `capabilityProfile` | 按 ASIC、型号和软件版本聚合的单位、范围、步长及特性支持，来源于能力服务。 |

#### 4.4.5 列表字段

##### PFC Table

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | RoCE Queue / `queueId` | 显示引用 Queue 的 `roceQueue`；失效显示 Invalid Reference。 | 始终显示 | 否 | 支持 | 左对齐 | `roceQueue` 升序 |
| 2 | Headroom / `headroom` | 数值加能力模型单位。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 3 | Guaranteed / `guaranteed` | 数值加能力模型单位。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 4 | Shared Ratio / `sharedRatio` | 数值加能力模型定义的单位或标签。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 5 | Reset Offset / `resetOffset` | 数值加能力模型单位。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 6 | Device Support / `capabilityState` | Supported、Partial、Unsupported 或 Unverified。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 7 | Validation / `validationState` | Valid、Warning 或 Invalid。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Operation / derived | Edit、Delete。 | 始终显示 | 是 | 不支持 | 右对齐 | 不适用 |

##### WRED Table

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | RoCE Queue / `queueId` | 显示引用 Queue 的 `roceQueue`；失效显示 Invalid Reference。 | 始终显示 | 否 | 支持 | 左对齐 | `roceQueue` 升序 |
| 2 | WRED / `enabled` | Enabled/Disabled。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 3 | Min Threshold / `minThreshold` | 数值加能力模型单位。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 4 | Max Threshold / `maxThreshold` | 数值加能力模型单位。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 5 | Drop Probability / `dropProbability` | 数值加 `%`。 | 始终显示 | 否 | 支持 | 右对齐 | 不适用 |
| 6 | ECN / `ecnEnabled` | Enabled/Disabled。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 7 | Device Support / `capabilityState` | Supported、Partial、Unsupported 或 Unverified。 | 始终显示 | 否 | 支持 | 左对齐 | 不适用 |
| 8 | Operation / derived | Edit、Delete。 | 始终显示 | 是 | 不支持 | 右对齐 | 不适用 |

#### 4.4.6 权限控制要求

查看模板需要 Workspace 与目标角色设备读取权限；修改 Global、PFC、WRED 和删除行需要 Workspace 写权限及目标设备作用范围写权限。无可写 Workspace 时所有写操作必须禁用；服务端必须对角色、Queue 引用和目标设备再次鉴权。

#### 4.4.7 非功能需求

角色切换不得丢失草稿。Toggle 必须支持辅助技术，错误必须同时提供文字。Dialog 必须管理焦点并适配视口。能力差异计算必须可缓存且显示数据版本与刷新状态。
### 4.5 Studio 公共表单

#### 4.5.1 功能说明

提供 Workspace 选择、Review、3 个可见导航页、Previous/Next、顶部 Save 与末页 Apply，并展示 Local Dirty、Save State、Build State、revision 和校验结果。

#### 4.5.2 产品设计及流程说明

Workspace 必须承载 Studio 候选变更。顶部 Save 与末页 Apply 允许保留为两个视觉入口，但必须调用同一保存契约、产生一致的原子事务语义，并明确只保存 Workspace candidate，不表示 Build、Submit、Change Control 执行或设备生效。

保存必须绑定真实 revision/ETag；Review 必须固定一个已保存且 Build 满足提交条件的 revision；Submit 后由 Change Control 承担审批和执行。Local Dirty、Save State 与 Build State 必须独立展示，不得互相推断。

#### 4.5.3 功能业务流程

```text
选择可写 Workspace → 加载 baseline、overlay、revision/ETag 与权限
→ 按 3 个导航页编辑 → Save 或末页 Apply 调用同一保存契约
→ 返回新 revision/ETag 与审计 → Build
→ 修复字段、能力、ownership、引用及跨源冲突
→ Review 固定 revision → Submit
→ Change Control 审批、排期与执行 → 回采 Running/Compliance
```

#### 4.5.4 原型界面与交互说明

##### 4.5.4.1 交互说明（SR-RLP-010）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Studios | 返回 Studio 列表。 | 点击。 | 无 Local Dirty 时直接返回；有脏数据时显示离开确认。 | 用户取消离开时必须保留页面、草稿和焦点；确认离开不得误报已保存。 | 只执行导航，不保存、不 Build、不提交。 |
| Workspace Selector | 选择 Workspace 上下文。 | 搜索并选择可访问 Workspace。 | 加载可写性、baseline、Studio overlay、revision/ETag、审计和 Build State。 | 切换时若有 Local Dirty 必须确认；加载失败必须保留原上下文并允许重试。无可写 Workspace 时所有写操作必须禁用。 | 只列出用户可读 Workspace；选择不改变 Workspace 权限。Workspace 平台拥有 revision、baseline 与状态。 |
| Review Workspace | 打开固定 revision 的审阅界面。 | 点击。 | 显示将审阅的 Workspace、revision、Build 结果、变更摘要和提交资格。 | Local Dirty、保存中/失败、Build 未完成/失败、revision 不匹配或无权限时必须禁用并解释；revision 变化后必须重新 Review。 | Review 不执行设备变更；必须绑定不可变 revision，不能审阅“最新草稿”别名。 |
| Save to Workspace | 保存 Studio 候选输入。 | 点击。 | 调用统一保存契约，显示 Saving，成功后更新 revision/ETag、审计、Local Dirty 与 Needs Build。 | 客户端阻断错误不得发起保存；超时/可重试失败必须保留草稿并提供幂等重试；ETag 冲突必须阻止覆盖并提供刷新、比较或另存处理；服务端错误必须定位。 | 与末页 Apply 使用完全相同的事务契约；只保存 candidate，不表示设备生效。 |
| Apply | 从末页保存 Studio 候选输入。 | 点击。 | 页面位置不同，但请求、校验、原子性、返回值和状态变化必须与 Save 完全一致。 | 必须采用与 Save 相同的错误、并发、重试和审计处理；不得形成第二套保存语义。 | 不等于 Assignment 的弹窗 Apply、Build、Submit、Change Control 或设备执行。 |
| Workspace Status | 分开展示编辑、保存和构建状态。 | 查看状态、打开详情或重试允许的操作。 | 分别展示 Local Dirty、Save State、Build State、已保存 revision、已 Build revision 和更新时间。 | 状态获取失败必须显示 Unknown，不得把旧状态显示为最新；保存 revision 与 Build revision 不一致时必须显示 Needs Build。 | Local Dirty 只能由草稿差异派生；Save State 只能由保存事务派生；Build State 只能由平台 Build 结果提供。 |
| Left Navigation | 切换 3 个可见页面。 | 点击页签。 | 保留草稿，显示各页阻断错误数量。 | 目标页无法渲染时必须保留草稿并提供重试；切页不得清除错误。 | 仅切换视图，不触发保存或 Build。 |
| Previous / Next | 按页面顺序导航。 | 点击。 | Previous 在首屏禁用，Next 在末屏替换为 Apply；保留草稿。 | 当前页存在错误时允许导航，但必须显示错误计数；不得把 Next 解释为校验通过。 | 仅切换视图；不保存、不改变 revision。 |
| Form Validation | 汇总客户端和服务端校验。 | 查看、筛选并点击错误。 | 按页面、对象、字段、设备和严重级别展示，并可导航聚焦。 | 阻断错误必须禁止 Save/Apply；无法定位的服务端错误必须保留全局条目和关联 ID；警告是否允许保存必须由错误契约明确。 | 表单预检不得替代 Build 对输入、设备能力、ownership 和跨源冲突的权威校验。 |
| Workspace Save | 执行原子、并发安全的保存事务。 | 由 Save 或 Apply 触发，也可点击 Retry。 | 成功返回新 revision/ETag、服务端 actor/timestamp 和 Needs Build。 | 必须使用幂等键防止重复写入；网络中断后必须查询事务结果再重试；部分对象失败时整个 Studio overlay 保存必须回滚。 | Workspace 服务拥有持久化、revision 和审计；Studio 只提供结构化输入。 |
| Build Validation | 展示 Workspace Build 结果。 | 启动 Build、查看结果、点击错误回链。 | 显示 Queued、Building、Succeeded、Succeeded with Warnings、Failed 或 Unknown，并绑定 revision。 | Build 失败必须保留已保存 candidate，按 Policy/Queue/Assignment/Template、设备和来源定位；过期 revision 的结果必须标记 Stale。 | Build 必须权威校验输入、设备能力、ownership、引用和跨 Studio、Intent Center、Templates & CLI 来源冲突。 |
| Submit Workspace | 提交已审阅 revision。 | 在 Review 中确认 Submit。 | 显示提交 revision 和后续 Change Control 可用状态。 | Review 后 revision 改变、Build 不满足条件、并发状态变化或无权限时必须阻止提交并要求重新 Review。 | Submit 不等于设备执行；后续审批和执行由 Change Control 负责。 |
| Change Control Status | 展示提交后的审批与执行摘要。 | 查看详情或跳转平台 Change Control。 | 显示审批、排期、执行和恢复状态，并链接到平台记录。 | 状态不可用时必须显示 Unknown；不得依据 Submit 或 Task 映射推断执行成功。 | Studio 不审批、不排期、不执行或回滚。AmpCon Tasks 如存在只可映射执行对象，不保证每个 Studio 变更生成 Classic Task。 |
| Running / Compliance | 展示设备回采结果。 | 查看设备、接口与策略偏差。 | 显示回采时间、Running 状态及 Compliance 结果。 | 无回采、回采过期或设备不可达时必须显示 Unknown/Unavailable，不得显示已部署或合规。 | Running/Compliance 只来源于 Telemetry 与平台计算，不得由 Save、Build、Submit 或执行请求推断。 |
| Policy Summary | 汇总当前候选规模和风险。 | 查看并跳转详情。 | 显示 Fabric、Queue、Assignment、接口、模板、失效引用和阻断错误数量。 | 统计必须包含失效对象；数据无法完整计算时必须标注 Partial。 | 汇总只描述当前草稿或明确 revision，必须显示数据基准。 |

##### 4.5.4.2 参数说明（SR-RLP-010）

| 区域 | 字段/API 字段名 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Workspace Context | Workspace ID / `workspaceId` | Workspace 稳定标识，来源于 Workspace 服务。 |
| Workspace Context | Workspace Revision / `workspaceRevision` | 最近成功保存的 candidate 不可变修订标识，来源于 Workspace 服务。 |
| Workspace Context | Base Mainline Revision / `baseRevision` | 当前 candidate 所基于的 mainline/baseline 修订标识。 |
| Workspace Context | Revision ETag / `etag` | 下一次乐观锁保存的条件标识，来源于最近加载或保存响应。 |
| Workspace Context | Studio Overlay / `studioInput` | Policy、Queue、Assignment 与 Template 的结构化输入，来源于本 Studio 编辑。 |
| Status | Local Dirty / `localDirty` | 当前 `studioInput` 相对 `workspaceRevision` 中已保存 overlay 是否有差异。 |
| Status | Save State / `saveState` | 枚举 `unsaved`、`saving`、`saved`、`failed`、`conflict`；来源于保存事务。 |
| Status | Build State / `buildState` | 枚举 `notBuilt`、`queued`、`building`、`succeeded`、`succeededWithWarnings`、`failed`、`unknown`；来源于 Workspace Build。 |
| Status | Built Revision / `builtRevision` | Build 结果绑定的 Workspace revision；与 `workspaceRevision` 不同则派生为 Stale/Needs Build。 |
| Status | Validation Issues / `validationIssues` | 客户端、保存服务或 Build 返回的结构化问题集合，包含 code、severity、object、field、device 与 source。 |
| Review | Reviewed Revision / `reviewedRevision` | 用户完成 Review 时固定的 revision；任何后续保存都使其失效。 |
| Audit | Saved By / `savedBy` | 最近成功保存 actor，来源于服务端审计。 |
| Audit | Saved At / `savedAt` | 最近成功保存的服务端时间戳，单位为 ISO 8601。 |
| Summary | Counts / `summary` | Fabric、Queue、Assignment、接口、模板、失效引用和问题数量，由当前草稿或指定 revision 派生。 |

#### 4.5.5 列表字段

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 不适用 | 不适用 | 本模块为公共导航、状态与 Workspace 上下文，无独立数据列表。 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 |

#### 4.5.6 权限控制要求

Workspace 下拉必须只显示用户可读对象。所有编辑、Save/Apply 与 Build 操作必须依据 Workspace 可写性和对象权限控制；Review、Submit、Change Control 审批与执行必须分别依据平台授权。无可写 Workspace 时所有写操作必须禁用并显示原因。服务端必须对每次保存、Build、Review/Submit 和 Change Control 操作再次鉴权，Studio 不得推断或继承未明确授予的权限。

#### 4.5.7 非功能需求

保存必须原子、幂等、可重试并带 revision/ETag 并发保护；状态必须绑定明确 revision。页面切换不得丢失草稿。所有错误和禁用原因必须可读、可定位且不只用颜色表达。Dialog 必须支持焦点管理。审计时间必须使用服务端时间，状态刷新必须防止旧响应覆盖新状态。

## 5. 功能评审（Review）

### 5.1 评审人员

| 角色 | 评审重点 |
|---|---|
| 产品经理 | 目标态范围、迁移确认、保存事务、状态拆分与平台边界 |
| RoCE 网络架构师 | Trust/CNP、Queue 唯一性、调度、PFC/WRED、Deadlock 与平台能力 |
| UX/UI | 页面层级、Mixed/影响确认、错误定位、状态可理解性与无障碍 |
| 前端开发 | 确定性联动、脏数据保护、接口交集、能力差异和 revision 绑定 |
| 后端/平台开发 | canonical ID、引用图、能力契约、Workspace revision/ETag、原子性、RBAC 与审计 |
| 测试工程师 | 跨字段/对象/来源校验、并发冲突、重试、批量部分失败与回采证据 |

### 5.2 评审结果

| 功能 | 结果 | 评审重点 |
|---|---|---|
| Policy & CNP | 待评审 | Fabric 切换影响处理、Trust Mode 确定性迁移、CNP Queue 能力与引用有效性 |
| Queue Configuration | 待评审 | 至少一条业务 Queue、策略内分类值唯一、WFQ 单位、引用删除阻断与调度能力 |
| Device & Interface | 待评审 | canonical ID、多设备接口能力交集、单行设备锁定、Mixed 覆盖确认与失效引用修复 |
| Switch Templates | 待评审 | 按角色能力交集/差异、Deadlock/PFC/WRED 完整校验、Queue 引用唯一性与单位展示 |
| Studio 公共表单 | 待评审 | Save/Apply 统一事务、状态拆分、revision/ETag、Build 权威校验、Review/Submit 与 Change Control 边界 |

### 5.3 遗留问题

| 编号 | 待产品确认事项 | 建议处理与章节回链 |
|---|---|---|
| OI-001 | 不同平台的 WFQ Guaranteed Rate 支持哪些计量单位、换算规则与步长。 | 由能力契约按平台返回原生单位、范围和步长；UI 不得自行换算，见 4.2.4.1、4.2.4.2。 |
| OI-002 | 不同 ASIC/平台的 Headroom、Guaranteed、Shared Ratio、Reset Offset 与 WRED Threshold 使用何种原生单位，以及是否允许跨平台归一化展示。 | 能力契约必须声明字段语义和原生单位；如提供归一化值，必须同时保留原生值并标注换算，见 4.4.4.1、4.4.4.2。 |
| OI-003 | 当同一角色设备能力无公共参数范围时，产品采用禁止统一模板，还是允许按平台拆分同角色模板。 | 产品需确定模板分组模型；在确认前必须阻止无法由全部目标设备支持的统一模板保存，见 4.4.2、4.4.4.1。 |
