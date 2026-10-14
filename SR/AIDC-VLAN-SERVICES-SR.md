# STD-AI-006 VLAN Services 软件需求规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-VLAN-SERVICES-001 |
| Studio ID | `STD-AI-006` |
| Studio 名称 | `VLAN Services` |
| 版本 | v2.1 |
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
   - 4.1 VLAN Service Profiles
   - 4.2 Profile Configuration
   - 4.3 Select Devices & Interfaces
   - 4.4 Device & Interface
5. 功能评审（Review）

> 本 SR 定义 `VLAN Services` Studio 的产品目标态，不包含验收标准和测试矩阵。VLAN Services 是 AmpCon 面向 AIDC 的产品扩展，不应解释为 Arista CloudVision 原生 Studio。

## 1. 背景与产品目标

### 1.1 背景

AIDC 接入网络必须面向大量 Leaf、双归接入设备和业务端口持续交付 VLAN 服务。Profile 应复用 Access/Trunk、VLAN、Gateway 与 MTU 意图；Sequential Allocation 应按稳定逻辑单元顺序派生 VLAN/Gateway；Direct Configuration 应支持无 Profile 设备的逐接口配置。

VLAN Services 必须以 CloudVision Studio 结构化输入表达意图，并保存为 Workspace 候选变更。Workspace Build 必须作为配置生成、设备能力、ownership 与跨配置源冲突的权威校验；Review/Submit 必须绑定固定 revision；提交后的变更应进入 Change Control 审批与执行，最终状态必须由 Running/Compliance 回采确定。

### 1.2 产品目标

1. Profile、Sequential Generated Value、Interface Override 和 Direct Configuration 必须形成可追踪的配置模型。
2. Profile 对设备的 ownership 与接口配置 scope 必须分离：设备只能归属一个 Profile，且只允许为 `interfaceAssignments` 中的接口生成配置。
3. Inventory/Fabric 必须作为设备、canonical interface、角色、拓扑和 M-LAG 关系的事实源；Studio 只保存稳定引用与业务意图。
4. 有效 M-LAG Pair 必须联选并作为一个 sequence unit；关键值、接口能力和权限必须满足双端对称规则。
5. Save/Apply 只应提交 Workspace 候选事务，不得表示 Build、Submit、设备执行或 Running 生效。
6. Intent Center 只允许表达业务意图并调用 Studio，不得拥有设备配置；Templates & CLI 必须作为独立高级配置源汇入共同 Workspace、Change Control 与合规生命周期。
7. AmpCon Tasks 如存在，必须作为 Workspace/Change Control 或 Provisioning Action 的映射对象；不得声称每个 Studio 变更必然生成 Classic Task。

## 2. SR 清单


### 2.1 SR 表单拆解

| SR编号 | 一级功能 | 二级功能 | 主要表单/操作 |
|---|---|---|---|
| SR-VLAN-001 | VLAN Service Profiles | Profile List | Create、Search、Edit、Delete |
| SR-VLAN-002 | Profile Configuration | Basic Profile | Name、Description、Port Mode、MTU |
| SR-VLAN-003 | Profile Configuration | VLAN & Gateway | VLAN/Native VLAN、Allowed VLANs、Gateway |
| SR-VLAN-004 | Profile Configuration | Sequential Allocation | VLAN Step、Gateway Step、Device Order |
| SR-VLAN-005 | Select Devices & Interfaces | Device Selection | Role、Order、Search、M-LAG Pair |
| SR-VLAN-006 | Select Devices & Interfaces | Interface Selection | Search、Capability Intersection、Scope Preview |
| SR-VLAN-007 | Device & Interface | Profile Assignment | Profile Picker、Device/Interface Selection、Apply Profile |
| SR-VLAN-008 | Device & Interface | Port Configuration | Value Sources、Effective Value、Override、Reset |
| SR-VLAN-009 | Device & Interface | Direct Configuration | 无 Profile 设备的逐接口配置、Remove、Reset |

### 2.2 依赖与前置条件

| 依赖项 | 前置条件与职责 |
|---|---|
| Workspace | 必须提供可读/可写状态、revision、baseline、Studio overlay、ETag、Build 状态及 RBAC。 |
| Inventory | 必须提供设备稳定 ID、hostname、管理地址、型号、角色、平台与设备可见性。 |
| Fabric / M-LAG | 必须提供 Fabric membership、M-LAG Pair、peer 状态及两端关系。 |
| Interface/Capability | 必须提供 canonical interface ID、存在性、breakout、模式、VLAN、SVI 和 MTU 能力。 |
| Configuration Ownership | 必须提供 Studio、Templates & CLI 及其他配置源的 ownership 和冲突信息。 |
| Change Control / Compliance | 必须提供审批、执行、回滚上下文以及 Running/Compliance 回采。 |

### 2.3 功能限制条件

