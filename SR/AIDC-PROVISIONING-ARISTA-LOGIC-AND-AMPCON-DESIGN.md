# AIDC Provisioning：Arista 语义、AMPCon 当前实现与目标设计

> 文档状态：Network Design 统一生命周期与信任机制对齐版 v1.4  
> 更新日期：2026-08-21  
> 适用范围：AIDC Network / Provisioning / Studios / Workspaces / Tasks / Change Control  
> 代码基线：`components/apps/AIDCStudio2.tsx`、`AIDCInventoryTopology.tsx`、`AIDCL3LeafSpineFabric.tsx`、`AIDCProvisioning.tsx`、`components/topology/TopologyCanvas.tsx`

## 0. 阅读规则与结论先行

本文严格区分三类证据，避免把原型文案写成 CloudVision 正式行为：

- **Arista 官方语义**：来自当前 Arista Configuration Guide、Help Center、Workspace API 和官方实验指南。
- **AMPCon 当前代码事实**：当前仓库中已经可以操作或展示的前端行为。
- **AMPCon 目标设计**：后续接入后端、持久化、权限和真实执行后的产品行为。

核心结论：

1. Arista Studios 正式主链是 `Workspace → Build / Synchronize / Review / Submit → Provisioning Actions → Change Control`。
2. Classic Network Provisioning 主链是 `Configlet / Image / Container change → Task → Execute Task Action → Change Control`。
3. 当前 AMPCon 顶级导航保留 `Studios、Workspaces、Tasks、Change Control`，但这只是产品信息架构，不能证明所有 Studio Workspace 在 Arista 中都固定生成 Task。
4. 当前可交互实现已经覆盖 Studios Explorer、共享 Inventory、Canonical Role/Node ID、L3 Leaf-Spine 层级与 Topology 投影；Workspace 后半段仍是前端 mock，不是完整配置下发闭环。
5. Submit 只能更新 Designed/Mainline；只有 Change Control 执行成功后，Running Configuration 才更新。
6. AMPCon 采用“业务入口 + Studio 工程工作台 + Workspace/Change Control 信任机制”：Intent Center 可以预填 Studio，但不能拥有配置、Build、审批或执行状态。
7. 借鉴 Juniper Apstra，AMPCon 在 Studio Definition 与 Workspace 之间增加长期 `FabricBlueprint`：Studio 是可复用定义，Blueprint 是站点/Fabric 的期望状态实例，Workspace 是修改 Blueprint 的短期事务。

## 1. Arista 官方对象与生命周期

### 1.1 Studios 路径

**Arista 官方语义**：设备先完成 onboarding，再在 Inventory and Topology Studio 中注册并维护接口连接，之后才能被其他 Studio 分配。用户在一个 Pending Workspace 中修改一个或多个 Studios，执行 Workspace-wide Build，必要时 Synchronize 最新 Mainline，然后 Review 和 Submit。提交后的设备配置或镜像变化以 Provisioning Actions 进入 Change Control，由有权限的用户审批、排期和执行。

```text
Inventory and Topology
→ Studio Inputs / Assignments in Workspace
→ Workspace-wide Build
→ Synchronize（如 Mainline 已变化）
→ Review / Submit
→ Designed Configuration / Mainline 更新
→ Set Configuration / Set Image 等 Provisioning Actions
→ Change Control 审批、排期、执行
→ Running Configuration 更新
```

Build 成功只说明当前 Workspace revision 通过处理与校验，不表示已提交，更不表示配置已在设备生效。Workspace lifecycle、Build status、Synchronization freshness 是三个独立维度。

### 1.2 Classic Tasks 路径

**Arista 官方语义**：Classic Network Provisioning 中，Configlet、Image Bundle 或 Container 变化形成 Task。Task 是面向设备的操作工单，通过 Execute Task Action 加入 Change Control。Task 已关联 Change Control 只表示已纳入执行计划，不代表已批准或执行成功。

```text
Classic configuration/image/container change
→ Task
→ Execute Task Action
→ Change Control
→ Approve / Schedule / Execute
```
### 1.3 状态归属

| 维度 | 正确归属 | 典型值/含义 |
|---|---|---|
| Workspace lifecycle | Workspace | Pending、Submitted、Abandoned |
| Build state | 某个 Workspace revision | In progress、Succeeded、Failed、Canceled、Skipped |
| Synchronization | Workspace 与 Mainline 的关系 | Current、Out of date、Conflict |
| Validation severity | Build stage/result | Error、Warning、Info |
| Designed/Mainline | 已提交设计事实 | CloudVision 期望设备最终具备的配置 |
| Running | 设备事实 | 设备当前实际运行配置 |

官方 Workspace API 定义四个 Build stage：Input Validation、Configlet Build、Config Validation、Image Validation。UI 可以使用 Configlet Compilation、Software Validation 等版本化标签，但不能把它们当成 lifecycle 状态。

### 1.4 Submit、执行与回滚边界

- Submit 把 Proposed Changes 合并进 Designed/Mainline，并关闭 Workspace；它不直接更新 Running。
- Change Control 拥有 Stages、串并行关系、审批、排期、执行与审计。
- 操作是否可用取决于对象状态和 RBAC；修改已批准的执行内容后应重新审批。
- 执行失败必须保留 Action/Task、设备、阶段、日志和原因。
- 未确认目标平台能力前，不承诺自动回滚；补偿变更应通过新的受控 Change Control 完成。

## 2. AMPCon 当前导航与分发链

**AMPCon 当前代码事实**：Sidebar 的正式 Provisioning 入口为：

```text
Studios         → feature: studio2
Workspaces      → feature: workspaces
Tasks           → feature: tasks
Change Control  → feature: change-control
```

运行时分发：

```text
Sidebar
→ AIRoceApp
  ├─ studio2              → AIDCStudio2（正式 Studios 入口）
  ├─ workspaces:<id>      → AIDCProvisioning / Workspaces review
  ├─ workspaces           → AIDCProvisioning / Workspaces
  ├─ tasks                → AIDCProvisioning / Tasks
  └─ change-control       → AIDCProvisioning / Change Control
```

`AIRoceApp` 仍保留 `studios → AIDCProvisioning` 的旧入口。它没有出现在当前正式 Sidebar 中，但属于待删除或重定向的技术债。`workspaces:<encodedWorkspaceId>` 是 React 内存 feature token，不是稳定 URL，刷新与分享不可恢复。

