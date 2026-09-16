# STD-AI-006 VLAN Services 软件需求规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-VLAN-SERVICES-001 |
| Studio ID | `STD-AI-006` |
| Studio 名称 | `VLAN Services` |
| 版本 | v1.1 |
| 日期 | 2026-09-16 |
| 状态 | Draft |
| 适用产品 | AmpCon-DC AIDC Network |

## 目录

1. SR清单
   - 1.1 SR表单拆解
   - 1.2 依赖与前置条件
2. 功能需求详述
   - 2.1 VLAN Service Profiles
   - 2.2 Profile Configuration
   - 2.3 Select Devices & Interfaces
   - 2.4 Device & Interface
   - 2.5 Studio公共表单
3. 功能评审（Review）
   - 3.1 评审人员
   - 3.2 评审结果
   - 3.3 遗留问题

> 本 SR 只拆解 `VLAN Services` Studio 表单，不包含验收标准和测试场景矩阵，也不展开 Tasks、Change Control、设备执行、回滚或 API 设计。

需求状态：`[CURRENT]` 表示当前原型已实现；`[TARGET]` 表示产品化表单要求；`[AMP]` 表示 AmpCon 产品扩展。

## 1. SR清单

### 1.1 SR表单拆解

| SR编号 | 一级功能 | 二级功能 | 主要表单/操作 |
|---|---|---|---|
| SR-VLAN-001 | VLAN Service Profiles | Profile List | Create、Search、Edit、Delete |
| SR-VLAN-002 | Profile Configuration | Basic Profile | Name、Description、Port Mode、MTU |
| SR-VLAN-003 | Profile Configuration | VLAN & Gateway | VLAN/Native VLAN、Allowed VLANs、Gateway |
| SR-VLAN-004 | Profile Configuration | Sequential Allocation | VLAN Step、Gateway Step、Device Order |
| SR-VLAN-005 | Select Devices & Interfaces | Device Selection | Role、Order、Search、M-LAG Pair |
| SR-VLAN-006 | Select Devices & Interfaces | Interface Selection | Search、Source、Common Interface Selection |
| SR-VLAN-007 | Device & Interface | Profile Assignment | Profile Picker、Device Selection、Apply Profile |
| SR-VLAN-008 | Device & Interface | Port Configuration | Description、Mode、VLAN、Gateway、MTU、Override |
| SR-VLAN-009 | Device & Interface | Direct Configuration | 无 Profile 设备的逐端口显式配置 |
| SR-VLAN-010 | Studio公共表单 | Workspace Context | Workspace、Review、Save、Previous/Next/Apply |

### 1.2 依赖与前置条件

| 依赖项 | 前置条件 | 表单行为 |
|---|---|---|
| Workspace | 已选择可写 Workspace | 未选择时禁用新增、编辑、删除、Apply Profile 和保存。 |
| Inventory | 目标设备已注册且可读 | Device List 从 Inventory 获取设备身份与型号。 |
| Fabric / M-LAG | Fabric 中存在设备角色和 M-LAG Domain | 用于设备范围、角色过滤和 Pair 联动。 |
| Interface Data | 设备接口数或已观测接口可用 | 生成接口候选；观测接口标记 Inventory/LLDP。 |
| Device Capability | 可提供模式、VLAN、MTU、SVI 能力 | 原型使用通用范围；产品化按设备能力约束。 |

对象边界：Inventory/Fabric 拥有设备、接口、角色和 M-LAG 事实；VLAN Services 只拥有 Profile、Assignment、顺序分配和接口覆盖。Intent Center 只可调用或预填本 Studio；Templates & CLI 是独立配置源。
## 2. 功能需求详述

### 2.1 VLAN Service Profiles

#### 2.1.1 功能说明

集中创建、搜索、查看、编辑和删除 VLAN Service Profile，并汇总 Profile、已分配设备和接口数量。

#### 2.1.2 竞品功能设计及流程说明