| 规则 | 说明 |
|---|---|
| Workspace 前置条件 | 必须选择可写 Workspace 才能创建、编辑、删除、Apply Profile 或保存 Studio 输入；不得直接在 Mainline、Designed 或设备 Running 配置上修改。 |
| Fabric 与 Inventory 范围 | 设备、角色、canonical interface、连接和 M-LAG 事实必须来自固定的 Fabric/Inventory snapshot；Studio 不得手工伪造设备、接口或 M-LAG 关系。 |
| Profile Ownership | 一台设备同一时刻只能归属一个 VLAN Service Profile；Profile 与 Direct Configuration 不得同时拥有同一设备接口。 |
| Interface Scope | Profile 只能对 `interfaceAssignments` 中已分配的 canonical interface 生成配置；设备归属不等于自动配置设备全部接口。 |
| Access 模式 | Access 接口必须具有 VLAN 和 MTU；Allowed VLANs 不适用；VLAN ID 必须在 1–4094 范围内。 |
| Trunk 模式 | Trunk 接口必须具有 Native VLAN、非空 Allowed VLANs 和 MTU；Allowed VLANs 必须规范化为合法、去重、升序的 VLAN 集合。 |
| Gateway 与地址规划 | Gateway 必须是合法 IPv4/CIDR；Gateway 为空表示 Layer 2 only。本期不配置 VRF、IP Helpers、Address Pool 或未经能力确认的 `mlag-virtual` 模式。 |
| VLAN/Gateway Step | VLAN 与 Gateway Step 必须按逻辑分配单元计算，不得按物理设备数量计算；设备排序、成员关系或 M-LAG 关系变化后必须重新计算并显示影响。 |
| M-LAG Pair 有效性 | 有效 Pair 必须恰好包含两台可访问、可写的 Leaf；选择任一成员必须联选完整 Pair；Pair 两端作为一个逻辑分配单元共享 VLAN/Gateway sequence value。 |
| M-LAG 对称性 | Pair 两端的 interface scope、Port Mode、VLAN/Native VLAN、规范化 Allowed VLANs、Gateway、MTU 和设备能力必须一致；Description 可独立。 |
| M-LAG ID 展示 | Device & Interface 设备列表必须以 `M-LAG 01`、`M-LAG 02` 等稳定 Pair ID 标识多组 M-LAG；同一 Pair 两端显示相同 ID，非 M-LAG 显示 `—`。该列不得展示步长、Sequence 或 VLAN/IP 派生值。 |
| M-LAG 异常门禁 | 只选择一端、Peer 不可见/不可写、Domain 非法、共同接口缺失或能力不对称时，整组必须标红并禁用 Apply/Save；展开 Pair 必须可查看两台成员、Peer 状态和接口映射。 |
| Generated Interface 限制 | `EthernetN` 等 Generated Name 只能作为候选名称；必须经 Inventory、Capability 和 Build 验证后才能成为目标接口，不得伪装成已发现接口。 |
| Override 与 Direct | 必须区分继承、显式 Override 和 Explicit Clear；必须提供 Reset/Remove。Direct Configuration 仅允许无 Profile 设备使用，并必须满足 Access 或 Trunk 的最小有效字段。 |
| Direct 与 M-LAG | Direct 用于 M-LAG 时，关键字段必须联写双端对应 canonical interface 并通过双端能力/权限校验；Description 可独立。 |
| 迁移与删除 | Direct→Profile 迁移、Profile 切换、Profile 删除和 Assignment 移除必须预览影响、检测冲突、要求确认并以原子事务保存；不得静默覆盖或部分迁移。 |
| 设备能力与配置源冲突 | 表单通用范围不代表设备支持。Build 必须复核接口模式、VLAN、SVI、MTU、breakout、地址冲突，以及与其他 Studio、Intent Center、Templates & CLI 的 ownership 冲突。 |
| 生命周期限制 | Save/Apply 只保存 Workspace candidate；Build 生成候选配置；Review/Submit 固定 revision；只有 Change Control 执行并完成设备回采后，才可显示已部署、Running 更新或 Compliant。 |
| Tasks 对象边界 | AmpCon Tasks 如存在，只能映射 Workspace revision 或 Change Control 执行对象；不得宣称每个 Studio 变更必然生成 Arista Classic Task。 |

## 3. 信息架构与页面流程

### 3.1 页面结构

```text
VLAN Services
├─ Profile Configuration
│  ├─ VLAN Service Profiles
│  ├─ Profile Configuration
│  └─ Select Devices & Interfaces
├─ Assignment
│  └─ Device & Interface
│     ├─ Device List
│     └─ Interface Detail
└─ Workspace Context
   ├─ Local Dirty / Save State / Build State
   ├─ Save
   └─ Review / Submit
```

Selector 必须在 Profile Configuration 和需要创建或调整接口 scope 的 Apply Profile 流程中提供可见入口。

### 3.2 标准操作流程

```text
打开可写 Workspace 与固定 baseline
→ 编辑 VLAN Services 结构化输入
→ Save/Apply 原子保存 candidate revision
→ Workspace Build 权威生成与校验
→ Review 固定 Built revision → Submit 固定 revision
→ Change Control 审批、排期与执行
→ Running/Compliance 回采与差异定位
```