## 3. Studios Explorer 的当前实现

`AIDCStudio2` 是当前正式 Studios 容器，职责如下：

1. 维护顶部 Workspace 编辑上下文；Workspace 不是普通筛选器。
2. 将 Inventory and Topology 固定为 Foundation，不参与普通 Studio 分类和状态筛选。
3. 维护 Studio 选择与打开的分离：单击只更新右侧详情，Open、双击或 Enter 才进入 Studio。
4. 持有共享 `InventoryTopologyState`，并把同一份 registered devices 与 connections 传给 Inventory 和 L3 Leaf-Spine Studio。
5. 从 L3 Studio 的 Review Workspace 跳转到 `workspaces:<workspaceId>`。

当前 Explorer 的 Mainline、Selected Workspace 和活动信息主要来自静态数组；Studio 六值状态映射也仍是 mock。它们用于演示信息层次，不是 Arista 正式枚举。

## 4. Inventory and Topology：唯一设备与连接事实源

### 4.1 状态所有权

**AMPCon 当前代码事实**：`AIDCInventoryTopology` 拥有以下状态：

```text
InventoryTopologyState
- registered[]             设备身份、管理信息、Role、Node ID
- updates[]                待接受或已忽略的 Network Updates
- connections[]            实际接口到接口连接
- removedConnectionIds[]   Workspace 中移除的 Mainline 连接
- acceptedTotal            当前会话接受计数
```

`AIDCStudio2` 在父组件中持有这份状态，因此退出 Inventory 再进入 L3 Studio 时，设备、Role、Node ID 与连接仍保持一致。当前共享范围只在该 React 组件生命周期内，刷新后丢失。

### 4.2 Network Updates

Registered Devices 与 Network Updates 使用 Tab。选择更新时，Topology 只做 discovery preview；Review & Accept 后才把设备和连接写入当前 Workspace view。Accept、Ignore、Undo、Revert 都只修改内存中的候选状态：

```text
发现更新
→ 选择并预览虚线 overlay
→ Review & Accept
→ registered / connections 写入当前 Workspace view
→ Build Required
→ 后续仍需真实 Build 与 Submit 才能进入 Mainline
```

当前 `built` 只是本地 boolean。四个 Build stage 的 Passed/Pending 是展示逻辑，没有调用真实 Build 服务。

### 4.3 Canonical Role 与 Fabric Node ID

Inventory 是 Role 和 Fabric Node ID 的唯一 owner：

- `Device.id` 是应用/Inventory 主键，不等于 Fabric Node ID。
- `nodeId` 是当前 Fabric Node ID；`autoNodeId` 是控制器建议值；`nodeIdSource` 为 Auto 或 Override。
- Override 必须是正整数，并在当前 Inventory scope 内唯一。
- 可以恢复自动值；若自动值已被占用则阻止恢复。
- L3 Studio 只读引用 Role、Node ID 和来源，不保存第二份设备身份状态。

### 4.4 Connection ownership

Inventory 拥有真实接口连接。设备 Drawer 支持新增、修改和移除 interface-to-neighbor connection；L3 Studio 只投影这些 observed links。操作端口运行状态不在该模型中维护。
## 5. L3 Leaf-Spine Fabric：配置模型与工作台

### 5.1 配置所有权与层级

**AMPCon 当前代码事实**：L3 Studio 拥有 Fabric 设计，不拥有设备身份或物理连接。当前层级为：

```text
Data Center
├─ Pod Default
├─ Named Pod
│  ├─ L3 Leaf Domains
│  │  └─ Named L3 Domain
│  └─ L2 Leaf Domains
│     └─ Named L2 Domain
```

`DC Default` 与 `Pod Default` 是可保存的完整配置节点，不是 Inherited 状态，不是 copy-on-create 模板，也不是运行时 DC/Pod/Domain。L3/L2 collections 只是导航集合，不代表额外物理区域。

### 5.2 数据边界

| 数据 | Owner | L3 Studio 用法 |
|---|---|---|
| Device identity、MAC、管理 IP、Model | Inventory | 只读选择与展示 |
| Role、Node ID | Inventory | 只读引用 |
| Interface connections | Inventory | 只读 observed topology |
| DC、Pod、L3/L2 Domain | L3 Studio | 创建、编辑、删除 |
| Address pools、ASN、MLAG、Platform、Advanced settings | L3 Studio | Inputs |
| Spine/Leaf membership | L3 Studio | Assignments |

### 5.3 配置工作台

左侧树负责定位对象；右侧配置工作台从树旁展开并挤压 Topology，不覆盖画布。工作台支持最大化、单行面包屑、逐层返回、Save to Workspace 和 Save & Close。

- DC：Pods、Super-Spine Planes、Role/Node ID 引用、Platform Settings、Advanced Fabric Settings。
- Pod：Addressing、Spine Assignment、L3/L2 Leaf Domains。
- Domain：ASN/MLAG、Leaf Assignment。
- 新建 DC、Pod、Domain 后自动展开对应树节点并直接打开配置。

当前 `markChanged()` 只把 `changeCount` 设为 1，Save 只切换本地 `saved` 状态；尚未产生真实 WorkspaceModification 或 revision。

### 5.4 Assignment 与校验

当前阻断和警告逻辑：

- L3 Domain 缺少 ASN：error。
- Domain 没有 Leaf：error。
- Pod 没有 Spine 或没有 Domain：error。
- 同一 Spine 被多个运行时 Pod 使用：error。
- 同一 Leaf 被多个运行时 Domain 使用：error。
- 启用 MLAG 的 Domain 不是两个 Leaf：warning。
- Address pool 缺失：warning。

Default 节点中的 Assignment 值只属于默认配置数据，不建立运行时 ownership。

## 6. Topology：数据合成与布局算法

### 6.1 两种视图

`TopologyCanvas` 支持两种布局：

1. **Inventory/Studio Devices role layout**：按设备 role rank 分行展示。
2. **L3 hierarchy layout**：根据 DC → Pod → Domain 关系生成层级区域。

L3 hierarchy 的节点来自 Inventory，但只显示被 Studio 选中并分配到运行时层级的设备。层级区域来自 L3 Studio 的 DC、Pod、Domain；连接由两类数据合成：

```text
若 Spine–Leaf 在 Inventory connections 中存在
→ observed / inventory link
否则
→ planned link（由当前 Pod 的 Spine × Leaf 关系生成）
```