采用 Profile 列表作为配置入口。Profile 是 [AMP] 可复用业务接入模板，不是 Inventory 对象；删除 Profile 只移除当前 Workspace candidate 中的 Profile 及其引用，不删除设备或接口事实。

#### 2.1.3 功能业务流程

```text
进入 Configuration → 查看/搜索 Profile
→ Create Profile 或打开现有 Profile
→ 编辑 Profile Configuration
→ 返回 Profile List → 可继续 Edit/Delete
```

#### 2.1.4 原型界面&交互说明

页面标题为 `VLAN Service Profiles`，顶部显示 Profile、assigned devices、interfaces 数量，提供 `Create Profile` 和 `Search Profiles`。

新建 Profile 默认值：

| 字段 | 默认值 |
|---|---|
| Profile Name | `VLAN Service Profile N` |
| Description | 空 |
| Port Mode | Access |
| VLAN | `100 + N×10` |
| Native VLAN ID | 1 |
| Allowed VLANs | 空 |
| Gateway | 空 |
| MTU | 9216 |
| VLAN/Gateway Step | Off，Step=1 |
| Device Order | Name A–Z |

点击 Profile Name 或 Edit 进入详情。Delete 显示二次确认；确认后删除 Profile 及当前 Workspace 中对应设备、接口引用。

#### 2.1.5 列表字段

| 列 | 说明 |
|---|---|
| Profile Name | 名称入口。 |
| Description | 可选说明，空值为 `—`。 |
| Port Mode | Access/Trunk。 |
| VLAN / Native VLAN | 按模式显示。 |
| Allowed VLANs | 仅 Trunk 显示。 |
| Gateway | IPv4/CIDR，空值为 `—`。 |
| VLAN Step | 启用时显示 Step，否则 `—`。 |
| Gateway Step | 启用时显示 Step，否则 `—`。 |
| Assignment | `N devices · N interfaces`。 |
| Operation | Edit、Delete。 |

#### 2.1.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| 无搜索结果 | 显示 `No VLAN Service Profiles match this search.` |
| 删除仍有 Assignment 的 Profile | 确认框明确将同步移除引用。 |
| 删除后当前 Profile 失效 | 返回 Profile List，并选择剩余首个 Profile。 |
| Profile 名为空或重复 | 最终保存阻止并显示错误。 |
| Profile 全部删除 | 最终保存阻止，至少保留一个 Profile。 |

#### 2.1.7 权限控制要求

无 Workspace 时 Create/Delete 禁用；只读 Workspace 下 Create/Edit/Delete 均不可写；搜索和查看保持可用。

#### 2.1.8 功能约束与边界

Profile 只属于当前 Workspace candidate；名称比较应 Trim 且忽略大小写；删除不影响 Inventory、Fabric 或其他 Studio 数据。

#### 2.1.9 非功能需求

列表支持大数据分页或虚拟化；搜索反馈目标 ≤100ms；Edit/Delete 图标提供 title/aria-label；删除确认文案可读且可取消。

### 2.2 Profile Configuration

#### 2.2.1 功能说明

定义 Profile 的 Access/Trunk 接入属性、VLAN、Gateway、MTU 及顺序分配参数。

#### 2.2.2 竞品功能设计及流程说明

Profile 将公共业务属性与目标设备解耦。默认使用 Shared allocation；启用 VLAN Step 或 Gateway Step 后转为 Sequential allocation。顺序值按 `Select Devices & Interfaces` 保存的逻辑分配单元顺序计算。

#### 2.2.3 功能业务流程

```text
打开 Profile → 编辑基本字段 → 选择 Access/Trunk
→ 配置 VLAN/Native VLAN/Allowed VLANs
→ 可选 Gateway → 可选 Step
→ 进入设备与接口选择 → 保存 Studio
```

#### 2.2.4 原型界面&交互说明