Studio 不得将候选保存解释为设备生效。Workspace 提交后应进入 Change Control；相关生命周期语义参见 [Arista CloudVision Workflow Overview](https://www.arista.com/zh/cg-cv/cv-workflow-overview) 与 [Studio Elements and Functions](https://www.arista.com/jp/cg-cv/cv-studio-elements-and-functions)。

### 3.3 页面与生命周期边界

| 阶段 | 权威对象 | 产品要求 |
|---|---|---|
| Local Editing | 客户端编辑会话 | Local Dirty 必须只表示相对已保存 revision 的未保存变更。 |
| Save/Apply | Workspace candidate | 必须以 revision/ETag 原子提交 Studio overlay；成功不代表配置已生成。 |
| Build | Workspace Build | 必须权威校验结构化输入、能力、ownership、M-LAG 和跨源冲突，并生成候选配置。 |
| Review/Submit | 固定 revision | Review 内容和 Submit 操作必须绑定同一不可变 revision；revision 变化后必须重新 Review。 |
| Change Control | CloudVision/AmpCon 编排 | 必须负责审批、排期、执行、日志和回滚；Studio 不得自行声明执行完成。 |
| Running/Compliance | 设备回采与合规服务 | 必须基于 Running 状态与 Built/Submitted 意图比较，不得由保存时间推断。 |

## 4. 功能需求详述

### 4.1 VLAN Service Profiles

#### 4.1.1 功能说明

创建、搜索、打开和删除 VLAN Service Profile，并汇总 Profile、设备 ownership 与接口 scope 数量。

#### 4.1.2 产品设计及流程说明

Profile 必须是 Workspace 中的结构化对象。Profile 名称在 Workspace scope 内必须按 Trim 后的规范化值唯一。创建时，默认名称与默认 VLAN 必须从可用值中确定；系统不得仅按列表长度生成，也不得因删除后重建发生碰撞。默认 VLAN 只是候选值，保存和 Build 必须继续校验 VLAN、子网与 ownership 冲突。

删除 Profile 必须展示受影响设备、接口、override 和外部引用，支持定位引用并要求确认。删除事务失败时必须保留原对象及引用，不得形成部分删除。产品允许删除全部 Profile；无 Profile 时仍允许使用 Direct Configuration。

#### 4.1.3 功能业务流程

```text
进入 Configuration → 搜索或打开 Profile
→ Create Profile 获取唯一候选默认值 → 编辑详情与 scope
→ Save candidate → Build
或 Delete → 查看影响与引用 → 确认 → 原子保存
```

#### 4.1.4 原型界面与交互说明

##### 4.1.4.1 交互说明（SR-VLAN-001）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Create Profile | 新建 Profile 草稿 | 点击 | 创建唯一候选名称/VLAN并进入详情 | 候选分配并发冲突时应刷新可用值并允许重试；无可写 Workspace 时禁用 | 只创建 Studio 输入，不创建设备配置 |
| Profile Search | 定位 Profile | 输入关键字 | 实时过滤并保留总数 | 无结果时显示明确空状态 | 只过滤用户可读对象 |
| Profile Name / Edit | 打开详情 | 点击 | 进入 Profile Configuration | 引用失效时应阻止编辑并提示刷新 Workspace | 不执行保存或 Build |
| Delete | 删除 Profile 及其 Studio 引用 | 点击并确认 | 显示设备、接口、override 与引用影响，成功后返回列表 | 有外部引用、并发修改或事务失败时必须阻止删除、定位原因并保留原数据 | 不得删除 Inventory/Fabric 事实或其他配置源对象 |
| Profile Summary | 查看规模 | 无 | 显示 Profile、owned devices、assigned interfaces 数 | 统计数据不可用时应显示未知并允许刷新，不得显示为零 | 统计必须绑定当前编辑 revision |
| Form Validation | 校验名称与必填字段 | 编辑 | 字段级显示错误并汇总 | 空名称或规范化重名必须阻止保存 | 名称唯一不替代 Build 冲突校验 |
| Workspace Save | 保存新增、编辑或删除 | 点击 Save/Apply | 原子提交并返回新 revision | ETag 冲突必须保留草稿，展示差异并允许重载或重试 | 保存不表示设备生效 |

##### 4.1.4.2 参数说明（SR-VLAN-001）

| 区域 | 字段 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Profile Summary | Profiles | 当前 revision 中 VLAN Service Profile 对象数。 |
| Profile Summary | Owned Devices | 所有 Profile `deviceIds` 的唯一稳定设备 ID 数。 |
| Profile Summary | Assigned Interfaces | 所有 `deviceId + canonicalInterfaceId` 的唯一组合数。 |
| Profile List | Profile Name | 用户可读唯一名称；默认值从未占用的规范化名称集合派生。 |
| Profile List | VLAN | Access 基础 VLAN 候选值；从有效范围内未占用候选集合派生。 |
| Profile List | Assignment | device 数来自 ownership；interface 数来自 `interfaceAssignments`。 |
| Profile List | Revision | Profile 最近保存所在 Workspace revision。 |

#### 4.1.5 列表字段

##### Profile List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Profile Name | 名称及详情入口。 | 始终 | 左固定 | 支持 | 左 | 名称自然升序 |
| 2 | Description | 业务说明；空值显示 `—`。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 3 | Port Mode | Access 或 Trunk。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 4 | VLAN / Native VLAN | 按模式显示基础 VLAN。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 5 | Allowed VLANs | Trunk 显示规范化集合；Access 显示 `—`。 | 始终 | 否 | 否 | 左 | 不适用 |
| 6 | Gateway | 基础 Gateway；空值显示 `—`。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 7 | VLAN Step | 启用时显示步长，否则显示 `—`。 | 始终 | 否 | 支持 | 右 | 不适用 |
| 8 | Gateway Step | 启用时显示子网步长，否则显示 `—`。 | 始终 | 否 | 支持 | 右 | 不适用 |
| 9 | Assigned Scope | `N devices · N interfaces`，分别表示 ownership 与接口 scope。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 10 | Save/Build State | 显示该对象所在 revision 的保存和 Build 结果。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 11 | Operation | Edit、Delete。 | 始终 | 右固定 | 否 | 左 | 不适用 |

#### 4.1.6 权限控制要求

用户必须具有 Workspace 读取权限才能查看 Profile，具有 Workspace 与 VLAN Services 对象写权限才能 Create/Edit/Delete。无可写 Workspace 时所有写操作必须禁用；服务端必须再次执行 RBAC 与对象引用校验。删除所涉设备或接口不可读时，必须阻止操作并提示存在不可见引用，不得泄露未授权详情。

#### 4.1.7 非功能需求

列表应支持分页或虚拟化、稳定排序和可访问名称。默认值分配、删除与保存必须原子、幂等并可审计；Profile 应使用稳定 ID，名称变更不得破坏引用。

### 4.2 Profile Configuration

#### 4.2.1 功能说明

定义 Profile 的基本信息、Access/Trunk、VLAN、Gateway、MTU 与 Sequential Allocation 规则。

#### 4.2.2 产品设计及流程说明

Profile Base 必须定义共享默认值；Sequential Generated Value 必须按 Selector 保存的逻辑单元顺序派生。普通设备构成一个 sequence unit，有效 M-LAG Pair 两端必须构成一个 unit 并使用相同 index。VLAN Step 和 Gateway Step 可独立启用。

本期 Gateway 只保留 IPv4/CIDR 字段。Gateway 非空表示需要生成相应 SVI/L3 网关意图；VRF、IP Helpers 和 Address Pool 不在本期 UI 范围内，不得保留未定义的隐藏输入。`mlag-virtual` 网关模式必须等待能力契约确认，不得作为可提交值。

#### 4.2.3 功能业务流程

```text
打开 Profile → 编辑名称、Description、Port Mode 与 MTU
→ 编辑 Access VLAN 或 Trunk Native/Allowed VLANs
→ 可选 Gateway、VLAN Step、Gateway Step
→ 选择设备与接口 scope → Save → Build
```

#### 4.2.4 原型界面与交互说明

##### 4.2.4.1 交互说明（SR-VLAN-002～SR-VLAN-004）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| VLAN Service Profiles | 返回列表 | 点击 | 保留编辑会话并返回 | 有未保存变更时必须提示保存、放弃或取消 | 不执行保存 |
| Profile Name / Description | 编辑标识与说明 | 输入 | 显示 Local Dirty 和字段来源 | 名称空或规范化重名必须阻止保存 | Description 不参与配置生成 |
| Port Mode | 选择 Access/Trunk | 选择 | 显示对应字段及模式切换影响 | 切换将使原模式字段失效时必须预览并确认，不得静默丢失 | 每个 Profile 只能有一个基础模式 |
| VLAN / Native VLAN / Allowed VLANs | 编辑二层参数 | 输入 | 显示规范化值与派生预览 | 空值、格式、范围、倒序或空集合必须字段级报错；保存和 Build 必须校验冲突 | 范围校验不代表设备支持 |
| MTU | 编辑基础 MTU | 输入 | 显示字节值与能力覆盖情况 | 非整数、越界或目标设备不支持时必须阻止相应保存或 Build | 设备能力由 capability/Build 权威判断 |
| VLAN Step / Gateway Step | 配置顺序派生 | 切换并输入 | 显示各 sequence unit 的预览 | 步长非法、VLAN 溢出、IPv4 溢出或子网重叠必须阻止保存或 Build | 派生顺序必须来自已保存 Selector order |
| Gateway | 编辑 IPv4/CIDR 网关 | 输入或清空 | 显示 L2-only 或 Gateway 派生预览 | 格式非法必须阻止保存；清空时必须预览受影响 SVI 意图 | VRF、Helpers、Address Pool 不在本期范围 |
| Form Validation | 校验 Profile 输入 | 编辑 | 聚合字段和跨字段错误 | 错误必须定位到 Profile 和字段；未解决时不得保存 | Build 仍是能力与跨源冲突权威校验 |
| Capability Validation | 校验目标设备能力 | 预览或 Build | 显示设备/接口能力差异 | 任何 assigned interface 不支持模式、VLAN、SVI 或 MTU 时必须阻止 Build | 不得以通用范围代替平台能力 |

##### 4.2.4.2 参数说明（SR-VLAN-002～SR-VLAN-004）

| 区域 | 字段 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Basic | Profile Name | 用户可读名称；唯一键比较采用 Trim 后的规范化值。 |
| Basic | Description | 业务说明文本，不参与设备配置派生。 |
| Basic | Port Mode | 枚举 `access` 或 `trunk`。 |
| Basic | MTU | 二层接口 MTU，单位 byte；允许范围由目标平台能力交集确定。 |
| Access | VLAN | 基础 Access VLAN ID，协议范围 1–4094。 |
| Access | VLAN Step | 每 sequence unit 的 VLAN ID 增量，单位 VLAN ID。 |
| Trunk | Native VLAN ID | 基础 Native VLAN ID，协议范围 1–4094。 |
| Trunk | Allowed VLANs | VLAN ID 集合；输入可为单值和闭区间，存储与比较采用去重、合并、升序的规范化集合。 |
| Gateway | SVI Gateway Binding | 每一行绑定一个 VLAN ID 与 IPv4/CIDR SVI Gateway；Gateway 为空表示该 VLAN 仅二层。IPv4 必须是可用主机地址，不得填写网段或广播地址。该多绑定表为 AmpCon VLAN Services 扩展，最终仍通过共同 Workspace Build 校验并生成 SVI 意图。 |
| Allocation | Mode | Step 均未启用为 Shared；任一启用为 Sequential。 |
| Allocation | VLAN Generated Value | `baseVlan + sequenceUnitIndex × vlanStep`。 |
| Allocation | Gateway Generated Value | `baseNetwork + sequenceUnitIndex × subnetStep × subnetSize`，主机地址偏移与 prefix 保持一致。 |
| Allocation | Device Order | Selector 保存的稳定逻辑单元顺序。 |
| Allocation | Sequence Unit | 普通设备为一台设备；M-LAG Pair 为两台 peer 的组合。 |

#### 4.2.5 列表字段

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 不适用 | 不适用 | 本模块为详情表单；Profile List 见 4.1.5，派生预览按 sequence unit 顺序展示。 | 不适用 | 不适用 | 不适用 | 不适用 | 不适用 |

#### 4.2.6 权限控制要求

字段可编辑性必须由 Workspace 写权限、VLAN Services 对象权限和目标资源可见性共同决定。用户无法读取或写入任一 M-LAG peer 时，相关 Profile scope 必须只读且不得保存。服务端必须校验名称唯一性、字段权限和 revision 条件。

#### 4.2.7 非功能需求

IPv4 与 VLAN 派生必须使用无溢出的确定性算法；相同 revision、Inventory/Fabric snapshot 和输入必须得到相同结果。模式切换和字段清空必须可审计且不得静默丢失意图。

### 4.3 Select Devices & Interfaces

#### 4.3.1 功能说明

为当前 Profile 选择有序设备与接口 scope。Selector 必须是 Profile Configuration 中的可见入口，并必须将有效 M-LAG Pair 联选为一个 sequence unit。

#### 4.3.2 产品设计及流程说明

设备候选必须来自 Inventory 可见设备，M-LAG 事实必须来自 Fabric。接口候选必须基于所有目标设备的 canonical interface 能力交集，不得以首台设备的接口名称假定公共接口。Generated Name 只允许作为候选提示；在所有目标设备确认存在、canonical 映射一致且能力一致前不得应用。

设备排序必须稳定并保存为逻辑单元顺序。M-LAG Pair 必须相邻且共享 sequence index。选择变化导致接口 scope 失效时，必须展示差异并要求确认，不得静默清除。

#### 4.3.3 功能业务流程

```text
从 Profile 打开 Selector → 筛选、排序并选择设备/M-LAG Pair
→ 计算所有目标设备 canonical interface 能力交集
→ 选择接口 → 预览 device ownership、interface scope 与 sequence units
→ Apply 到编辑会话 → Save → Build 复核
```

#### 4.3.4 原型界面与交互说明

##### 4.3.4.1 交互说明（SR-VLAN-005～SR-VLAN-006）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Selector Entry | 打开当前 Profile 的 scope 选择器 | 点击 | 显示已选设备、接口与 sequence order | Workspace 不可写或 Profile 不可编辑时禁用并说明原因 | 只编辑当前 Profile 的 ownership/scope |
| Role Filter | 筛选设备 | 选择角色 | 实时过滤候选并保留已选状态 | 筛选无结果时显示空状态；已选设备不可见时显示保留提示 | 角色来源 Inventory，不由 Studio 修改 |
| Device Order | 定义 sequence unit 顺序 | 选择 Name/IP 升降序或手动顺序 | 重排预览并重算 Generated Value | 管理 IP 缺失/非法时必须标记并使用稳定次级键；重排影响派生值时必须确认 | 排序必须保存稳定设备 ID，不得只保存显示名 |
| Device Search/Selection | 选择目标设备 | 搜索、勾选 | M-LAG Pair 双端联选并显示一个 unit | partial/invalid pair、peer 不可见、只读或能力不对称时必须阻止选择；变更导致 scope 失效时须确认 | 一台设备只能归一个 Profile |
| Interface Search/Selection | 选择公共 canonical interface | 搜索、勾选 | 显示目标设备覆盖率、能力交集与 selected scope | 非全设备存在、canonical 映射不一致或能力不足时不得选择 | 同名接口不等于同一 canonical interface |
| Generated Name Candidate | 展示推测接口名称 | 查看并选择 | 明确标记 Candidate | 未被所有设备事实源确认时不得 Apply | 只作候选，不构成 Inventory 事实 |
| Cancel / Close | 放弃临时选择 | 点击 | 关闭且不写入编辑会话 | 临时选择已变化时必须确认放弃；意外关闭后应可恢复会话 | 不保存 Workspace |
| Apply | 应用 ownership 与 interface scope | 点击 | 写入有序 `deviceIds` 和每设备 `interfaceAssignments` | 未选设备或接口时不得 Apply；并发事实变化时应刷新差异且不部分写入 | Apply 不代表 Save、Build 或设备生效 |
| Ownership Validation | 校验 Profile 设备归属 | Apply/Save | 显示冲突 Profile 与定位入口 | 设备已有其他 Profile 时必须进入显式切换流程，不得静默转移 | 单设备单 Profile owner |
| Capability Validation | 校验公共接口能力 | Apply/Build | 显示逐设备/接口差异 | 任何目标不支持所需模式、VLAN、Gateway 或 MTU 时必须阻止 | Build 必须使用权威 snapshot 复核 |

##### 4.3.4.2 参数说明（SR-VLAN-005～SR-VLAN-006）

| 区域 | 字段 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Device Filter | Role | Inventory 提供的设备角色枚举。 |
| Device Filter | Device Order | hostname、management IP 的升降序或用户定义的稳定逻辑单元顺序。 |
| Device List | Device / Mgmt IP / Model | 来源 Inventory 当前 snapshot。 |
| Device List | M-LAG Pair | 来源 Fabric 的双端稳定设备 ID 关系。 |
| Assignment | Device IDs | 按 sequence unit 顺序保存的稳定设备 ID。 |
| Assignment | Sequence Unit ID | 普通设备 ID 或规范化 M-LAG Pair ID。 |
| Interface List | Canonical Interface ID | 跨目标设备映射的稳定逻辑接口标识。 |
| Interface List | Display Name | 各设备接口名称的可读展示；名称差异不改变 canonical identity。 |
| Interface List | Capability Intersection | 所有目标设备对接口存在性、模式、VLAN、SVI、MTU 等能力的交集。 |
| Interface List | Source | Inventory、Topology/LLDP、Capability Catalog 或 Generated Candidate。 |
| Assignment | Interface Scope | 每个设备的 `deviceId + canonicalInterfaceId` 集合。 |

#### 4.3.5 列表字段

##### Select Devices & Interfaces — Device List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Selection | 复选框；M-LAG Pair 联选。 | 始终 | 左固定 | 否 | 左 | 不适用 |
| 2 | Sequence | sequence unit index；Pair 两端相同。 | 始终 | 左固定 | 支持 | 右 | Device Order |
| 3 | Device / Mgmt IP | hostname、管理 IP、M-LAG badge。 | 始终 | 否 | 支持 | 左 | hostname 自然升序 |
| 4 | Model | Inventory model。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 5 | Role | Inventory role。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 6 | M-LAG Peer | peer 名称与 pair 状态。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 7 | Permission | Read/Write/Blocked。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 8 | Assigned Profile | 已有 Profile owner 或 Unassigned。 | 始终 | 否 | 支持 | 左 | 不适用 |

##### Select Devices & Interfaces — Interface List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Selection | 接口复选框。 | 始终 | 左固定 | 否 | 左 | 不适用 |
| 2 | Canonical Interface | canonical ID 与各设备显示名。 | 始终 | 左固定 | 支持 | 左 | canonical 自然升序 |
| 3 | Presence | 目标设备存在数/总数。 | 始终 | 否 | 支持 | 右 | 不适用 |
| 4 | Source | 事实来源；候选必须显式标记。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 5 | Capability Intersection | 公共 Port Mode、VLAN、Gateway、MTU 能力摘要。 | 始终 | 否 | 否 | 左 | 不适用 |
| 6 | Assigned Scope | 当前 Profile、其他 Profile 或 Unassigned。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 7 | Validation | Ready、Candidate、Conflict、Unsupported。 | 始终 | 否 | 支持 | 左 | 不适用 |

#### 4.3.6 权限控制要求

Selector 只允许展示用户可读设备和接口。任一 M-LAG peer 不可见、只读或不可写时，Pair 必须不可选且不可保存。Apply 需要 Workspace、Profile、设备和全部接口写权限；服务端必须依据提交时 snapshot 重新鉴权。不可见引用只能显示阻塞原因和授权请求路径，不得泄露对象详情。

#### 4.3.7 非功能需求

设备和接口列表必须支持大规模虚拟化、稳定可重放排序、键盘操作、焦点管理和脏状态恢复。能力交集计算必须绑定事实源版本，并应在事实变化时使预览失效。

### 4.4 Device & Interface

#### 4.4.1 功能说明

在 Inventory 设备列表中查看 Profile ownership 与 interface scope，应用、切换或移除 Profile，并编辑 Profile Override 或无 Profile 设备的 Direct Configuration。

#### 4.4.2 产品设计及流程说明

Profile 场景的值优先级必须为 `Override > Sequential Generated > Base`。UI 必须分别显示 Base、Sequential Generated、Override、Effective Value 与 Value Source，并提供 Reset to inherited。字段状态必须区分：未设置并继承、显式值、显式清除；显式清除只允许用于产品契约允许清空的字段。

设备只能归一个 Profile，但 Profile 只允许对 `interfaceAssignments` 中的接口生成配置；其他接口必须显示 Unassigned。Apply Profile 必须创建明确 interface scope；未选择接口时不得生成设备配置。

Direct Configuration 只允许用于无 Profile 设备。Access 最小有效字段为 VLAN + MTU；Trunk 最小有效字段为 Native VLAN + 非空 Allowed VLANs + MTU。Description-only 不形成业务配置。Direct 必须提供 Remove 和 Reset。Direct 用于 M-LAG 时允许联写：Port Mode、VLAN/Native VLAN、规范化 Allowed VLANs、Gateway、MTU 必须写入双端对应 canonical interface，Description 可独立；两端必须具备相同接口能力和写权限。

Direct → Profile 迁移、Profile 切换、Profile 删除和 Assignment 移除必须预览影响、检测冲突、要求用户确认，并由服务端以原子事务执行；失败时必须恢复原 ownership、scope 和值。

#### 4.4.3 功能业务流程

```text
查看 Device List → 选择 Profile、设备和明确接口 scope → Apply Profile
→ 预览 ownership/scope/Direct 迁移 → 确认 → 原子 Save
→ 打开 Interface Detail → 查看 Base/Generated/Override/Effective
→ 编辑 Override 或 Reset to inherited
或在无 Profile 设备上创建 Direct → M-LAG 联写校验 → Save → Build
```

#### 4.4.4 原型界面与交互说明

##### 4.4.4.1 交互说明（SR-VLAN-007～SR-VLAN-009）

| 组件名称 | 说明 | 用户操作 | 页面反馈 | 异常与容错处理 | 约束与边界 |
|---|---|---|---|---|---|
| Apply Profile Selector | 选择目标 Profile 与接口 scope | 搜索、选择 Profile、设备、接口 | 显示 ownership、scope 和迁移预览 | 未选择 Profile、设备或接口时不得 Apply；冲突时提供定位入口 | 不得只创建设备 ownership 而无 interface scope |
| Edit Selected Profile | 打开 Profile 详情 | 点击 | 切换到 Profile Configuration | Profile 已被删除或无权限时提示刷新 | 不改变 assignment |
| Device Search/Selection | 选择目标设备或完整 M-LAG Pair。 | 搜索、勾选任一成员或使用全选。 | 选择任一有效 M-LAG 成员时自动选择整个 Pair；Pair 两端在设备列表中保持相邻，并显示相同 M-LAG ID。 | 只选择一端、Peer 不可见/不可写、Domain 非法或两端能力不对称时，整组必须标红并禁用 Apply；展开组行必须可查看两台物理成员和接口映射。 | M-LAG Pair 是 Fabric 事实和一个逻辑分配单元；该页仅展示 M-LAG ID，不展示 VLAN/IP 步长或 Sequence。 |
| Apply Profile | 创建、切换 Profile ownership 与 scope | 点击、预览并确认 | 显示新增、移除、迁移和冲突摘要；成功返回新 revision | Direct 迁移或旧 Profile 冲突必须由用户选择保留为 Override、采用 Profile 值或取消；事务失败不得部分应用 | Save 只形成 Workspace candidate |
| Remove Assignment | 移除设备或接口 assignment | 选择并确认 | 显示将停止生成的接口配置 | 外部引用、M-LAG 不对称或事务失败时必须阻止并恢复 | 不删除 Inventory 接口；设备无 scope 时必须解除 Profile ownership |
| Device Name / Configure Interfaces | 打开 Interface Detail | 点击 | 显示全部可读接口及 Assigned/Unassigned，并保留所属 M-LAG ID。 | 事实源不可用时显示 snapshot 与刷新入口；M-LAG Pair 无效时显示告警状态。 | 只对 Assigned 行生成 Profile 配置。 |
| M-LAG ID / Pair Detail | 展示设备所属 M-LAG Pair 身份。 | 点击或展开 `M-LAG 01`。 | 展开显示两台物理成员、Peer 状态、M-LAG Domain、共同接口映射和 Pair 校验结果。 | 单边选择、Peer 不可见/不可写、Domain 非法、共同接口缺失或能力不对称时，整个 Pair 标红并禁用 Apply。 | 同一 Pair 两端必须显示相同 M-LAG ID；非 M-LAG 为 `—`。本页不得展示步长、Sequence 或 VLAN/IP 分配索引。 |
| Value Source Viewer | 展示各配置层 | 展开行 | 显示 Base、Generated、Override、Effective 与来源 | 派生失败或来源 revision 不一致时不得显示伪造 Effective | Direct 行不显示 Profile 继承层 |
| Description | 编辑接口描述 | 输入 | Profile Override 或 Direct 更新当前端 | 输入超限应字段级报错并保留草稿 | M-LAG 两端允许独立 |
| Port Mode / VLAN / Allowed VLANs / Gateway / MTU | 编辑关键字段 | 输入 | Profile Override 或 Direct 对 M-LAG 双端联写并显示 Effective | 格式、必填、能力、权限或对称失败必须阻止提交；Allowed VLANs 应规范化后比较 | 关键字段必须遵循 canonical interface 对称规则 |
| Reset to inherited | 删除 Profile Override 字段 | 点击并确认 | Effective 回退至 Generated 或 Base | 回退后配置无效时必须阻止并说明依赖 | 仅 Profile assignment 可用 |
| Explicit Clear | 显式清除允许为空的继承字段 | 选择 Clear | 显示 Override=`Clear` 与新的 Effective | 必填字段不得 Clear；Build 必须校验设备语义 | 与未设置/继承状态必须区分 |
| Remove Direct | 删除 Direct 业务配置 | 点击并确认 | 移除接口 Direct assignment | M-LAG 关键字段必须双端移除；失败时恢复 | 不影响 Description 之外的 Inventory 事实 |
| Reset Direct | 恢复 Direct 编辑值 | 点击 | 回到已保存 revision 或清空新建草稿 | 有未保存变更时必须确认 | Direct 不存在继承层 |
| Ownership Validation | 校验设备单一 Profile owner | Apply/Save | 显示冲突对象及来源 | 多 Profile、Profile+Direct 并存必须阻止 | Direct 与 Profile 互斥 |
| Capability Validation | 校验设备和接口能力 | 编辑/Build | 显示逐端能力差异 | 任一 M-LAG peer 不支持关键字段时必须阻止双端提交 | Build 为权威结果 |
| Workspace Save | 保存 assignment、迁移和字段变更 | 点击 Save/Apply | 原子提交并返回 revision | ETag 冲突、超时或服务端拒绝时保留草稿并允许幂等重试 | 不表示设备已执行 |

##### 4.4.4.2 参数说明（SR-VLAN-007～SR-VLAN-009）

| 区域 | 字段 | 数据语义、来源、单位和派生关系 |
|---|---|---|
| Profile Assignment | Profile ID | 设备唯一 Profile owner 的稳定对象 ID。 |
| Profile Assignment | Device IDs | Inventory 稳定设备 ID；M-LAG 使用 pair 关系关联。 |
| Profile Assignment | Interface Scope | `deviceId + canonicalInterfaceId` 集合。 |
| Device List | Device / Management IP | 来源 Inventory。 |
| Device List | M-LAG ID | Fabric 为每个 M-LAG Domain 分配的稳定显示标识，如 `M-LAG 01`；同一 Pair 两端相同，非 M-LAG 设备为 `—`。该字段只标识 Pair 身份，不表达步长、Sequence 或 VLAN/IP 派生值。 |
| Device List | Profile | 设备 Profile owner；无 owner 为 Unassigned。 |
| Device List | Assigned Scope | 该设备 assigned interface 数与总可见接口数。 |
| Interface Detail | Interface | canonical interface ID、设备显示名及事实来源。 |
| Interface Detail | Assignment State | Assigned 或 Unassigned。 |
| Interface Detail | Base Value | Profile 定义的基础字段值。 |
| Interface Detail | Sequential Generated | 根据 sequence unit index 和 Step 派生的 VLAN/Gateway 值。 |
| Interface Detail | Override | 显式值、显式 Clear 或未设置。 |
| Interface Detail | Effective Value | 按 `Override > Generated > Base` 派生的最终候选字段值。 |
| Interface Detail | Value Source | `Base`、`Sequential Generated`、`Override`、`Explicit Clear` 或 `Direct`。 |
| Interface Detail | Description | 接口业务说明文本。 |
| Interface Detail | Port Mode | `access` 或 `trunk`。 |
| Interface Detail | VLAN / Native VLAN | VLAN ID，协议范围 1–4094。 |
| Interface Detail | Allowed VLANs | 规范化 VLAN ID 集合。 |
| Interface Detail | Gateway | IPv4/CIDR；允许清空时以 Explicit Clear 表示。 |
| Interface Detail | MTU | 单位 byte；有效范围来源平台能力。 |
| Direct | Business Configuration | 无 Profile 接口上的显式 Port Mode、VLAN 参数、Gateway 和 MTU。 |
| Direct | Validity | Access 由 VLAN+MTU 派生；Trunk 由 Native VLAN+Allowed VLANs+MTU 派生。 |

#### 4.4.5 列表字段

##### Device List

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Device | 复选框、hostname、model/role、详情入口。 | 始终 | 左固定 | 支持 | 左 | hostname 自然升序 |
| 2 | Management IP | Inventory 管理地址；缺失显示 `—`。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 3 | M-LAG ID | 同一有效 Pair 的两端显示相同稳定标识，如 `M-LAG 01`、`M-LAG 02`；非 M-LAG 设备显示 `—`。无效 Pair 保留 M-LAG ID 并显示告警状态；点击可展开查看两台成员、Peer 状态和共同接口映射。 | 始终 | 否 | 支持 | 左 | M-LAG Domain 稳定顺序；不参与 VLAN/IP 步长排序 |
| 4 | Profile Ownership | Profile 名称或 Unassigned。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 5 | Assigned Scope | `N assigned / N visible interfaces`。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 6 | Port Mode | Assigned/Direct 接口 Effective Value 汇总。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 7 | VLAN / Native VLAN | Effective Value 汇总；多值显示 Mixed 及数量。 | 始终 | 否 | 否 | 左 | 不适用 |
| 8 | Allowed VLANs | Effective 规范化集合摘要。 | 始终 | 否 | 否 | 左 | 不适用 |
| 9 | Gateway | Effective Gateway 摘要。 | 始终 | 否 | 否 | 左 | 不适用 |
| 10 | MTU | Effective MTU 摘要，单位 byte。 | 始终 | 否 | 支持 | 右 | 不适用 |
| 11 | Value Source | Base/Generated/Override/Direct 来源分布。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 12 | Validation | Local、Save、Build 的错误/警告摘要。M-LAG Pair 的单边选择、Peer 不可见、Domain 非法、共同接口缺失或能力不对称显示为 Blocking Error。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 13 | Operation | Configure Interfaces、Remove Assignment。 | 始终 | 右固定 | 否 | 左 | 不适用 |

##### Interface Detail

| 显示顺序 | 字段 | 内容 | 显示/隐藏 | 列固定 | 列排序 | 对齐方式 | 默认排序 |
|---:|---|---|---|---|---|---|---|
| 1 | Interface | canonical ID、设备接口名和 M-LAG peer 映射。 | 始终 | 左固定 | 支持 | 左 | canonical 自然升序 |
| 2 | Assigned Scope | Assigned、Unassigned 或 Direct。 | 始终 | 否 | 支持 | 左 | Assigned 优先 |
| 3 | Description | 当前端 Description。 | 始终 | 否 | 否 | 左 | 不适用 |
| 4 | Port Mode | Base、Override/Direct 与 Effective。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 5 | VLAN / Native VLAN | Base、Generated、Override/Direct 与 Effective。 | 始终 | 否 | 否 | 左 | 不适用 |
| 6 | Allowed VLANs | Base、Override/Direct 与 Effective 规范化集合。 | Trunk | 否 | 否 | 左 | 不适用 |
| 7 | Gateway | Base、Generated、Override/Direct 与 Effective。 | 始终 | 否 | 否 | 左 | 不适用 |
| 8 | MTU | Base、Override/Direct 与 Effective，单位 byte。 | 始终 | 否 | 支持 | 右 | 不适用 |
| 9 | Value Source | 每个字段的 Base、Sequential Generated、Override、Explicit Clear 或 Direct。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 10 | Validation | 对称性、能力、ownership 与 Build 结果。 | 始终 | 否 | 支持 | 左 | 不适用 |
| 11 | Operation | Reset to inherited、Explicit Clear、Remove/Reset Direct。 | 始终 | 右固定 | 否 | 左 | 不适用 |

#### 4.4.6 权限控制要求

查看需要 Workspace、设备和接口读权限。Apply/Switch/Remove Profile、迁移 Direct 和编辑接口值需要 Workspace、Profile、设备及全部 scope 接口写权限。M-LAG 任一 peer 不可见或只读时，Pair 的 assignment 和关键字段必须不可编辑。服务端必须校验 RBAC、ownership、scope、revision 和事实源版本；前端禁用不得替代服务端校验。

#### 4.4.7 非功能需求

大表必须支持虚拟化和稳定滚动定位。来源、继承、显式清除和 Effective Value 不得仅以颜色区分。迁移、切换、删除、Reset 和 Remove 必须具备审计记录、幂等请求键和失败恢复；`Mixed` 只允许作为汇总显示，不得作为配置值。

## 5. 功能评审（Review）

### 5.1 评审人员

| 角色 | 评审重点 |
|---|---|
| 产品经理 | Profile/Direct、ownership、scope、目标态生命周期与范围 |
| 网络架构师 | VLAN/Gateway、Sequential、M-LAG 对称性和能力契约 |
| UX/UI | 可见入口、值来源、Reset、迁移预览和状态层级 |
| 后端开发 | Workspace revision、ETag、原子事务、RBAC 和审计 |
| CloudVision 集成 | Build、Submit、Change Control、Running/Compliance 映射 |
| 测试工程师 | 跨字段、跨对象、并发、失败恢复和边界 |

### 5.2 评审结果

| 功能 | 结果 | 目标态评审重点 |
|---|---|---|
| VLAN Service Profiles | 待评审 | 唯一默认值分配、删除影响、引用定位与原子恢复。 |
| Profile Configuration | 待评审 | 本期 Gateway 字段、Sequential 算法、范围与能力契约。 |
| Select Devices & Interfaces | 待评审 | 可见入口、canonical 能力交集、稳定排序和 M-LAG unit。 |
| Device & Interface | 待评审 | ownership/scope、值来源、Direct 最小字段、对称联写和原子迁移。 |

### 5.3 遗留问题

| 编号 | 待产品确认项 | 建议处理与回链 |
|---|---|---|
| OI-001 | Gateway 地址是否允许 network address、broadcast address，以及 /31、/32 的使用规则 | 由网络架构与平台能力契约确认；回链 4.2.2、4.2.4。 |
| OI-002 | Gateway Sequential 的 host offset、跨子网边界及地址池耗尽规则 | 明确算法后固化预览与 Build 校验；回链 4.2.4.2。 |
| OI-003 | VRF 与 Address Pool 是否进入后续版本，以及与外部 IPAM 的 ownership | 本期不提供 UI 或隐藏输入；后续单独立项，回链 4.2.2。 |
| OI-004 | `mlag-virtual` Gateway 的平台支持矩阵、地址语义和双端生成契约 | 能力契约确认前不得提交该模式；回链 4.2.2、4.4.2。 |
| OI-005 | MTU 口径是二层 frame、IP MTU 还是平台命令值，以及不同平台的单位/范围差异 | 由 capability catalog 提供语义和转换；回链 4.2.4.2、4.4.4.2。 |
| OI-006 | canonical interface 对 breakout、port-channel 与平台命名差异的映射规则 | Inventory/Capability 团队确认稳定身份契约；回链 4.3.2、4.3.4.2。 |

> CloudVision 生命周期语义根据 Arista 官方 Workflow 与 Studio 文档转述；Profile、Sequential Allocation、Direct Configuration 和本页交互均为 AmpCon 扩展。Content was rephrased for compliance with licensing restrictions.