planned link 是灰色实线；只有 Inventory discovery preview 可以使用蓝色虚线。L3 Studio 不把 planned link 伪装成已观测物理连接。

### 6.2 动态层级布局

`layoutByHierarchy` 从子内容反向计算父边界：

- Domain 宽度由 Leaf 数量和卡片间距计算。
- Pod 宽度取 Spine 行、Domain 总宽度和最小宽度的最大值。
- DC 宽度由所有 Pod 总宽度、Pod gap 和 padding 计算。
- Pod 优先单行横向排列，不自动纵向换行。
- Role band 被限制在所属 Pod 或 Domain 内。
- Fit view 使用实际 DC 外框，并增加水平和垂直 padding。

因此新增 Pod、Domain 或设备后，外层区域会随内容扩展，子对象不会溢出父区域。

### 6.3 Pod 折叠

每个 DC 独立维护最近两个展开 Pod：

- 前两个 Pod 默认展开；第三个及以后显示折叠摘要。
- 双击或 Enter/Space 可展开折叠 Pod。
- 展开第三个时使用最近使用顺序保留两个，最早展开的 Pod 自动折叠。
- 折叠只隐藏画布节点和 Domain 区域，不修改 Studio/Workspace 配置。

### 6.4 区域、高亮与连线端点

- 未选层级区域统一灰色。
- 当前配置区域使用绿色 stroke、浅绿色 fill 和深绿色文字。
- Validation 红黄绿只用于左树状态点，不改变 Topology 区域颜色。
- 画布始终显示完整已分配结构，只高亮当前配置对象。
- 跨 role rank 的连线从上层卡片底部中心连接到下层卡片顶部中心。
- 同层互连使用卡片左右边。
- 连线从卡片边缘开始和结束，不穿过卡片。

### 6.5 Port labels 与图例

Port labels 默认在 hover 链路时显示；开启 Port labels 后，稀疏拓扑可全显，密集拓扑只显示 hover 设备相邻链路，避免标签堆叠。Inventory role layout 保留 Mainline、Workspace added/modified、discovery 等图例；L3 hierarchy 不显示 Inventory lifecycle 图例。
## 7. 当前 Workspace、Tasks 与 Change Control 原型边界

### 7.1 当前代码事实

| 页面/能力 | 当前实现 | 不能据此推断的行为 |
|---|---|---|
| Inventory Build | 本地 `built` boolean，四阶段静态切换 | 没有真实生成配置、镜像校验或 revision |
| L3 Save | 本地 `saved/changeCount` | 没有跨页 WorkspaceModification |
| Workspaces list/review | 静态 mock 数据与内存选中项 | 没有持久化、同步、冲突解决或真实 diff |
| Submit | 展示按钮/文案，缺少完整 handler | 不会更新 Mainline，也不会生成 Action/Task |
| Tasks | 静态 `lifecycleTasks`，文案称来自 submitted Workspaces | 这是 AMPCon 产品抽象，不是 Studios 官方固定路径 |
| Change Control | 静态 `lifecycleControls` 和详情 Tab | 没有审批、排期、执行、日志或权限服务 |
| 跨页状态 | feature token 与组件 local state | 刷新后不能恢复，页面之间没有统一 server state |

当前 Tasks 页面标题下的 “Device-level execution work orders generated from submitted Workspaces” 必须视为 **AMPCon 当前 mock 文案**。后续若保留该产品抽象，后端必须明确映射到目标平台的 Action/Task 模型，并保证同一变更只执行一次。

### 7.2 当前 UI 与目标生命周期对照

```text
当前前端：
Studio/Inventory local state
→ local Save / local Build boolean
→ static Workspace review
→ static Tasks
→ static Change Control

目标闭环：
Workspace revision
→ persisted modifications
→ real Build stages and results
→ Mainline synchronization/conflict handling
→ Review / authorized Submit
→ platform-specific Provisioning Actions or Classic Tasks
→ Change Control approval/schedule/execute
→ device result, compliance and audit
```

## 8. 目标状态与 API 边界

建议按以下边界拆分后端：

```text
InventoryService
- devices, interfaces, roles, nodeIds, observedConnections, discoveryUpdates

WorkspaceService
- workspaces, revisions, modifications, lifecycle, synchronize, submit

BuildService
- build runs, four stages, validation issues, generated device results

StudioService
- definitions, schemas, generators, input and assignment rules

BlueprintService
- blueprints, immutable revisions, topology graph, hierarchy objects
- resource allocations, routing zones, virtual networks, policies, active revision

ProvisioningAdapter
- map submitted changes to target CloudVision Actions or Classic Tasks

ChangeControlService
- plans, stages, approvals, schedules, execution, logs, audit
```

目标前端状态分层：

- URL：页面、对象 ID、Tab、可共享筛选。
- Server state：Inventory、Workspace、Build、Sync、Action/Task、Change Control。
- Local UI state：展开节点、Drawer、未保存表单、临时选择、画布 zoom。

建议稳定路由：

```text
/aidc/provisioning/studios
/aidc/provisioning/studios/:studioId?workspace=:workspaceId
/aidc/provisioning/workspaces
/aidc/provisioning/workspaces/:workspaceId/review
/aidc/provisioning/tasks/:taskId
/aidc/provisioning/change-controls/:changeControlId
```

Submit gate 至少为：

```text
Pending Workspace
AND synchronized with current Mainline
AND latest Build belongs to current revision
AND Build succeeded
AND no blocking errors
AND user has SubmitWorkspace permission
```

## 9. Intent Center 与 Templates & CLI

- Intent Center 只表达业务意图、选择 Studio、提出 Blueprint 变更并预填 Inputs/Assignments；它不拥有 Blueprint Active revision、设备配置，也不复制 Workspace、Tasks 或 Change Control。
- Studio Definition 是可复用网络能力定义；Fabric Blueprint 是具体 Site/Fabric 的长期期望状态实例；Workspace 才是修改 Blueprint 的候选事务。
- Templates & CLI 是高级配置来源，不宣称为 Arista Studio。它的变化必须汇入统一 Workspace、Build、Synchronize、Review、Submit 与受控执行生命周期。
- 在目标 CloudVision 使用 Actions 的场景中，不能为了适配 AMPCon 导航而人为复制一套可重复执行的 Task；产品层业务工单与平台 Action 必须有明确的一对一或一对多映射及幂等键。