| 字段 | 控件 | 必填 | 默认/范围 | 联动规则 |
|---|---|---:|---|---|
| Profile Name | Text | 是 | 唯一非空 | Trim 后校验。 |
| Description | Text | 否 | 空 | 不参与配置生成。 |
| Port Mode | Select | 是 | Access | Access/Trunk。 |
| MTU | Number | 是 | 9216；1500–9216 | 最终受设备能力限制。 |
| VLAN | Number | Access 是 | 1–4094 | Access 显示。 |
| VLAN Step | Toggle + Number | Access 否 | Off；1–100 | 开启后进入 Sequential。 |
| Native VLAN ID | Number | Trunk 是 | 1；1–4094 | Trunk 显示。 |
| Allowed VLANs | Text | Trunk 是 | VLAN/范围列表 | 例如 `10,20-30`。 |
| Gateway | Text | 否 | IPv4/CIDR | 空值为 Layer 2 only。 |
| Gateway Step | Toggle + Number | 否 | Off；1–100 | Gateway 非空时才可启用。 |

Gateway 非空时设置 SVI candidate 语义；清空 Gateway 时关闭 Gateway Step。`mlag-virtual` 虽存在于草稿模型，但当前 UI 未提供，不作为已交付字段。

Sequential 计算：

```text
vlan = baseVlan + logicalUnitIndex × vlanStep
gateway = baseGateway + logicalUnitIndex × subnetStep × 2^(32-prefix)
```

有效 M-LAG Pair 两端共享同一个 `logicalUnitIndex`。

#### 2.2.5 列表字段

本模块为详情表单，无独立列表。Profile 的摘要字段在 2.1 Profile List 中展示。

#### 2.2.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| Name 为空/重复 | 阻止保存。 |
| Access VLAN 超出 1–4094 | 阻止保存。 |
| Native VLAN 超出 1–4094 | 阻止保存。 |
| Allowed VLANs 为空、越界、格式或范围顺序错误 | 阻止保存。 |
| Gateway 非 IPv4/CIDR | 阻止保存。 |
| MTU 超出 1500–9216 | 阻止保存。 |
| Step 非整数或超出 1–100 | 阻止保存。 |
| 生成 VLAN >4094 或 Gateway 溢出 IPv4 | 阻止保存并指出 Profile。 |

#### 2.2.7 权限控制要求

无 Workspace 或只读 Workspace 时全部字段禁用；Info Tooltip 和返回 Profile List 保持可用。

#### 2.2.8 功能约束与边界

Allowed VLANs 只支持逗号分隔单值和闭区间；Gateway 为空表示纯二层；前端不判断 network/broadcast、地址池、VRF 或跨 Profile 子网 ownership；这些由产品能力模型处理。

#### 2.2.9 非功能需求

字段切换不丢失当前草稿；本地校验即时反馈；IPv4 递增使用无符号运算；表单在 1280×720 下可操作；Info 图标具有可读提示。
### 2.3 Select Devices & Interfaces

#### 2.3.1 功能说明

为当前 Profile 选择目标设备、公共接口和稳定排序，并将有效 M-LAG Pair 作为一个逻辑分配单元。

#### 2.3.2 竞品功能设计及流程说明

采用 Device List + Interface List 双列表。设备身份和 M-LAG 关系来自 Inventory/Fabric；接口来源区分 `Inventory / LLDP` 与 `Generated name`。Apply 替换当前 Profile 的设备和公共接口选择，但保留仍适用于已选接口的覆盖值。

#### 2.3.3 功能业务流程

```text
打开 Profile 的设备接口选择
→ 选择 Role 和 Device Order
→ 搜索并选择设备/M-LAG Pair
→ 读取第一台设备接口
→ 搜索并选择公共接口名
→ Apply 保存设备顺序与接口集合
```

#### 2.3.4 原型界面&交互说明

弹窗标题为 `Select Devices & Interfaces`，副标题显示当前 Profile Name。

Device List：

