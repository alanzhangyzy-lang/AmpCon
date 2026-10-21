# STD-AI-006 VLAN Services 软件需求规格说明书（当前实现基线）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-VLAN-SERVICES-001 |
| Studio ID | `STD-AI-006` |
| Studio 名称 | `VLAN Services` |
| 版本 | v2.2 |
| 日期 | 2026-10-20 |
| 状态 | Implementation baseline / Draft |
| 适用产品 | AmpCon-DC AIDC Network |
| 实现依据 | `components/apps/AIDCVlanServicesStudio.tsx` |

## 1. 文档目的与范围

本文档描述当前代码库中 `VLAN Services` 的**实际前端行为**，并将尚未实现的 CloudVision 生命周期能力明确列为缺口；它不将目标态能力描述为已交付能力。

`VLAN Services` 是 AmpCon 的 AIDC 配置原型，不是 Arista CloudVision 原生 Studio。它在当前实现中维护本地 `VlanServicesDraft` 草稿，包含 Network VLAN/SVI、VLAN Service Profile、设备/接口 Profile 归属和 Direct 接口覆盖值。

### 1.1 当前版本与截图差异

当前主界面是 **Device & Interface** 的设备、端口及 Profile 管理视图。已选 Profile 的端口配置字段保持只读；将端口 Profile 设为 `None` 后，该端口按 Direct 方式允许编辑 Description、Port Mode、VLAN/Native VLAN、Allowed VLANs 和 MTU。

此前截图所示“这里不允许单独对接口配置进行编辑，只能应用模板”与当前实现不一致。该截图对应的限制已被撤回；本 SR 以当前代码行为为准，而非以该截图中的限制为准。

### 1.2 CloudVision 生命周期边界

Arista CloudVision 的官方 Workflow 将 Workspace 用于承载 Studio 变更，提交后由 Change Control 审批或拒绝；Change Control 可关联任务并在执行时提供配置会话/回退上下文。当前 VLAN Services 前端**没有**这些后端对象或调用，因此不可把“Saved”或本地时间戳解释为 CloudVision Workspace 保存、Build、Submit、Task、Change Control 执行、回滚或 Running/Compliance 回采。

- 当前实现：本地草稿状态、前端校验、500 ms 防抖自动写回父级 draft、显示本地 `lastAppliedAt` 时间。
- 未实现：Workspace revision/baseline/ETag、服务端 RBAC、Build、不可变 Review revision、Submit、Tasks 映射、Change Control、执行、回滚和 Running/Compliance 回采。
- Intent Center 仅应表达业务意图并调用 Studio；Templates & CLI 应作为独立高级配置源汇入共同生命周期。上述集成属于后续实现，不由本组件模拟。