## 10. AMPCon 信任机制：逐项对照 Arista

### 10.1 设计原则与证据等级

AMPCon 采用三层模型：

```text
Intent Center：业务对象与业务目标
→ Studios：网络工程模型、Inputs、Assignments
→ Workspace + Build + Change Control：校验、审批和执行信任链
```

字段使用以下证据标签：

- **[A-API]**：Arista Workspace API 中可直接确认的字段或枚举，AMPCon 应原样保存语义。
- **[A-DOC]**：Arista 官方文档/UI 可确认的对象、状态或操作语义；不同版本字段名可能不同。
- **[AMP]**：AMPCon 归一化字段或产品扩展，不宣称为 Arista 原生字段。
- **[DERIVED]**：只能由其他事实推导的 UI 状态，禁止作为独立可写事实保存。

最重要的信任规则是：**业务意图、候选设计、Build 结果、审批结果和设备运行事实必须分别存储，任何一层都不能越权修改下一层状态。**

### 10.2 信任链总表

| 信任环节 | 用户需要相信什么 | Arista 对照 | AMPCon 必须保存的证据 | 阻断条件 |
|---|---|---|---|---|
| 业务来源 | 需求来自谁、要求什么 | Studio 之前的业务层不是 CloudVision 核心对象 | Intent revision、提交人、来源系统、幂等键 | 来源无效、重复请求、必填业务参数缺失 |
| 设备身份 | 配置作用于正确设备和接口 | Inventory and Topology 是其他 Studios 的前置基础 [A-DOC] | Device/Interface canonical ID、观测来源、时间、连接证据 | 未注册设备、身份冲突、接口连接冲突 |
| 候选隔离 | 修改不会直接污染 Mainline | Workspace 隔离 Proposed Changes [A-DOC] | Workspace ID、base revision、current revision、modifications | 无 Pending Workspace、revision 冲突 |
| 配置生成 | 输入能生成确定的候选配置 | Configlet Build [A-API] | 生成结果、来源 Studio、输入 revision、执行 ID | 模板错误、输入错误、结果不可重现 |
| 校验 | 错误和风险被明确定位 | 四阶段 Build [A-API] | stage state、errors、warnings、infos、target/source | 当前 revision 未 Build 或存在阻断错误 |
| 并发同步 | 没有覆盖别人已提交的修改 | Synchronize Mainline [A-DOC] | base/current Mainline revision、冲突和合并结果 | Out of date、同步失败、未解决冲突 |
| 人工复核 | 人能看到实际将改变什么 | Workspace Review、Designed/Running diff [A-DOC] | 变更摘要、设备 diff、配置来源、风险确认 | Review 数据过期或 diff 不完整 |
| 提交 | 只有合格候选进入 Mainline | Submit Workspace [A-DOC] | submitter、submitted revision、提交时间、结果 | Build/Sync/RBAC 任一 gate 不通过 |
| 执行授权 | 设计提交不等于设备执行 | Provisioning Actions + Change Control [A-DOC] | Action plan、审批、排期、目标、stage | 未批准、审批失效、维护窗口不满足 |
| 运行闭环 | Running 是否真的收敛到 Designed | Configuration/Image compliance [A-DOC] | Action result、设备结果、Designed/Running revision、compliance | 执行失败、设备不可达、不合规 |
| 追责恢复 | 谁在何时做了什么 | RBAC、Change Control history/logs [A-DOC] | append-only audit、日志引用、补偿变更关联 | 审计缺失；不得把失败自动标记为已回滚 |

### 10.3 Intent Center：业务入口但不进入配置事实域

Intent Center 是 AMPCon 产品扩展，不是 Arista Workspace 的替代品。建议字段：

| 字段 | 等级 | 逻辑 |
|---|---|---|
| `intentId` | [AMP] | 全局不可变业务请求 ID |
| `intentType` | [AMP] | 如 `CreateGpuPod`、`ExpandStorageNetwork`、`CreateTenantNetwork` |
| `tenantId/projectId` | [AMP] | 业务归属；不能直接替代设备 Assignment |
| `requestedCapacity`、`sla`、`policyRefs` | [AMP] | 业务目标，不直接写设备 CLI |
| `sourceSystem`、`sourceRevision` | [AMP] | CMDB、云平台或人工入口及其版本 |
| `requestedBy`、`createdAt` | [AMP] | 请求人和时间证据 |
| `idempotencyKey` | [AMP] | 防止同一业务请求重复生成候选变更 |
| `status` | [AMP] | 只描述业务请求处理状态，不复用 Workspace/Build/Execution 状态 |

Intent 转换结果必须单独保存为 `StudioInvocationProposal`：`studioDefinitionId`、`inputPatch`、`assignmentProposal`、`mappingVersion`、`explanations[]`。用户确认后才写入 Workspace；Intent Center 不得直接 Build、Submit 或 Execute。

### 10.3.1 Fabric Blueprint：长期网络意图实例

Juniper Apstra 官方模型表明，Template/Reference Design 定义厂商无关的结构和 policy intent，Blueprint 将其实例化为具体 Fabric，并在同一长期范围内管理设备、资源、Routing Zones、Virtual Networks、staged changes、committed revisions 与持续分析。AMPCon 吸收的是这个**长期期望状态边界**，不是照搬 Apstra 的单一 staged area。

AMPCon 对象必须分开：

```text
StudioDefinition
- 可复用 Schema、生成逻辑、Assignment 规则、校验规则

FabricBlueprint
- 某个 Site/Fabric 的长期逻辑图与 Active desired state

Workspace
- 某次对一个或多个 Blueprint/Studio/Inventory 对象的短期候选事务

BlueprintRevision
- Build 生成并在 Submit 后成为 Active 的不可变 Blueprint 快照
```

建议字段：