| 元素 | 控件/规则 |
|---|---|
| Role | All、Spine、Leaf。 |
| Device Order | Name A–Z、Name Z–A、Mgmt IP ↑、Mgmt IP ↓。 |
| Search | 匹配 hostname、management IP、model、role、M-LAG label。 |
| Select All | 只影响当前筛选设备，并自动扩展有效 M-LAG Pair 成员。 |
| Device / Mgmt IP | 显示 hostname、management IP 和 M-LAG Badge。 |
| Model / Role | Inventory 只读字段。 |

Interface List：

| 元素 | 控件/规则 |
|---|---|
| Reference Device | 使用排序后第一台已选设备。 |
| Search | 按接口名过滤。 |
| Select All | 只影响当前筛选接口。 |
| Source | `Inventory / LLDP` 或 `Generated name`。 |
| VLAN Service Profile | 显示当前 Profile Name。 |

更改 Device Order 或设备选择时清空当前接口选择。有效 M-LAG Pair 任一成员被选中/取消时，两端同步处理；保存后两端相邻并共享同一个顺序索引。

#### 2.3.5 列表字段

Device List：Selection、Device/Mgmt IP、Model、Role。

Interface List：Selection、Interface、Source、VLAN Service Profile。

弹窗底部显示已选设备数，以及 `N interface names selected for each of M devices`。

#### 2.3.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| 未选设备或接口 | 禁用 Apply。 |
| 无设备筛选结果 | 显示 `No devices match this filter.` |
| 未选设备 | Interface List 显示 `No Data`。 |
| M-LAG Domain 无效 | 最终保存阻止，要求恰有两台已注册 Leaf。 |
| 只选择 M-LAG 一端 | 最终保存阻止；UI 应自动联选。 |
| 多设备缺少同名接口 | [TARGET] 基于 canonical ID 校验真正公共接口并阻止。 |
| Generated name 未被设备能力确认 | [TARGET] 标记候选，不得当作观测事实。 |

#### 2.3.7 权限控制要求

无 Workspace 时不能打开或 Apply；无 Inventory 读取权限的设备不进入列表；服务端必须拒绝越权设备和接口引用。

#### 2.3.8 功能约束与边界

当前接口候选由首台设备的观测接口和 `Ethernet1...N` 合并，最多 128 个生成名；名称相同不代表能力相同；最终接口存在性、breakout、模式和权限必须由能力数据确认。

#### 2.3.9 非功能需求

弹窗最大高度 86vh；设备与接口列表支持虚拟滚动；排序结果可重放；Dialog、Checkbox、关闭按钮具备可访问名称；来源不只通过颜色区分。

### 2.4 Device & Interface

#### 2.4.1 功能说明

在 Inventory 设备列表中批量应用 Profile，并逐设备编辑接口的 Description、Port Mode、VLAN、Gateway、MTU。无 Profile 设备可保存 Direct configuration。

#### 2.4.2 竞品功能设计及流程说明

设备列表提供 Profile Picker 和批量 Apply；设备详情提供逐接口编辑。配置优先级为：

```text
interface override > Profile 顺序生成值 > Profile 基础值
```

Direct configuration 是 [AMP] 无 Profile 状态下的显式端口输入。应用 Profile 后，Direct configuration 中可迁移的接口覆盖转入目标 Profile，并删除该设备的 Direct 残留。

#### 2.4.3 功能业务流程

```text
选择 Profile → 勾选设备/M-LAG Pair → Apply Profile
→ 打开设备详情 → 编辑接口字段
→ 必要时切换 Access/Trunk
→ 保存为 Profile override 或 Direct configuration
```

#### 2.4.4 原型界面&交互说明

设备页顶部包含 `Apply Profile` Picker、Edit selected Profile、Apply Profile 和 Search devices。

Profile Picker 支持搜索；选择设备时，有效 M-LAG Pair 两端同步选中。Apply Profile 会把目标设备从其他 Profile 移除并归入新 Profile，同时迁移 Direct override。

设备详情字段：