官方语义参考：[Arista CloudVision Workflow Overview](https://www.arista.com/jp/cg-cv/cv-workflow-overview?searchword=cv%20overview)、[Arista CloudVision Change Control](https://www.arista.com/zh/cg-cv/cv-using-the-change-control-module?searchword=cv%20task%20management%20cvp)。内容已按许可要求转述。

## 2. 当前数据模型与对象边界

### 2.1 草稿对象

| 对象 | 当前字段/用途 | 当前持久化语义 |
|---|---|---|
| `VlanServicesDraft` | 配置名称、Fabric ID、Profile 集合、Network 默认值、`networkSviBindings`、`directInterfaceAssignments`、`lastAppliedAt` | 通过 `onDraftChange` 写入父组件状态；无服务端 API。 |
| `VlanService` | Profile 名称/说明、Access 或 Trunk、VLAN、Allowed VLAN、MTU、SVI bindings、步长、设备顺序、设备与接口归属 | 作为草稿内嵌 Profile 保存。 |
| `VlanSviBinding` | VLAN ID、描述、SVI IPv4/CIDR、步长、M-LAG 与两节点地址 | Network 与 Profile 分别维护，当前没有统一服务端对象。 |
| `VlanInterfaceAssignment` | `deviceId`、`interfaceNames`、可选字段 override、`assignmentScope` | 表示某个 Profile 或 Direct 的接口范围。 |
| `VlanInterfaceOverride` | Description、模式、VLAN、Allowed VLAN、Gateway、MTU 的覆盖字段 | 当前 Active UI 仅让 Direct 端口编辑；Profile override 数据结构存在但无完整编辑界面。 |

### 2.2 事实源和当前限制

- 设备来自 `inventoryState.registered`，显示 hostname、management IP、model、role 和接口数量。
- 已发现接口名来自拓扑连接；同时会按设备接口数生成 `Ethernet1` 至 `EthernetN`（最多 128 个）候选名。
- M-LAG 分组优先来自 `fabricState` 中标记为 M-LAG 的 domain；当前还存在以 `AIDC-GPU-Leaf-01/02` 名称推测 `assumed-gpu-mlag-101` 的前端兜底。
- 当前没有 canonical interface ID、接口能力目录、breakout、平台能力交集、外部 Studio/Intent/Templates & CLI ownership 或服务端权限事实源。

因此，生成的 `EthernetN` 在当前 UI 可直接用于选择；它不是经过 CloudVision Inventory/Capability/Build 证实的 canonical interface。

## 3. 页面结构与状态

```text
VLAN Services
├─ Workspace 选择与本地保存状态
├─ Configuration
│  ├─ VLAN Service Profiles（列表/详情代码存在，若干编辑入口当前禁用）
│  └─ Network
│     ├─ Workspace Network VLAN/SVI bindings
│     └─ 已选 Profile 的只读 Network 视图
└─ Device & Interface
   ├─ Select Devices 对话框
   ├─ 选中设备/M-LAG 列表
   └─ 接口表：Profile 继承或 Direct 编辑
```

### 3.1 Workspace 门禁与本地保存状态

1. 用户从 `AIDC_WORKSPACE_OPTIONS` 选择非空 Workspace 后，主要可写控件才可用。
2. 每次 `commit` 都会清空 `lastAppliedAt`，并将更新交给 `onDraftChange`。
3. 草稿通过本地校验后，会在 500 ms 防抖后写入当前浏览器时间作为 `lastAppliedAt`。
4. 头部可显示 `Saving...`、`Unsaved changes`、`Saved` 或 `Not saved`。其中 `Saved` 仅表示当前前端草稿已自动写回父级状态，不代表设备或 CloudVision Workspace 已保存。
5. `Review Workspace` 按钮当前固定禁用；即使提供 `onReviewWorkspace` 回调，也不会从 UI 调用。

### 3.2 当前状态定义

| 显示状态 | 当前含义 | 不代表 |
|---|---|---|
| `Not saved` | 该草稿尚未记录本地 `lastAppliedAt`。 | CloudVision 未保存或未部署的权威状态。 |
| `Unsaved changes` | 草稿正在变更或本地校验未通过。 | revision 冲突、Build 失败或设备差异。 |
| `Saved` | 自动保存逻辑写入了浏览器时间。 | Workspace revision、Build 完成、Submit 或执行完成。 |
| `Mixed` | 设备列表摘要中的多个有效值。 | 可提交配置值。 |

## 4. 当前功能需求

### SR-VLAN-001：VLAN Service Profiles

#### 4.1 当前可见行为

| 功能 | 当前行为 | 限制 |
|---|---|---|
| Profile 列表 | 可搜索、自然排序、查看名称、描述、模式、VLAN、Allowed VLAN、SVI 及编辑入口。 | 只呈现草稿对象，无 revision 或服务端查询。 |
| 打开 Profile | 点击名称或 Edit 进入 Profile Configuration。 | 不做引用、权限或版本检查。 |
| Create Profile | 选择 Workspace 后可创建，并进入新 Profile 配置页。 | 新 Profile 保留可识别的默认名称；VLAN、Native VLAN、MTU、SVI binding 与 Gateway 为空，需由用户填写。 |
| Delete Profile | 删除函数存在并会使用浏览器确认框。当前最终 UI 的 Delete 按钮为 `disabled={true}`。 | 没有引用影响预览、原子服务端事务或外部引用检查。 |
| 基础字段编辑 | 未被设备或接口 assignment 引用的 Profile，可在已选 Workspace 中编辑名称、说明、Port Mode、MTU、VLAN、Native VLAN、Allowed VLAN 及 Gateway List 字段。 | 已被引用的 Profile 保持只读，避免改变现有接口继承值；当前无引用影响预览或版本控制。 |

#### 4.2 Profile 默认值和派生逻辑

初始草稿的 `createService(index)` 仍使用 Access、`VLAN 100 + index × 10`、MTU 9216 和一条空 SVI binding，作为初始 `VLAN Service Profile 1` 的演示基线。用户通过 Create Profile 新增的对象改用 `createBlankService(index)`：保留默认名称与 Access 模式，但 VLAN、Native VLAN、MTU、SVI binding 与 Gateway 均为空。两种名称规则都只按当前 Profile 个数生成，不保证删除后重建仍唯一。

Profile 的有效值算法仍存在：

```text
Profile 字段 override（若存在）
→ 顺序派生的 VLAN/Gateway（若启用 step）
→ Profile 基础值
```

- `vlanStepEnabled` 启用时：基础 VLAN 加上 `allocationIndex × vlanStep`。
- `gatewayStepEnabled` 启用时：以 IPv4/CIDR host 值为基础，按 `allocationIndex × gatewayStep × 子网大小` 计算。
- 有效 M-LAG Pair 的两台设备共用 allocation index。
- `assignmentScope === 'interface'` 时，接口名排序后的 offset 会参与 allocation index。

当前 UI 未完整展示 Base/Generated/Override/Effective 的分层来源，也没有 Reset-to-inherited 或 Explicit Clear 操作。

### SR-VLAN-002：Workspace Network 与 VLAN/SVI Bindings

#### 4.3 Network 视图

当已选择 Workspace 且未处于 Profile 只读视图时，Network 区可维护 `networkSviBindings`。

| 控件/字段 | 当前交互 | 校验/限制 |
|---|---|---|
| VLAN Ranges | 只读汇总已配置 VLAN ID。 | 汇总为合并后的连续范围文本。 |
| Add VLAN | 新增一条空的 Network binding。 | Workspace 未选择或正在查看 Profile 时禁用。 |
| Delete VLAN | 删除已勾选 binding。 | 保留至少一条 binding；查看 Profile 时禁用。 |
| VLAN ID | 直接编辑 1–4094。 | Gateway 存在时 VLAN 必填；不可与其他 Network binding 重复。 |
| Description | 可编辑。 | 无额外长度/能力校验。 |
| SVI IP | 可编辑 IPv4/CIDR。 | 必须为可用主机地址；不可重复。空值表示 L2-only。 |
| M-LAG | 有 SVI IP 时可开关。 | 开启时计算默认 Node 1/Node 2 地址；节点地址当前无完整设备能力校验。 |
| Batch Add VLAN | 对话框和批量生成函数存在。 | 对话框中的提交按钮当前固定禁用，不能从 UI 执行批量添加。 |

#### 4.4 Network 与 Direct 默认值

Direct 端口以 Network 值作为初始有效值：

- Port Mode：`networkPortMode`，默认 `access`。
- Access VLAN 或 Native VLAN：首条 `networkSviBindings` 的 VLAN ID。
- Allowed VLANs：`networkAllowedVlans`。
- Gateway：第一条具有非空 gateway 的 Network binding。
- MTU：`networkMtu`，默认 9216。

用户对 Direct 端口写入的字段放入 `directInterfaceAssignments.overrides`，并覆盖相应 Network 默认值。

### SR-VLAN-003：Select Devices

#### 4.5 对话框与选择规则

`Select Devices` 在已选 Workspace 时可由 Device & Interface 页的 `Select Devices` 按钮打开。

| 功能 | 当前行为 |
|---|---|
| 设备搜索 | 按 hostname 或 management IP 搜索。 |
| 设备排序 | hostname 或 management IP 升/降序。 |
| 角色筛选 | UI 状态和过滤逻辑支持 All、Spine、Leaf；当前对话框仍以已有设备数据为准。 |
| M-LAG | 有效 Pair 选择一个成员时联选两个成员；分配顺序中共用一个 unit。 |
| 接口候选 | 使用**第一台选中设备**的 observed/generated 接口名，不计算全部目标设备交集。 |
| 已分配资源 | 已被 Profile 或 Direct 使用的接口会显示 owner 并锁定；设备 scope 已占用时也会锁定。 |
| 应用 Profile | 当前对话框只显示 Device Profile 下拉框；Apply 要求至少选择设备、接口和非 `None` Profile，并按 device scope 调用。 |
| 清理 Profile | 可打开 Clear Profile 对话框并移除选定/全部已应用 Profile 的设备与接口范围。 |

当前 Device Profile 的 device-scope Apply 若用户未选接口，会回退为设备的全部可用 generated/observed 接口。因此它不满足“必须先明确选择接口”的目标态要求。

### SR-VLAN-004：Device & Interface

#### 4.6 设备列表

页面只显示已有 Profile assignment 或 Direct assignment 的设备；它不是完整 Inventory 浏览器。

| 列 | 当前显示/行为 |
|---|---|
| Device | 选择框、hostname、model 与配置入口。有效 M-LAG Pair 可联选。 |
| Management IP | Inventory 管理地址；缺失时显示 `-`。 |
| M-LAG Pair | `M-LAG 01` 等本地生成显示 ID；无 Pair 时 `-`。 |
| Port Mode | 已配置接口的有效值摘要；多个值显示 `Mixed`。 |
| VLAN / Native VLAN | 已配置接口摘要。 |
| Allowed VLANs | Trunk 接口值摘要。 |
| SVI IP | 已配置接口 gateway 摘要。 |
| MTU | 已配置接口摘要。 |
| Profile | Profile 名称或 `None`。 |
| Operation | 打开设备/接口配置视图。 |

#### 4.7 Profile 端口与 Direct 端口

主 Device & Interface 表中，端口按当前归属展示：

| 项目 | 已应用 Profile 的端口 | `None` / Direct 端口 |
|---|---|---|
| Description | 只读。 | 可在选中 Workspace 时编辑。 |
| Port Mode | 只读。 | 可编辑 Access/Trunk。 |
| VLAN / Native VLAN | 只读。 | 可从既有 Network VLAN 选择。 |
| Allowed VLANs | 只读；仅 Trunk 显示。 | Trunk 可从既有 Network VLAN 多选。 |
| SVI IP | 只显示 Profile/Direct 的 SVI 摘要。 | 当前主表无单端口 SVI IP 输入框。 |
| MTU | 只读。 | 可编辑。 |
| Profile 下拉框 | 可切换到另一个 Profile 或 `None`。 | 可分配已有 Profile。 |

Profile 端口使用 `locked = Boolean(portProfile)` 保护上述字段。切换某端口的 Profile 时，当前逻辑会先从其余 Profile 和 Direct assignment 中移除该端口，再加入目标 Profile 或 Direct assignment。对有效 M-LAG Pair，该操作会同时处理 peer 的同名端口。

Direct 端口的编辑写入 `directInterfaceAssignments`。当前没有 Direct Remove、Reset、迁移预览或确认步骤；将 Profile 改为 `None` 即可产生 Direct 归属。

#### 4.8 M-LAG 当前约束

当前实现具备以下前端行为：

- 有效 Pair 是恰好两台、均能在 Inventory 找到的分组。
- 选择设备与进行 Profile 切换时可联动 Pair 成员。
- Profile effective value 的 VLAN/Gateway sequence 对 Pair 共用 index。
- 若 Profile binding 启用了 M-LAG，则可按成员位置选取 Node 1 或 Node 2 SVI 地址。
- 本地校验会检查 Profile M-LAG Pair 的完整性、接口范围和关键 Profile 值的对称性。

以下能力未实现，不能视为当前约束已满足：Fabric peer health、Leaf role、读写权限、共同 canonical interface、接口能力交集、Direct 关键字段的双端对称校验/联写，以及服务端原子性。

## 5. 当前本地校验与错误处理

### 5.1 已实现的本地校验

`validationErrors` 会阻止本地自动保存，并汇总以下检查：

1. 至少存在一个 Profile；Profile 名称经 trim/lowercase 后不可重复。
2. Profile 与 Network binding 的 VLAN ID 必须在 1–4094；同一集合内不可重复。
3. SVI gateway 必须是 IPv4/CIDR 可用主机地址；Network 内 gateway 不可重复。
4. M-LAG binding 开启时需要 gateway，且 Node 1/Node 2 地址必须可解析并处于同一子网。
5. Port Mode 必须为 Access 或 Trunk；MTU 在 1500–9216；Access/Trunk 所需 VLAN 字段会被检查。
6. VLAN Step 与 Gateway Step 的范围为 1–100；派生 VLAN 或 IPv4 地址空间溢出会报错。
7. 已引用设备必须存在；assignment 必须有至少一个接口；同一设备/接口不可属于多个 Profile。
8. Profile 场景下有效 M-LAG Pair 的成员、接口范围及关键有效值必须保持对称。

### 5.2 当前已知校验缺口

| 领域 | 当前缺口 |
|---|---|
| Direct | Direct 只检查显式 override；Trunk Direct 不强制非空 Allowed VLAN，且没有 Direct M-LAG 对称校验。 |
| 能力 | 无接口存在性、breakout、模式、VLAN、SVI、MTU 的平台 capability 校验。 |
| Ownership | 无其他 Studio、Intent Center、Templates & CLI 的 ownership/冲突检查。 |
| 权限 | 无 Workspace、设备、接口或对象 RBAC。 |
| 并发 | 无 revision、ETag、基线或冲突合并。 |
| Build | 无 CloudVision Workspace Build 或服务端权威复核。 |

### 5.3 用户可见提示

当前界面可显示字段内红色错误（例如重复 VLAN、无效 SVI IP、Step 范围）和顶部 validation item 数量。异常处理仅限本地状态；没有网络请求超时、权限拒绝、服务端冲突或回滚反馈。

## 6. 未实现项与后续目标

下表记录现有 SR v2.1 中的目标态要求。它们仍可作为后续产品目标，但不是当前交付行为。

| 编号 | 目标能力 | 当前状态 |
|---|---|---|
| GAP-001 | Workspace revision、baseline、ETag、可写状态和服务端 RBAC。 | 未实现；仅使用非空 Workspace 字符串作为门禁。 |
| GAP-002 | 原子 Save/Apply、固定 revision Review/Submit、CloudVision Build。 | 未实现；本地 autosave 只更新时间戳，Review 固定禁用。 |
| GAP-003 | Change Control、Tasks 映射、执行、回滚、Running/Compliance 回采。 | 未实现。 |
| GAP-004 | Profile 删除影响预览、引用定位与服务端原子事务。 | Create 与未引用 Profile 的字段编辑已可用；Delete 入口仍禁用，且无影响预览或服务端事务。 |
| GAP-005 | 所有目标设备的 canonical interface、Presence 和 Capability Intersection。 | 未实现；接口候选仅取第一台选中设备的名字。 |
| GAP-006 | 可见的 interface-scope Profile picker、scope 预览和显式接口 Apply。 | 部分状态/函数存在；当前 UI 仅提供 Device Profile 下拉框。 |
| GAP-007 | Profile Base/Generated/Override/Effective/Value Source 展示，Override 编辑、Reset 和 Explicit Clear。 | 数据算法部分存在；主 UI 未提供完整操作。 |
| GAP-008 | Direct Remove/Reset、Direct→Profile 迁移预览与确认。 | 未实现；切换 Profile 当前会本地静默移除旧归属。 |
| GAP-009 | Direct M-LAG 关键字段双端联写与对称/能力/权限校验。 | 未实现。 |
| GAP-010 | 与其他 Studio、Intent Center、Templates & CLI 的配置 ownership/冲突检查。 | 未实现。 |

## 7. 评审结论

| 范围 | 当前结论 |
|---|---|
| Network VLAN/SVI 编辑 | 可作为本地草稿编辑使用；单条 Network binding 的主要字段可编辑。 |
| Profile 生命周期 | 可创建新的空配置 Profile，并可编辑未引用 Profile 的字段；Delete、引用影响预览和服务端原子性仍未实现。 |
| Device & Interface | 当前 UI 可选择设备和接口、应用 Profile，并对 Direct 端口编辑部分二层参数。 |
| 接口独立编辑 | 与旧截图的“仅模板”不同：Direct 端口当前可独立编辑；Profile 端口保持继承锁定。 |
| M-LAG | 有前端联选、序号和部分对称检查；非权威 Fabric/capability/RBAC 实现。 |
| CloudVision 流程 | 仅保留术语和未来边界；未接入 Workspace Build、Review/Submit、Tasks 或 Change Control。 |

## 8. 评审待确认项

| 编号 | 待确认项 | 建议 |
|---|---|---|
| OI-001 | 产品是否继续允许 Direct 单接口编辑。 | 现版本允许；若要恢复“只能应用模板”，应同时更新 UI、校验和本 SR。 |
| OI-002 | Direct 的 SVI IP 是否需在主 Device & Interface 表提供编辑器。 | 现版本仅显示摘要；应明确由 Network/Profile 还是 Direct 接口拥有该值。 |
| OI-003 | Device-scope Apply 未选接口时是否允许分配所有接口。 | 建议改为必须显式选择接口，以避免意外配置范围。 |
| OI-004 | M-LAG 的 GPU hostname 推测分组是否允许保留。 | 建议移除推测逻辑，改为只接受 Fabric 事实源。 |
| OI-005 | 已引用 Profile 的锁定策略、Delete 规则与影响预览。 | 当前未引用 Profile 可编辑；需补充唯一名称、引用影响、权限、并发和服务端原子保存后再开放 Delete。 |
| OI-006 | CloudVision Workspace/Build/Change Control 集成的目标版本与 API 契约。 | 在实现前定义对象 ownership、revision、RBAC、失败恢复和回采语义。 |

> CloudVision 生命周期内容基于 Arista 官方 Workflow 与 Change Control 文档的语义转述；VLAN Profile、Network binding、Sequential Allocation、Direct Configuration 及当前页面交互均为 AmpCon 产品扩展。Content was rephrased for compliance with licensing restrictions.