| 对象 | 字段 | 信任规则 |
|---|---|---|
| `FabricBlueprint` | `blueprintId`、`displayName`、`siteId`、`blueprintType` | 稳定主键；一个 Blueprint 对应明确管理域 |
| `FabricBlueprint` | `referenceDesignId`、`templateVersion` | 记录实例从哪个厂商无关设计与版本产生 |
| `FabricBlueprint` | `activeRevisionId`、`lifecycleStatus` | 只指向已提交 revision；不保存 Workspace Build/审批状态 |
| `FabricBlueprint` | `inventoryScopeId`、`resourcePoolRefs[]` | 引用 canonical Inventory 和资源池，不复制设备身份 |
| `BlueprintRevision` | `revisionId`、`parentRevisionId`、`createdFromWorkspaceId` | revision 不可变，完整保留来源链 |
| `BlueprintRevision` | `topologyGraph`、`hierarchyObjects[]` | 保存 DC、Pod、Domain、Rack、角色和关系 |
| `BlueprintRevision` | `resourceAllocations[]` | ASN、IPv4/IPv6、VNI/VLAN 等确定性分配结果 |
| `BlueprintRevision` | `routingZones[]`、`virtualNetworks[]`、`policies[]` | Overlay、租户隔离和策略意图 |
| `BlueprintRevision` | `assignmentRefs[]`、`graphDigest` | 绑定逻辑角色与 Inventory 设备，支持完整性验证 |
| `BlueprintRevision` | `generatedConfigRefs[]`、`validationSummary` | 指向 Build 结果，不在 Blueprint 中复制日志正文 |

生命周期：

```text
Active BlueprintRevision N
→ Workspace 基于 N 保存候选修改
→ Build 生成 Candidate BlueprintRevision N+1
→ Synchronize/Review/Submit
→ N+1 成为 Active desired state
→ Provisioning Actions / Vendor Tasks
→ Change Control 执行
→ Running/Telemetry 映射回 Blueprint graph
→ 计算 drift、compliance 和 anomalies
```

与 Apstra 的重要差异：AMPCon 保留 Arista 式多 Workspace 并发与独立 Change Control。Blueprint 不提供绕过 Workspace 的直接 Commit。用户选择回到旧 revision 时，也必须创建新的补偿 Workspace，把旧 revision 作为恢复目标，重新 Build、审批和执行；历史 revision 不能直接改写设备。

当前 `AIDCL3LeafSpineFabric` 中的 DC、Pod、Domain、Inputs 和 Assignments 应视为未来 `FabricBlueprint` 的候选内容。现阶段它们仍是组件本地状态，尚未形成持久化 Blueprint 或 revision。

### 10.4 Inventory 信任：设备、接口和物理连接只有一个 owner

Arista 官方确认 Inventory and Topology 用于把设备纳入 Studios 并维护接口变化 [A-DOC]。AMPCon 归一化字段如下：

| 字段组 | 字段 | 规则 |
|---|---|---|
| 设备主键 | `deviceId`、`serialNumber/systemMac` | `deviceId` 为内部 canonical key；序列号/MAC 用于去重，不与 Fabric Node ID 混用 |
| 设备属性 | `hostname`、`managementIp`、`model` | 显示值可修改时必须形成 Workspace modification |
| 接口主键 | `interfaceId`、`deviceId`、`name` | 接口必须从属于唯一设备 |
| 连接 | `sourceInterfaceId`、`targetInterfaceId` | observed connection 只能由 Inventory 保存；Studio 只读投影 |
| 发现证据 | `source`、`observedAt`、`confidence` | discovery preview 不能直接当成 accepted connection |
| 候选状态 | `mainline/workspace-added/workspace-modified` | [AMP] Workspace view 状态，不是 Arista lifecycle 枚举 |
| Fabric 身份 | `role`、`roleSource`、`nodeId`、`autoNodeId`、`nodeIdSource` | [AMP] 当前实现扩展；Node ID 正整数、scope 唯一，可恢复自动值 |

Accept Network Update 必须记录 `updateId`、选择人、接受时间、目标 Workspace、原始观测和覆盖冲突；Accept 只产生 Workspace modification，不得直接改变 Mainline 或 Running。

### 10.5 Workspace 信任：候选事务、revision 与来源可追踪

Arista 文档确认 Workspace 可承载一个或多个 Studios 的修改并与 Mainline 隔离 [A-DOC]。AMPCon 统一字段：

| 字段 | 等级 | 规则 |
|---|---|---|
| `workspaceId` | [AMP normalized] | API、URL、关联关系使用稳定 ID |
| `displayName`、`description` | [AMP normalized] | 人可读名称，不作为关联键 |
| `lifecycleStatus` | [A-DOC] | 只允许 Pending、Submitted、Abandoned；Built 不能写入此字段 |
| `baseMainlineRevision` | [AMP normalized] | 创建/最近同步时的 Mainline 基线 |
| `revision` | [AMP normalized] | 每次 Inputs、Assignments、Inventory 或 CLI 变化递增 |
| `createdBy/createdAt`、`modifiedBy/modifiedAt` | [A-DOC]/[AMP normalized] | 操作者和时间证据 |
| `modifications[]` | [A-DOC]/[AMP normalized] | 保存 source type/id、target refs、change type 和前后值摘要 |
| `latestBuildId` | [AMP normalized；对应 `last_build_id` 语义] | 只能关联一次 Build run |
| `needsBuild` | [A-API：`needs_build`] | 修改 revision 后必须为 true；它不是 BuildState |

任何 Studio 保存都必须写入当前 Workspace，而不是写入 Studio 全局状态。一个 Workspace 可以包含多个 Studio/Inventory/Templates & CLI 来源，Review 必须按来源拆分。

### 10.6 Build 信任：精确状态、阶段和问题字段

Arista Workspace API 明确定义：

- `BuildState` [A-API]：`UNSPECIFIED`、`IN_PROGRESS`、`CANCELED`、`SUCCESS`、`FAIL`、`SKIPPED`。
- `BuildStage` [A-API]：`INPUT_VALIDATION`、`CONFIGLET_BUILD`、`CONFIG_VALIDATION`、`IMAGE_VALIDATION`。
- `needs_build`、`last_build_id` [A-API] 用于判断是否需要新 Build；`Build Required`、`Not Built` 是 [DERIVED] UI 状态。

AMPCon Build run 必须保存：

```text
buildId
workspaceId
workspaceRevision
state
startedAt / completedAt / canceledAt
requestedBy
stageResults[stage]
sourceRefs[] / targetDeviceIds[]
```

阶段字段对照：