| 字段 | 控件 | 规则 |
|---|---|---|
| Description | Text | 单设备独立；M-LAG 不同步。 |
| Port Mode | Select | Access/Trunk；非 Description 字段在 M-LAG 两端同步。 |
| VLAN / Native VLAN | Number | 根据模式显示，1–4094。 |
| Allowed VLANs | Text | 仅 Trunk 可编辑；Access 显示禁用 `—`。 |
| Gateway | Text | 可选 IPv4/CIDR。 |
| MTU | Number | 1500–9216。 |
| Profile | Read-only | Profile Name 或 `—`。 |

M-LAG 共同接口的 Mode、VLAN/Native VLAN、Allowed VLANs、Gateway、MTU 必须一致；Description 可不同。

#### 2.4.5 列表字段

Device List：

| 列 | 说明 |
|---|---|
| Device | Checkbox、Hostname、Model、Role、M-LAG Badge。 |
| Management IP | 管理地址。 |
| Port Mode | 单值或 Mixed。 |
| VLAN / Native VLAN | 单值或 Mixed。 |
| Allowed VLANs | Trunk 汇总或 Mixed。 |
| Gateway | 单值、Mixed 或 `—`。 |
| MTU | 单值或 Mixed。 |
| Profile | Profile Name 或 `—`。 |
| Operation | Configure interfaces。 |

Interface Detail：Interface、Description、Port Mode、VLAN/Native VLAN、Allowed VLANs、Gateway、MTU、Profile。

#### 2.4.6 异常与容错处理

| 异常 | 处理 |
|---|---|
| 未选择 Profile 或设备 | 禁用 Apply Profile。 |
| 同一设备属于多个 Profile | 阻止最终保存。 |
| 同一接口被多个 Profile 引用 | 阻止最终保存并定位设备/接口。 |
| 同设备相同 VLAN 有多个 Profile owner | 阻止最终保存。 |
| Direct 与 Profile 同时存在 | 阻止保存；Apply 时执行迁移和清理。 |
| Access/Trunk 字段非法 | 阻止保存并显示设备、接口和字段原因。 |
| M-LAG 共同接口关键值不一致 | 阻止保存。 |
| Inventory 设备已删除 | 标记引用失效并阻止保存。 |

#### 2.4.7 权限控制要求

无 Workspace 时 Apply Profile 和逐接口编辑禁用；只读 Workspace 只允许查看；Profile Picker 只显示可读 Profile；设备列表只显示用户有权访问的 Inventory 设备。

#### 2.4.8 功能约束与边界

设备级汇总 `Mixed` 仅用于展示，不能作为配置值；Description 不参与 M-LAG 对称性；Direct configuration 不创建 Profile；一个设备最终只能由一个 VLAN Service Profile 拥有。

#### 2.4.9 非功能需求

设备和接口表支持大规模滚动；逐字段修改目标响应 ≤100ms；汇总值计算稳定；所有输入具备可见焦点；Access 下禁用 Allowed VLANs 时提供 aria-label。

### 2.5 Studio公共表单

#### 2.5.1 功能说明

提供 Workspace 上下文、左侧两步导航、统一状态、Review、Save、Previous/Next 和最终 Apply。

#### 2.5.2 竞品功能设计及流程说明

Studio 使用 Profile Workbench：步骤 1 `Configuration`，步骤 2 `Device & Interface`。Workspace 只是候选表单上下文；保存不表示设备已配置。

#### 2.5.3 功能业务流程

```text
选择 Workspace → Configuration 创建 Profile
→ Next → Device & Interface 分配和覆盖
→ Apply/Save to Workspace → 全表单校验 → 显示保存结果
```

#### 2.5.4 原型界面&交互说明

顶部显示 Studio 标题、`Profile Workbench`、Review Workspace、Save to Workspace、Workspace Select、校验/保存状态，以及 Profile/Device/Interface 数量。

左侧目录：

```text
1. Profile Configuration
   └─ Configuration
2. Assignment
   └─ Device & Interface
```