| Stage | Arista API 可确认的结果字段 | AMPCon UI 要求 |
|---|---|---|
| Input Validation | `input_schema_errors`、`input_value_errors`、`input_warnings`、`hierarchy_errors`、`other_errors` | 定位到 Studio、Schema/Input path、Assignment 和修复入口 |
| Configlet Build | `generated_config`、`template_errors`、`input_errors`、`other_error`、`execution_id` | 显示配置来源、目标设备、生成日志引用；生成结果需与 revision 绑定 |
| Config Validation | `summary`、`errors`、`warnings`、`config_sources`、`only_filter_inputs_changed` | 展示设备级 diff、来源 Studio/CLI、阻断与非阻断问题 |
| Image Validation | `summary`、`errors`、`warnings`、`infos`、`image_input_error`、`image_source` | 无镜像变化可显示 Skipped，但不能显示失败 |

信任 gate：`latestBuild.workspaceRevision == workspace.revision` 且整体 `SUCCESS`、阻断错误为 0。Warning 可以与成功同时存在，但必须由用户在 Review 中看到；`SKIPPED` 是阶段状态，不是 Workspace lifecycle。

### 10.7 Synchronize 信任：并发变化不可静默覆盖

Arista Workspace 文档确认，Workspace 落后于 Mainline 时需同步，Review 应解释冲突和合并结果 [A-DOC]。AMPCon 字段：

```text
synchronizationId
workspaceId
workspaceRevisionBefore / workspaceRevisionAfter
baseMainlineRevision / targetMainlineRevision
status
resolvedConflicts[]
workspaceOnlyChanges[]
mainlineOnlyChanges[]
startedBy / startedAt / completedAt
resultingBuildId
```

UI 必须分别显示 `Current Workspace`、`Workspace Before Sync`、`Current Mainline`。自动采用 current-workspace-wins 时也必须记录冲突，不能静默覆盖。同步完成后产生新 revision 并触发新 Build；旧 Build 立即失效。

`Synchronization: Current/Out of date/Conflict` 是 [AMP normalized/DERIVED] 展示维度，不得混入 `lifecycleStatus` 或 `BuildState`。

### 10.8 Review 与 Submit 信任：人看到的必须等于提交的 revision

Review snapshot 必须固定以下字段，防止用户审完 A、系统提交 B：

| 字段 | 作用 |
|---|---|
| `workspaceId`、`workspaceRevision`、`baseMainlineRevision` | 锁定复核对象 |
| `buildId`、`buildState`、`buildRevision` | 证明 Build 属于同一 revision |
| `synchronizationStatus`、`targetMainlineRevision` | 证明基线最新 |
| `modifiedSources[]` | Inventory、Studios、Templates & CLI 的来源摘要 |
| `inputChanges[]`、`assignmentChanges[]`、`tagChanges[]` | 结构化修改明细 |
| `deviceConfigDiffs[]`、`imageChanges[]` | Proposed Designed 与当前 Running/Designed 的设备级差异 |
| `errors[]`、`warnings[]`、`acknowledgements[]` | 风险与人工确认 |
| `reviewedBy`、`reviewedAt` | 复核证据；revision 变化后失效 |

Submit 必须进行服务端原子 gate，而不是只依赖按钮禁用：Pending、已同步、当前 revision Build 成功、无阻断错误、有 Submit 权限。提交结果保存 `submittedRevision`、`submittedBy`、`submittedAt`、`mainlineRevisionBefore/After`、`generatedActionRefs[]`。Submit 后不能把设备状态显示为已执行。

### 10.9 Actions、Tasks 与 Change Control 信任

Arista 对照必须保留双路径：

```text
Studios → Workspace Submit → Set Configuration / Set Image Actions → Change Control
Classic Provisioning → Task → Execute Task Action → Change Control
```

AMPCon 可以保留面向用户的业务工单，但字段必须防止与 Arista Task 混淆：

| 字段 | 规则 |
|---|---|
| `workOrderId`、`workOrderType` | [AMP] 产品业务工单；UI 不标记为 Arista Task |
| `sourceWorkspaceId/revision` | 固定来源 revision，不允许执行时重新读取可变 Workspace |
| `platformObjectType`、`platformObjectRefs[]` | 明确映射到 Action 或 Classic Task |
| `idempotencyKey` | 同一 submitted revision + target + operation 只能创建一次 |
| `targetDeviceIds[]`、`diffDigest` | 执行目标和差异摘要不可变 |
| `changeControlId` | 只说明已纳入计划，不代表已批准或成功 |

Change Control 统一字段：

```text
changeControlId / displayName / description
sourceRefs[] / actionRefs[] / targetDeviceIds[]
planRevision
stages[] / subStages[] / executionMode
approvalStatus / approvals[] / approvalPolicy
scheduledAt / maintenanceWindow
executionStatus / startedAt / completedAt
results[] / logRefs[] / auditRefs[]
createdBy / modifiedBy / modifiedAt
```

这些是 AMPCon 归一化字段；Change Control 状态值由目标平台 adapter 映射，未核实前不得把 Draft、Approved、Scheduled 等写成 Arista API 的完整正式枚举。任何 `planRevision`、Action 集、目标范围或执行顺序变化都使既有审批失效。

### 10.10 RBAC、职责分离与审计

每个可变操作都必须返回服务端 `allowed` 和 `denialReason`：

- Workspace：Create、Edit、Build、Synchronize、Submit、Abandon、Delete。
- Inventory/Studio：Accept、Assign、Override Node ID、Modify Connection、Save Inputs。
- Change Control：Create、Modify Plan、Request Approval、Approve/Reject、Schedule、Execute、Cancel。

用户、角色和模块权限属于 Arista 官方确认的 RBAC 语义 [A-DOC]；AMPCon 还应支持职责分离：提交人、计划最后修改者和审批人按策略不能是同一人。审批保存 approver、decision、comment、policy、planRevision、timestamp；planRevision 变化后状态变为 Invalidated，而不是沿用旧批准。

审计记录必须 append-only：`eventId`、`objectType/id`、`objectRevision`、`action`、`actorId`、`actorRoles`、`timestamp`、`beforeDigest/afterDigest`、`requestId`、`result`、`reason`。前端活动时间线不是审计事实源。

### 10.11 Designed、Running 与 Compliance 闭环

Arista 官方确认 CloudVision 持续比较 Designed 与 Running，并计算配置与镜像 compliance [A-DOC]。AMPCon 设备闭环字段：

```text
deviceId
designedRevision / designedDigest
runningRevision / runningDigest
configurationCompliance / imageCompliance
lastComparedAt
changeControlId / actionId
executionResult / failureCode / logRef
```

状态规则：

- Workspace Pending：只有 Proposed，不改变 Designed 或 Running。
- Submit Succeeded：更新 Designed/Mainline，不更新 Running。
- Change Control Running：显示执行中，不提前显示 Compliant。
- Action Succeeded 且重新采集 Running 后：重新计算 compliance。
- 执行成功但 Running 尚未确认：显示 `Verification pending` [AMP]，不能显示完成闭环。
- 不合规必须能回溯到 Designed revision、最近 Action 和设备观测时间。

### 10.12 失败、重试与回滚

失败记录至少包含 `stage/action`、`deviceId`、`attempt`、`startedAt/completedAt`、`failureCode`、`message`、`logRef`、`retryable`。重试必须复用原执行目标和幂等键，并生成新的 attempt，不覆盖失败证据。

除非目标平台明确返回已执行回滚及验证结果，否则 AMPCon 不得显示 `Rolled back`。默认恢复方式是创建关联原 Change Control 的补偿 Workspace/Change Control，保存 `remediatesChangeControlId`、恢复目标 revision、重新 Build、审批和执行。

### 10.13 前端状态派生规则

以下标签只能派生，不可由页面直接写入：

```text
Build Required = needsBuild == true
Build Current = latestBuild.workspaceRevision == workspace.revision
Submit Ready = Pending && Sync Current && Build Current/Success && blockingErrors == 0 && RBAC allowed
Execution Planned = changeControlId != null
Execution Approved = approval valid for current planRevision
Execution Complete = all required Actions terminal-success && device verification complete
Compliant = latest observed Running matches current Designed under managed scope
```

这套规则是 AMPCon 的核心信任合同：每个绿色状态都必须能展开看到来源对象、revision、时间、操作者和底层证据，不能由静态文案或组件本地 boolean 产生。

## 11. 可访问性与视觉基线

`provisioning.css` 使用 `.provisioning-readable` 隔离 Provisioning 视觉规则：

- 字体密度按用户认可的浏览器 80% 视觉比例校准。
- muted text、主色文字和白字按钮采用更高对比颜色。
- 表单控件最小高度 32px；按钮和可点击目标最小 24px；Checkbox/Radio 为 18px。
- 所有交互控件提供高对比 `focus-visible`。
- 支持 `prefers-reduced-motion` 与 forced colors。
- 导航、状态、元数据、面包屑等应单行显示；空间不足时截断或横向滚动，正文描述可换行。

## 12. 当前实现验收标准

1. 正式 Sidebar 入口显示 Studios、Workspaces、Tasks、Change Control，Studios 分发到 `AIDCStudio2`。
2. Inventory and Topology 固定为 Foundation；没有 Workspace 时不可修改。
3. Accept Network Update 只写入当前 Workspace view，不进入 Mainline。
4. Inventory 是设备、Role、Node ID 和 observed connection 的唯一 owner。
5. Fabric Node ID Override 必须是正整数且在当前 Inventory scope 唯一，并可恢复自动值。
6. L3 Studio 只读引用 Inventory Role/Node ID；DC、Pod、Domain、Inputs 和 Assignments 由 L3 Studio 拥有。
7. DC、Pod、Domain 支持创建、配置、删除和保存；Default 节点不被描述为 Inherited。
8. 阻断错误和 warning 按 §5.4 规则显示；状态点固定在树行最右列。
9. Topology 父区域包含所有子内容；Pod 横向排列；每个 DC 最多展开两个 Pod。
10. L3 planned links 为灰色实线；Inventory discovery preview 才使用虚线。
11. 跨层与同层连接端点遵循统一边缘规则；端口标签不会在密集拓扑中全量堆叠。
12. 当前配置区域绿色高亮，其他区域灰色；完整结构保持可见。
13. UI 使用 `.provisioning-readable` 范围内的对比度、焦点和操作目标基线。
14. 文档和 UI 均明确当前 Build、Submit、Tasks、Change Control 是原型边界，不声称已完成后端闭环。
## 13. Network Design 四步流程与统一配置预览

Network Design 是 Workspace 之前的技术设计与配置源编排入口，固定为四步：

```text
1. Fabric Design：只定义 Planned Node、Design Role 和 Expected Relationship
2. Reconcile：读取共享 Inventory/LLDP，完成 Planned ↔ Registered Assignment
3. Configuration Scope：选择 Solution Profile、Studios 和独立 Advanced Sources
4. Configuration Preview：自动汇总 Designed，并按设备与 Running 做轻量对照
→ Submit to Workspace
```

### 13.1 所有权与 Solution Target Manifest

Inventory 唯一拥有 Registered Device、设备身份、Model、真实接口、Role、Node ID、accepted LLDP 与 Network Updates；Network Design 拥有 Planned Node、Expected Relationship、Assignment、Reconcile 结果和配置源编排。两者不能复制事实。

`Fabric Design + Reconcile Result` 生成 AMPCon 扩展对象 `SolutionTargetManifest`，至少记录 Design Revision、Inventory Revision、Planned Nodes、Assignments、Expected Relationships、Resolved Interfaces 和 Findings。Studio 与 Templates & CLI 都引用同一 Manifest 确定 Effective Scope；它不是 Arista 原生对象，也不代替 Workspace revision。

### 13.2 Reconcile 门禁

- 硬门禁：设备身份重复或失效、同一 Registered Device 重复 Assignment、同一物理端口被多个连接占用。存在任一硬冲突时，`Complete with Findings` 也不可绕过。
- 软 Findings：设备尚未分配、预期 LLDP 未形成、存在未预期 LLDP。可以进入 Workspace，但 Deployment Readiness 必须保持阻塞。
- `Accept & Assign` 是 AMPCon 组合动作：先把证据写入共享 Inventory，再建立 Network Design Assignment。若 Inventory 接受成功但映射失败，显示 `Accepted · Assignment Required`。

### 13.3 Configuration Scope 与高级来源

AIDC、IDC、Campus 的 Solution Profile 只负责推荐 Studio；推荐项默认选中但可取消，已经应用的 Studio 锁定并回到 owning Studio/Workspace 修改。Templates & CLI 是独立 `Advanced Configuration Source`，不进入 Studio 推荐、不继承 Studio Inputs；它只通过 Solution Target Manifest 获取目标，并在正式 Workspace Build/Diff 中与 Studio 输出统一检测重叠和冲突。