底部包含 Previous、Next；第二步显示 Apply。任一修改清除 `lastAppliedAt` 并进入 `Workspace Build Required`。保存成功文案为 `Saved to <Workspace>. Run Workspace Build before submission.`。

#### 2.5.5 列表字段

公共模块无独立列表，使用 Profile、Device、Interface 表定义。

#### 2.5.6 异常与容错处理

- 未选 Workspace 时 Save/Apply 阻止并提示选择 Open Workspace。
- 存在校验错误时保存按钮禁用，底部显示首个错误和剩余数量。
- 全局校验覆盖 Profile 唯一性、字段范围、顺序溢出、设备/接口 ownership、Direct 冲突和 M-LAG 对称性。
- [TARGET] 保存失败保留本地草稿并提供重试。

#### 2.5.7 权限控制要求

Workspace 可写性决定全 Studio 编辑状态；Review Workspace 有 Workspace 时可用；前端禁用不替代服务端鉴权；拒绝原因应可见。

#### 2.5.8 功能约束与边界

Save/Apply 只保存结构化 Studio input；不直接部署设备。Studio 不拥有 Inventory/Fabric 事实，也不创建独立的执行生命周期。Intent Center 不复制 Profile 或 Assignment。

#### 2.5.9 非功能需求

页面切换不丢失草稿；保存防重复提交；候选数据保存应原子化；错误包含可定位对象；状态不能只使用颜色；常用页面操作在 300ms 内反馈。

## 3. 功能评审（Review）

### 3.1 评审人员

| 角色 | 评审重点 |
|---|---|
| 产品经理 | 表单范围、目录、Profile 与 Direct 的产品语义 |
| 网络架构师 | Access/Trunk、Gateway、Sequential、M-LAG 对称性 |
| 前端开发 | 字段联动、双列表、覆盖优先级和状态 |
| 后端开发 | 稳定 ID、能力范围、ownership 和原子迁移 |
| 测试工程师 | 字段边界、顺序生成、M-LAG、冲突与异常提示 |
| UX/UI | 页面层级、列表字段、弹窗和错误反馈 |

### 3.2 评审结果

| 功能 | 结果 | 待确认重点 |
|---|---|---|
| VLAN Service Profiles | 待评审 | 删除 Profile 的影响确认和恢复方式。 |
| Profile Configuration | 待评审 | Gateway/SVI 语义、Step 和 Allowed VLAN 规则。 |
| Select Devices & Interfaces | 待评审 | 真正公共接口计算和 Generated name 表达。 |
| Device & Interface | 待评审 | Direct 迁移、Override 和 Profile ownership。 |
| Studio公共表单 | 待评审 | Save 与最终 Apply 是否保留双入口。 |

### 3.3 遗留问题

| 编号 | 遗留问题 | 建议处理 |
|---|---|---|
| OI-001 | Gateway 是否允许 network/broadcast 地址未定义 | 明确 SVI Gateway 地址规则。 |
| OI-002 | Gateway 与 VRF/地址池关系未呈现 | 增加 VRF/Pool 契约或明确非范围。 |
| OI-003 | `mlag-virtual` 存在于模型但无 UI | 在契约确认前继续隐藏或移除死字段。 |
| OI-004 | 公共接口仅基于第一台设备名称 | 使用 canonical ID 与能力交集。 |
| OI-005 | Generated `EthernetN` 可能不是实际接口 | 标记为候选，Build 前必须验证。 |
| OI-006 | Direct 到 Profile 的覆盖迁移缺少确认 | 展示迁移摘要并事务化保存。 |
| OI-007 | Profile 切换会移除其他 Profile ownership | Apply 前显示受影响 Profile 和设备。 |
| OI-008 | M-LAG 接口同名但能力可能不同 | 增加 peer 两端能力对称校验。 |
| OI-009 | Save 与 Apply 功能重复 | 明确语义或合并为单一保存入口。 |
| OI-010 | Description 与其他 Interface Configuration 的同步边界 | 固定唯一 owner 或同步契约。 |