### 13.4 Configuration Preview 边界

Configuration Preview 进入第 4 步后自动生成，不要求用户点击 Generate。页面只展示 Designed 与 Running，不展示 Mainline：

- `Configuration Contributions`：按 Studio/Advanced Source 展示 Scope、Generated Output 和 Source State，并提供来源搜索与 `Changes only`。Review 直接下钻到设备，使用 `Designed Contribution / Running Configuration` 对比该来源拥有的配置行；它不是设备完整合并配置。
- `Device Configuration Review`：唯一设备列表，提供 Search、Changes only，并在 Review 弹窗中并排展示 Designed/Running。
- Preview 是 Network Design 的非权威轻量编译结果；正式 Build、Validation、权威 Diff、Synchronize 和 Submit 仍由新建或打开的 Workspace 负责。
- Network Design 只有在 Reconcile 完成且 Preview 成功后才允许 `Submit to Workspace`；Submit 在此处表示创建/打开 Workspace，不表示更新 Designed，更不表示设备已执行。

## 14. 后续优先级

| 优先级 | 工作项 | 完成定义 |
|---|---|---|
| P0 | 统一 Workspace store/API | Inventory 与 L3 修改形成同一 Workspace revision，刷新可恢复 |
| P0 | 真实 Build | 四阶段状态、问题定位、生成结果与 revision 绑定 |
| P0 | Synchronize/Submit | Mainline freshness、冲突详情、权限 gate、提交结果完整 |
| P0 | Provisioning Adapter | 明确 Studios Actions 与 Classic Tasks 的平台映射和幂等性 |
| P1 | Change Control 后端 | 审批、排期、执行、日志、失败结果、审计 |
| P1 | 稳定路由 | 对象 deep link、刷新恢复、跨页一致 ID |
| P1 | 清理旧入口 | 删除或重定向 `studios → AIDCProvisioning` |

## 15. 官方资料与版本说明

本次更新复核了以下当前官方入口：

- [CloudVision Workflow Overview](https://www.arista.com/cg-cv/cv-workflow-overview)：Workspace 承载一个或多个 Studios 的修改，提交后进入 Change Control 审批/执行流程。
- [Built-in Studios](https://www.arista.com/cg-cv/cv-built-in-studios)：Inventory and Topology 接受设备和接口变化，并把设备纳入 Studios 配置范围。
- [CloudVision Studios](https://www.arista.com/cg-cv/cv-cloudvision-studios)：Studios 用于定义和管理网络功能配置。
- [CloudVision Key Terms](https://www.arista.com/cg-cv/cv-key-cvp-terms)：Task 是针对设备采取操作的 work order。
- [CloudVision Compliance](https://www.arista.com/cg-cv/cv-network-compliance-cvp)：持续计算配置、镜像和扩展的 compliance。
- [CloudVision User Accounts](https://www.arista.com/cg-cv/cv-managing-user-accounts)：用户可用模块和操作由分配角色决定。
- [Change Control Permissions](https://www.arista.io/help/articles/settings-access-management-roles-change-control)：Change Control 操作可用性和审批受权限策略控制。
- [Workspace API](https://aristanetworks.github.io/cloudvision-apis/trunk/models/workspace.v1)：BuildState、BuildStage、`needs_build`、`last_build_id` 与阶段结果结构。
- [Arista Studios Quick Actions Lab](https://labguides.testdrive.arista.com/2024.3/campus/studios_quickactions/)：设备需先通过 Inventory and Topology 纳入 Studios 管理。
- [Juniper Apstra Templates](https://www.juniper.net/documentation/us/en/software/apstra6.1/apstra-user-guide/topics/concept/templates.html)：Template 定义厂商无关的网络结构、能力和 policy intent，并用于创建 Blueprint。
- [Juniper Apstra Blueprint Commit/Revert](https://www.juniper.net/documentation/us/en/software/apstra5.0/apstra-user-guide/topics/task/blueprint-commit-revert.html)：Blueprint 修改经过 staged、Commit 和 revision 管理。
- [Juniper Apstra Time Voyager](https://www.juniper.net/documentation/us/en/software/apstra4.2/apstra-user-guide/topics/concept/time-voyager.html)：保留 Blueprint revisions 并支持选择历史网络状态。
- [Juniper Apstra Intent-Based Analytics](https://www.juniper.net/documentation/us/en/software/apstra6.0/apstra-custom-telemetry-collection-guide/topics/concept/apstra-telemetry-and-intent-based-analytics.html)：把 Blueprint intent 与 Telemetry 结合进行运行状态分析。

用户截图仍是页面层次、标签、表格列和控件位置的首要视觉依据。截图与当前文档语义不同时，保留截图视觉目标，但按当前文档解释对象边界，并标记为 CloudVision 版本差异。

> 许可合规说明：以上官方内容均为归纳和改述，未复制官方长段原文。Content was rephrased for compliance with licensing restrictions.

## 16. 变更记录

| 版本 | 日期 | 变更 |
|---|---|---|
| v1.4 | 2026-08-21 | 增加 Network Design 四步流程、Inventory/Design 所有权、共享 Solution Target Manifest、Reconcile 硬门禁与软 Findings、Configuration Preview、来源可搜索的 Configuration Contributions 与 Designed Contribution/Running Configuration 影响对比、Device Configuration Review 和 Templates & CLI 高级来源边界 |
| v1.3 | 2026-08-19 | 补充 Juniper Apstra Blueprint 抽象；明确 Studio Definition、Fabric Blueprint、Workspace 和 BlueprintRevision 边界，引入长期拓扑图、资源分配、Active revision、运行验证与补偿恢复模型 |
| v1.2 | 2026-08-19 | 确定“业务入口 + Studio 工程工作台 + Workspace/Change Control 信任机制”；按 Arista API/官方文档逐项校准 Inventory、Workspace、Build、Synchronize、Review、Submit、Actions/Tasks、Change Control、RBAC、Compliance、失败与回滚逻辑和字段 |
| v1.1 | 2026-08-18 | 按当前代码重写实现逻辑；区分 Arista Studios Actions、Classic Tasks 与 AMPCon mock；补充共享 Inventory、Canonical Node ID、L3 层级、Topology 算法、可访问性和原型边界 |
| v1.0 | 2026-08-14 | 初版 Arista 配置逻辑与 AMPCon 产品设计 |
