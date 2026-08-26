# 数据中心产品（AIDC + 云DC）深度剖析报告

| 项目 | 内容 |
|------|------|
| 文档编号 | ANALYSIS-AMPCON-DC-STRATEGY-001 |
| 版本 | v1.5 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-08-21 |
| 当前状态 | 可视化能力已实现；Provisioning 已有可交互前端原型，尚无后端配置闭环 |

> Provisioning 的对象边界、当前实现逻辑与原型限制，以 [AIDC Provisioning：Arista 语义、AMPCon 当前实现与目标设计](./AIDC-PROVISIONING-ARISTA-LOGIC-AND-AMPCON-DESIGN.md) 为准。本文只保留产品战略和阶段判断，不重复实现细节。

---

## 一、核心问题：产品经理对产品的逻辑和方向的理解

> "你认为要怎么把产品做成？"

这个问题的本质是：**你对场景的理解有多深、对客户痛点的洞察有多准、对关键价值的判断有多清晰。**

---

## 二、场景理解：AIDC 和云DC 是两个完全不同的战场

### 2.1 两个场景的本质区别

| 维度 | AIDC（AI 数据中心） | 云DC（传统/云数据中心） |
|------|---------------------|------------------------|
| **核心负载** | GPU 集群训练/推理，RoCE/RDMA 流量为主 | 虚拟化/容器化混合负载，TCP 流量为主 |
| **网络特征** | 微突发、全对全通信、对延迟极度敏感（μs 级） | 南北向为主、东西向为辅、延迟容忍度高（ms 级） |
| **关键指标** | ECN 标记率、PFC 暂停频率、Buffer 利用率、NCCL 有效带宽 | 链路利用率、丢包率、VXLAN 隧道状态、租户 SLA |
| **客户画像** | AI 公司、GPU 云服务商、大型互联网 AI 部门 | 企业 IT、云服务商、运营商 |
| **购买决策** | 性能驱动（训练效率直接影响成本） | 成本驱动 + 运维效率驱动 |
| **竞争对手** | NVIDIA Spectrum-X、Arista Etherlink、Juniper Apstra | Cisco ACI、华为 iMaster NCE、H3C AD-DC、Juniper Apstra |
| **网络规模** | 数千~数万 GPU，Spine-Leaf 2~3 级 | 数百~数千服务器，Spine-Leaf 2 级 |
| **生命周期重心** | Day 2 运维（性能调优、拥塞治理） | Day 0/Day 1（自动化部署、Fabric 构建） |

### 2.2 一句话定义场景

- **AIDC**：让 AI 训练跑得更快、更稳、更省钱。网络是 GPU 算力的"乘数"——网络差 10%，训练时间多 10%，成本多 10%。
- **云DC**：让业务上线更快、运维更省人。网络是业务的"底座"——稳定即可，关键是自动化和可视化降低运维复杂度。

---

## 三、客户痛点深度剖析

### 3.1 AIDC 客户的三大核心痛点

**痛点 1：RoCE 网络拥塞导致训练效率下降（最痛）**

- 现象：NCCL AllReduce 通信时间占比从理论 30% 膨胀到 50%+
- 根因：ECN/PFC 配置不当 → 拥塞扩散 → 全网性能劣化
- 客户原话："我花了几千万买 GPU，结果网络拖后腿，训练一个模型多花 3 天"
- 量化影响：网络有效带宽从 95% 降到 70%，等于浪费了 25% 的 GPU 投资

**痛点 2：故障定位慢，MTTR 长**

- 现象：训练任务突然变慢或失败，不知道是 GPU 问题还是网络问题
- 根因：缺乏端到端的流级别可观测性，无法快速定位到具体交换机/端口/队列
- 客户原话："出了问题，网络团队和 AI 团队互相甩锅，排查一个问题要半天"
- 量化影响：MTTR 从分钟级变成小时级，大规模集群每小时停机成本数万元

**痛点 3：多租户/多任务性能干扰**

- 现象：一个团队的大模型训练影响另一个团队的推理服务质量
- 根因：缺乏有效的性能隔离机制，共享网络资源无法公平分配
- 客户原话："我们有 3 个 AI 团队共用一个集群，互相影响，只能错峰使用"
- 量化影响：GPU 利用率从理论 90%+ 降到 60%（因为要错峰）

### 3.2 云DC 客户的三大核心痛点

**痛点 1：网络变更复杂、易出错（最痛）**

- 现象：新增一个租户/业务需要手动配置 VXLAN、VRF、ACL，耗时数小时
- 根因：缺乏自动化编排能力，配置靠人工 CLI，容易遗漏或冲突
- 客户原话："每次上新业务都提心吊胆，怕配错影响现有业务"
- 量化影响：业务上线周期从"应该 1 小时"变成"实际 1-2 天"

**痛点 2：多厂商设备管理碎片化**

- 现象：网络中有 3-5 个品牌的设备，每个品牌一套管理工具
- 根因：各厂商控制器只管自家设备，缺乏统一管理平面
- 客户原话："我有 5 个管理界面，出了问题要逐个排查"
- 量化影响：运维人力成本翻倍，故障定位时间翻倍

**痛点 3：缺乏全局可视化，"盲人摸象"**

- 现象：不知道网络整体健康状况，只有出了告警才知道有问题
- 根因：缺乏统一的健康度评估和拓扑可视化
- 客户原话："领导问我网络怎么样，我只能说'目前没告警'，说不出具体数据"
- 量化影响：被动运维 → 故障后才响应 → 业务影响已经发生

---

## 四、关键价值判断：AmpCon 的差异化定位

### 4.1 我们不是谁

| 我们不是 | 原因 |
|----------|------|
| 不是 NVIDIA Spectrum-X | 我们没有自研 ASIC，做不了逐包自适应路由和端到端硬件级拥塞控制 |
| 不是 Cisco ACI | 我们没有 20 年的企业客户积累和 EPG+Contract 策略模型的深度 |
| 不是华为 iMaster NCE | 我们没有全栈自研（芯片+设备+控制器+AI）的垂直整合能力 |
| 不是 Juniper Apstra | 我们尚未具备成熟的多厂商 Reference Design、图模型、持续意图验证和 Blueprint 版本回退引擎 |

### 4.2 我们是谁——差异化定位

**AmpCon 的核心定位：轻量级、多厂商、融合场景的网络智能运维平台**

| 差异化维度 | AmpCon 的独特价值 |
|-----------|------------------|
| **多厂商支持** | 不绑定单一设备品牌，管理异构网络（这是 H3C/华为做不到的） |
| **融合场景** | 一个平台管 DC + Campus + Optical（竞品都是分开的产品线） |
| **轻量部署** | 单机即可运行，不需要 3 节点集群（降低中小客户门槛） |
| **快速交付** | App 架构，功能模块化，按需安装（不是一个大而全的巨型系统） |
| **可视化优先** | 以拓扑和 Dashboard 为核心交互入口（不是配置驱动） |

### 4.3 关键价值主张（一句话）

> **"让网络运维从'被动救火'变成'主动感知'，从'单厂商锁定'变成'统一管理'。"**

### 4.4 产品设计决策：业务入口、Blueprint、工程工作台、严格信任链

AmpCon 不完全照搬单一厂商，正式采用四层组合：

```text
Intent Center（借鉴华为/新华三的业务与租户视角）
→ Studio Definition（可复用的网络能力 Schema 与生成逻辑）
→ Fabric Blueprint（借鉴 Apstra 的长期 Fabric 期望状态实例）
→ Workspace / Build / Change Control（对齐 Arista 的变更治理）
```

四层职责严格分开：

1. **Intent Center**：面向租户、应用、GPU 集群和业务服务，表达“需要什么”；只生成 Studio/Blueprint 调用建议，不保存设备配置，不拥有 Build、审批或执行状态。
2. **Studio Definition**：面向网络工程师，定义“这种网络能力怎样建模和生成”，包括 Schema、Inputs、Assignments 和校验规则；它是可复用定义，不等于某个站点的运行网络。
3. **Fabric Blueprint**：某个站点或 Fabric 的长期期望状态实例，保存 DC、Pod、Domain、拓扑图、资源池引用、设备分配、Routing Zone/VRF、Virtual Network 和策略关系。Blueprint 有 Active revision，但不自己审批或执行。
4. **Workspace 与 Change Control**：回答“这次对 Blueprint 的改动是否可信、谁批准、何时执行、设备是否真正收敛”；所有来源统一经过 revision、Build、同步、Review、Submit、审批、执行和 compliance 验证。

AmpCon 的差异化不是把网络参数全部隐藏，而是让业务用户先用业务语言提出需求，再由网络工程师确认可解释、可持续运营的 Blueprint，最后通过可验证、可审计的信任链执行。任何绿色成功状态都必须能展开看到来源对象、revision、时间、操作者和底层结果。

字段级信任合同、Arista 对照和阻断规则统一维护在 [Provisioning 主设计文档 §10](./AIDC-PROVISIONING-ARISTA-LOGIC-AND-AMPCON-DESIGN.md#10-ampcon-信任机制逐项对照-arista)，战略文档不另建一套状态定义。

### 4.5 Apstra Blueprint 与华为、新华三业务抽象的区别

#### 4.5.1 一句话判断

> **Apstra Blueprint 是“网络基础设施意图实例”，华为 iMaster NCE-Fabric 和新华三 AD-DC 的上层对象更偏“租户/应用网络服务实例”。**

它们都使用“意图”一词，但抽象起点不同：

```text
Apstra：网络架构意图 → 可执行 Fabric Blueprint → 持续验证
华为/新华三：业务/租户意图 → 网络服务编排 → Fabric 配置
```

#### 4.5.2 Blueprint 到底是什么

Apstra 的抽象链不是简单模板，而是逐层实例化：

```text
Logical Device
→ Rack Type
→ Template / Reference Design
→ Blueprint
→ Staged Changes
→ Commit
→ Active Blueprint Revision
→ Continuous Validation / Intent-Based Analytics
```

- **Logical Device** 描述设备角色、面板和端口能力，不先绑定具体厂商型号。
- **Rack Type** 描述一个机架需要多少 Leaf、接入设备、Generic System 以及链路关系。
- **Template/Reference Design** 描述 Fabric 结构、策略意图和能力边界，例如 Rack-based、Pod-based 或多级 Clos。
- **Blueprint** 把模板实例化为一个具体、长期存在的 Fabric：绑定真实设备、ASN/IP 资源池、Routing Zones、Virtual Networks、连接和策略。
- Blueprint 内修改先进入 staged area；解决 Build errors 后 Commit。Commit 形成 revision，可通过 Time Voyager 查看和回到保留的历史网络状态。
- Intent-Based Analytics 将 Blueprint 图中的期望关系与 Telemetry 结合，持续判断实际网络是否偏离意图。

所以 Blueprint 同时是：

1. 设计实例；
2. 配置生成上下文；
3. 网络对象关系图；
4. Active desired state；
5. 运行验证和异常归属范围；
6. 带 revision 的长期生命周期对象。

但 Blueprint **不是一次性 Workspace**。Workspace 是“本次准备修改什么”的事务；Blueprint 是“这个 Fabric 长期应该是什么”的事实模型。

#### 4.5.3 第一层判断：谁真正有一等 Blueprint 对象

| 判断项 | Juniper Apstra | Arista CloudVision | 华为 iMaster NCE-Fabric | 新华三 AD-DC / SeerEngine-DC |
|---|---|---|---|---|
| 是否存在一等 Blueprint | **有**，Blueprint 是核心长期对象 | **没有完全等价的单一对象** | 有 Fabric/业务模型，但通常不是 Apstra 式统一 Blueprint | 有 Fabric/业务模型，但通常不是 Apstra 式统一 Blueprint |
| 长期管理边界 | 一个具体 Fabric 的完整意图图 | 分散在 Inventory、多个 Studios Mainline、Tags 和 Designed Configuration | Fabric 管理域 + Tenant/VN/VPC/策略对象 | Fabric 控制域 + Tenant/Network/Subnet/Router/Port |
| 首要问题 | “这个 Fabric 长期应该是什么？” | “哪些网络功能应生成怎样的 Designed Configuration？” | “这个租户/业务需要什么网络服务？” | “这个应用/租户需要开通什么云网络？” |
| 主要使用者 | Fabric 架构师、网络工程师 | 网络工程师、网络平台团队 | 云平台、网络及业务运维 | 云平台、网络及业务运维 |
| 是否同时承载设计与运行验证 | 是，Blueprint graph 是设计和 IBA 的共同范围 | 设计来自 Studios/Mainline，运行验证来自 Telemetry/Compliance，范围不由单一 Blueprint 汇总 | 以业务意图、Fabric 和分析系统共同形成闭环 | 以业务服务、Fabric 控制和分析系统共同形成闭环 |

因此不能简单翻译为：

```text
Apstra Blueprint = Arista Workspace = 华为 Fabric = 华三 Fabric
```

正确理解是：

```text
Apstra Blueprint = 长期 Fabric 设计实例 + Active desired state + 验证范围
Arista Workspace = 一次修改事务，不是长期 Fabric 实例
华为/华三 Fabric = 业务服务的基础设施承载域，不等于完整版本化 Blueprint
```

#### 4.5.4 对象层级映射

| 抽象层 | Juniper Apstra | Arista CloudVision | 华为 iMaster NCE-Fabric | 新华三 AD-DC / SeerEngine-DC |
|---|---|---|---|---|
| 业务需求 | 通常来自外部 IT/业务系统 | 通常来自外部系统或网络团队 | Tenant、应用、VPC/VN、业务策略更接近第一入口 | Tenant、应用及云平台 Network/Subnet/Router/Port 更接近第一入口 |
| 可复用能力定义 | Logical Device、Rack Type、Template/Reference Design | Built-in/Custom Studio Definition、Schema、生成逻辑 | Fabric/业务/策略模板，名称随版本和方案变化 | Fabric/业务服务模板，名称随版本和方案变化 |
| 具体网络设计实例 | **Blueprint** | 没有统一对象；由各 Studio 的 Mainline Inputs/Assignments、Inventory、Tags 共同表达 | Fabric 实例及其关联的 Tenant/VN/策略集合 | Fabric 实例及其关联的 Tenant/Network/服务集合 |
| 候选修改上下文 | Blueprint staged area | **Workspace** | 业务配置草稿、部署流程或任务，具体形态依版本 | 业务配置草稿、服务流程或任务，具体形态依版本 |
| 已提交期望状态 | Committed Blueprint revision | Mainline / Designed Configuration | 控制器中的已部署业务意图和 Fabric 状态 | 控制器中的已部署业务服务和 Fabric 状态 |
| 执行对象 | Blueprint Commit 触发部署 | Provisioning Actions；Classic 路径使用 Tasks | 业务发放/部署任务和设备配置动作 | 服务发放/控制任务和设备配置动作 |
| 执行治理 | Commit/Revert/Revision；审批能力不等同 Arista Change Control | **Change Control**：审批、排期、Stage 和执行 | 工作流、权限、部署与运维流程；精确能力依版本 | 工作流、权限、部署与运维流程；精确能力依版本 |
| 运行证据 | Blueprint graph、Telemetry、IBA、Golden/Running | Running、Telemetry、Compliance、Action result | 业务状态、数字孪生/Telemetry、告警和分析 | 业务状态、Telemetry、告警和分析 |

Arista 最接近 Blueprint 的并不是 Workspace，而是一个**组合视图**：

```text
Inventory and Topology
+ Studio Definitions
+ 各 Studio 的 Mainline Inputs/Assignments
+ Tags
+ Designed Configuration
+ Telemetry/Compliance
```

这个组合能表达长期网络期望状态，但 CloudVision 没有把它封装成一个与 Apstra Blueprint 完全相同、同时拥有统一图、统一 revision 和统一运行分析范围的一等对象。

#### 4.5.5 Blueprint 层的拓扑、资源与设备抽象

| 设计能力 | Juniper Apstra | Arista CloudVision | 华为 iMaster NCE-Fabric | 新华三 AD-DC / SeerEngine-DC |
|---|---|---|---|---|
| 拓扑结构抽象 | Reference Design、Template、Rack Type、Pod/Clos 结构进入 Blueprint graph | 拓扑由 Inventory/Topology、Tags 和具体 Fabric Studio 分开表达 | Fabric 拓扑负责承载业务；业务对象通常位于其上 | Fabric 拓扑负责承载云网络服务；业务对象通常位于其上 |
| 设备角色抽象 | Logical Device 先描述角色和端口能力 | Inventory device + Tags/Studio Assignments；角色模型由 Studio 定义 | Fabric 角色、设备模板和组网模型 | Fabric 角色、设备模板和组网模型 |
| 厂商型号绑定时机 | 先做厂商无关设计，后通过 device profile/interface map 绑定 | Studio 可保持逻辑输入，但配置生成通常围绕 EOS/CloudVision 能力 | 上层业务抽象后映射到华为设备和方案 | 上层业务抽象后映射到新华三设备和方案 |
| 资源池 | Blueprint 引用 ASN、IPv4/IPv6 等资源池并确定性分配 | 资源模型由具体 Studio/Input 或外部系统提供，不是统一 Blueprint 内建层 | 控制器围绕业务和 Fabric 编排 IP/VLAN/VNI/VRF 等资源 | 控制器围绕 Tenant/Network/Subnet 等对象编排资源 |
| Underlay | Blueprint 图的核心组成 | 由 Inventory 和 L3/Fabric Studios 共同生成 Designed Configuration | Fabric 自动化基础层 | Fabric 自动化基础层 |
| Overlay | Routing Zone、Virtual Network、策略在 Blueprint 内 | VXLAN/EVPN、网络服务由相关 Studios 分别管理 | Tenant/VN/VPC/EPG/策略是主要业务抽象 | Tenant/Network/Subnet/Router/Port 是主要业务抽象 |
| 关系图用途 | 设计、配置生成、依赖校验、影响分析、Telemetry 关联 | Topology 负责可视化；Build、Compliance 分别提供配置和运行校验 | 业务拓扑、Fabric 拓扑、数字孪生/分析共同使用 | 业务拓扑、Fabric 拓扑和分析共同使用 |
| 跨厂商设计 | 是核心卖点，抽象先于具体硬件 | CloudVision 主要面向 Arista EOS；可通过外部系统扩展 | 上层北向可开放，但南向更贴合华为体系 | 上层可对接云平台，但南向更贴合新华三体系 |

最本质差异：Apstra 把**物理拓扑、资源、Overlay 和运行验证**收进同一个 Blueprint graph；Arista 把这些能力拆成可组合 Studios 和独立生命周期；华为、新华三则让 Fabric 成为业务对象的承载底座。

#### 4.5.6 Blueprint 层的变更、版本与信任机制

| 治理能力 | Juniper Apstra | Arista CloudVision | 华为 iMaster NCE-Fabric | 新华三 AD-DC / SeerEngine-DC |
|---|---|---|---|---|
| 候选隔离 | Blueprint staged area | 独立 Workspace，可并发修改一个或多个 Studios | 业务/服务配置流程，隔离粒度依版本 | 业务/服务配置流程，隔离粒度依版本 |
| 修改基线 | 当前 committed Blueprint revision | Workspace 创建/同步时的 Mainline | 当前已部署业务和 Fabric 状态 | 当前已部署业务和 Fabric 状态 |
| 预提交校验 | Staged errors/warnings、意图约束 | Workspace-wide 四阶段 Build | 业务参数、资源、策略和设备配置校验 | 业务参数、资源、策略和设备配置校验 |
| 提交动作 | Commit Blueprint | Submit Workspace，只更新 Mainline/Designed | 发放/部署业务 | 发放/部署服务 |
| 版本对象 | Blueprint revisions + Time Voyager | Workspace revision/Build 与 Mainline；没有统一 Blueprint revision | 业务/配置版本能力依产品版本 | 业务/配置版本能力依产品版本 |
| 审批和排期 | Commit 生命周期明确，但不是 Arista 式统一 Change Control 心智 | Change Control 是独立一等执行计划 | 依工作流、角色和部署策略 | 依工作流、角色和部署策略 |
| 执行与提交分离 | Commit 与设备部署结合较紧 | **明确分离**：Submit 更新 Designed，Change Control 才更新 Running | 业务部署通常同时驱动配置发放 | 服务部署通常同时驱动配置发放 |
| 历史恢复 | 选择历史 Blueprint revision；会处理 staged changes | 通常通过新的 Workspace/Change Control 做补偿变更 | 依版本、快照和配置回退能力 | 依版本、快照和配置回退能力 |
| 审计重点 | Blueprint revision、Commit 描述、Event Log | Workspace、Build、审批、Action、Change Control 和用户操作 | 业务开通、配置下发、告警和用户操作 | 服务开通、控制任务、告警和用户操作 |

对 AMPCon 而言，Apstra 的 revision 很适合做“恢复目标”，Arista 的 Workspace/Change Control 更适合做“实际恢复流程”。因此 AMPCon 不允许直接把历史 Blueprint revision 推到设备：必须创建补偿 Workspace，重新 Build、审批和执行。

#### 4.5.7 Blueprint 层的运行验证

| 闭环问题 | Juniper Apstra | Arista CloudVision | 华为 iMaster NCE-Fabric | 新华三 AD-DC / SeerEngine-DC |
|---|---|---|---|---|
| 期望状态来源 | Active Blueprint revision | Mainline / Designed Configuration | 已部署业务意图与 Fabric 状态 | 已部署业务服务与 Fabric 状态 |
| 实际状态来源 | Telemetry、设备配置、Blueprint graph | Running Configuration、Telemetry、Inventory | Telemetry、数字孪生、设备和业务状态 | Telemetry、设备和业务状态 |
| 核心判断 | 实际关系是否违反 Blueprint intent | Running 是否符合 Designed，Action 是否成功 | 业务意图是否满足、业务是否健康 | 服务是否成功、网络是否健康 |
| 异常归属 | Blueprint node/relationship、IBA probe | Device、config/image compliance、event/action | Tenant/业务/Fabric/设备 | Tenant/服务/Fabric/设备 |
| 图模型地位 | 设计与分析的共同数据模型 | Topology、Studio、Build、Compliance 各有职责 | Fabric/业务数字孪生共同支撑分析 | Fabric/业务拓扑共同支撑分析 |

这决定了用户看到红色异常时的语言不同：

```text
Apstra：Blueprint 中某条关系偏离意图
Arista：某设备 Running 不符合 Designed，或某 Action 执行失败
华为：某租户/业务意图未满足或业务健康异常
新华三：某应用网络服务或 Fabric 资源异常
```

#### 4.5.8 “新增一个 256-GPU Pod”的四种路径

**Juniper Apstra：Fabric 架构路径**

```text
选择/扩展 Reference Design
→ 定义 GPU Rack Type 和 Logical Devices
→ 在 Blueprint 中新增 Pod/Racks
→ 分配 ASN、Loopback、P2P 等资源池
→ 绑定设备和接口
→ 检查 staged errors/warnings
→ Commit Blueprint revision
→ 通过 Blueprint graph + IBA 持续验证
```

**Arista CloudVision：可组合网络功能路径**

```text
创建/选择 Workspace
→ Inventory and Topology 注册设备与连接
→ 在 L3 Leaf-Spine、Interface、EVPN/RoCE 等 Studios 中修改 Inputs/Assignments
→ Workspace-wide Build
→ Synchronize / Review / Submit
→ Mainline/Designed 更新
→ Provisioning Actions 进入 Change Control
→ 执行后检查 Running/Compliance
```

**华为 iMaster NCE-Fabric：业务意图路径**

```text
创建/扩容 GPU 集群或租户业务
→ 定义计算、存储、管理网络及隔离/SLA 策略
→ 选择 Fabric 与资源范围
→ 控制器分配 VRF/VNI/IP 等资源
→ 生成并部署 Fabric 配置
→ 从业务、Fabric 和分析视图检查交付结果
```

**新华三 AD-DC：云网络服务路径**

```text
创建/同步租户及应用网络对象
→ 定义 Network/Subnet/Router/Port 和安全策略
→ 关联承载 Fabric 与设备范围
→ SeerEngine-DC 编排 Overlay/Underlay 资源
→ 下发设备配置
→ 从服务、任务和 Fabric 状态检查结果
```

#### 4.5.9 AMPCon 的最终 Blueprint 取舍

AMPCon 不复制任何单一厂商，而是组合四种优势：

| AMPCon 层 | 主要借鉴 | 保留内容 | 明确不复制 |
|---|---|---|---|
| Intent Center | 华为/新华三 | 租户、应用、GPU 集群、服务和 SLA 语言 | 不让业务对象直接拥有设备配置 |
| Studio Definition | Arista | 可组合网络能力、Schema、Inputs、Assignments、生成与校验 | 不把每个 Studio 当成独立长期网络实例 |
| Fabric Blueprint | Apstra | 长期图模型、Reference Design、资源分配、Active revision、Telemetry 关联 | 不采用绕过 Workspace 的直接 Commit |
| Workspace/Build | Arista | 并发候选事务、四阶段校验、同步和 Review | 不把 Blueprint revision 当作可直接执行对象 |
| Change Control | Arista | 审批、排期、Stage、执行和审计 | 不把 Submit/Commit 显示成设备已生效 |
| Vendor Adapter | AMPCon 自有 | 多厂商配置生成、能力矩阵、差异归一化 | 不承诺所有厂商最低公分母以外的伪统一 |
| Compliance/Analytics | Apstra + Arista | Blueprint graph drift + Designed/Running compliance | 不用单一健康分掩盖底层证据 |

最终对象链保持：

```text
BusinessIntent
→ StudioInvocationProposal
→ Workspace modifies FabricBlueprint
→ Build Candidate BlueprintRevision
→ Submit promotes Active BlueprintRevision
→ Provisioning Actions / Vendor Tasks
→ Change Control
→ Running State + Telemetry
→ Blueprint Compliance / Drift
```

官方语义依据：[Arista Studios](https://www.arista.com/cg-cv/cv-cloudvision-studios)、[Arista Workflow Overview](https://www.arista.com/cg-cv/cv-workflow-overview)、[Arista Built-in Studios](https://www.arista.com/cg-cv/cv-built-in-studios)、[Arista Compliance](https://www.arista.com/cg-cv/cv-network-compliance-cvp)、[Apstra Templates](https://www.juniper.net/documentation/us/en/software/apstra6.0/apstra-user-guide/topics/concept/templates.html)、[Apstra Rack Types](https://www.juniper.net/documentation/us/en/software/apstra5.1/apstra-user-guide/topics/concept/rack-types.html)、[Apstra Blueprint Commit/Revert](https://www.juniper.net/documentation/us/en/software/apstra4.2/apstra-user-guide/topics/task/blueprint-commit-revert.html) 和 [Apstra Time Voyager](https://www.juniper.net/documentation/us/en/software/apstra4.2/apstra-user-guide/topics/concept/time-voyager.html)。华为和新华三列为产品层归纳，具体对象名称、工作流和能力应随目标版本再次核验。

---

## 五、产品逻辑：怎么把产品做成

### 5.1 产品成功的三个阶段

```text
阶段 1（已实现）：看得见          → 可视化 + 监控
阶段 2A（已有前端原型）：管得了   → Studios + Inventory + Fabric + Workspace UI
阶段 2B（下一里程碑）：真正可写   → 持久化 + Build + 同步 + 审批 + 配置下发
阶段 3（长期）：治得好            → 智能运维 + 闭环
```

阶段判断以能力是否形成真实闭环为准，不再只按“6 个月/12 个月”倒计时。当前 Provisioning 原型已经验证页面层次、状态归属和关键交互，但还不能计为可生产使用的 Day 0/Day 1 自动化。

### 5.2 阶段 1：看得见（Day 2 可视化运维）— 当前重点

**核心逻辑：先让客户"看到"网络的全貌和问题，建立信任。**

| 能力 | AIDC 场景实现 | 云DC 场景实现 | 状态 |
|------|--------------|--------------|------|
| 全局拓扑 | Spine-Leaf 拓扑 + 设备分层 | 多站点拓扑 + Site 间链路 | ✅ 已实现 |
| 健康度评估 | RoCE 质量维度（ECN/PFC/Buffer） | 设备可用性 + 链路质量 | ✅ 已设计 |
| Dashboard | AIDC 九宫格（ECN Top5/拥塞趋势/Buffer） | IDC 九宫格（设备/链路/告警） | ✅ 已实现 |
| 告警管理 | 四级告警 + 事件流 | 四级告警 + 事件流 | ✅ 已实现 |
| 设备详情 | 设备信息 + 邻居 + 告警 | 设备信息 + 邻居 + 告警 | ✅ 已实现 |
| 链路详情 | 吞吐/利用率/丢弃/错误/延迟 | 同左 | ✅ 已实现 |

**为什么先做"看得见"？**
1. 客户最容易感知价值——"以前看不到，现在看到了"
2. 实现成本最低——不需要南向配置下发能力
3. 建立数据基础——为后续智能分析积累数据
4. 降低销售门槛——演示效果好，容易打动客户

### 5.3 阶段 2：管得了（Day 0/Day 1 自动化）— 已进入原型验证

**核心逻辑：从“只读可视化”走向“受控可写”，但必须把前端交互原型与真实配置闭环分开评价。**

当前已经具备可交互前端原型：正式导航包含 Studios、Workspaces、Tasks、Change Control；Inventory and Topology 可维护候选设备、Role、Node ID 和连接；L3 Leaf-Spine Studio 可配置 DC、Pod、Domain、Assignments 与 Topology 投影。

当前尚未具备生产闭环：没有后端持久化、真实 Workspace revision、Build、Mainline 同步、RBAC、Submit、Provisioning Actions/Tasks 适配、Change Control 执行和设备结果回写。因此现状应标记为“产品与交互已验证，南向执行未完成”，不能再写成“仅可视化”，也不能写成“自动化已交付”。

| 能力 | 原型状态 | 后端闭环优先级 | 完成定义 |
|---|---|---|---|
| Fabric 自动构建 | ✅ L3 层级、Assignments、校验与 Topology 原型 | P0 | 生成候选配置并通过真实 Build |
| Workspace 生命周期 | ✅ 列表/Review UI 原型 | P0 | revision、持久化、同步、Submit、审计 |
| Inventory / Node ID / Connections | ✅ 共享前端状态 | P0 | 统一 Inventory API 与跨页持久化 |
| Change Control | ✅ 信息架构与详情原型 | P0 | 审批、排期、执行、日志、失败处理 |
| VXLAN EVPN 配置 | ⬜ 未形成完整 Studio | P0 | Inputs、Assignments、生成与设备验证闭环 |
| ZTP 零配置部署 | ⬜ 未接入 | P1 | onboarding 后汇入 Inventory and Topology |
| 配置模板化 | 🟡 Studio/Default 节点原型 | P1 | 版本、复用、升级和兼容性管理 |
| 资源池与租户/VRF | 🟡 部分地址池输入 | P1 | 全局冲突检测、分配与回收 |

实现逻辑和 Arista/AMPCon 语义边界见 [Provisioning 主设计文档](./AIDC-PROVISIONING-ARISTA-LOGIC-AND-AMPCON-DESIGN.md)。

### 5.4 阶段 3：治得好（Day 2+ 智能运维）— 12 个月目标

**核心逻辑：从"人看数据做决策"变成"系统推荐最优方案"。**

| 能力 | 价值 | 技术路径 |
|------|------|----------|
| 告警根因分析 | 从 100 条告警中找到 1 个根因 | 拓扑关联 + 时序分析 |
| 容量预测 | 提前 30 天预警带宽瓶颈 | 时序预测模型 |
| 配置合规检查 | 持续确保配置与设计一致 | 配置快照 + Diff |
| VXLAN 路径追踪 | Overlay 故障秒级定位 | INT/Telemetry |
| 智能推荐 | "建议将 Leaf-03 的 ECN 阈值从 100 调整到 80" | 规则引擎 + ML |

---

## 六、AIDC 产品的深度思考

### 6.1 AIDC 产品的核心逻辑

**一句话：AIDC 网络管理的本质是"拥塞治理"。**

AI 训练的网络特征决定了：
- AllReduce 通信模式 → 全对全流量 → 极易产生 Incast 拥塞
- RoCE 无损要求 → PFC 反压 → 拥塞扩散（一个端口拥塞 → 整条路径反压）
- 微突发特征 → 传统采样监控看不到 → 需要细粒度遥测

所以 AIDC 产品的核心价值链是：

```
感知拥塞 → 定位拥塞 → 分析根因 → 治理拥塞 → 预防拥塞
   ↑           ↑          ↑          ↑          ↑
ECN/PFC    端口/队列    流级别     QoS调优    容量规划
遥测采集    Top5排名    路径追踪   阈值推荐    趋势预测
```

### 6.2 AIDC Dashboard 的设计逻辑

当前 AIDC Dashboard 的九宫格设计不是随意排列，而是围绕"拥塞治理"这条主线：

| 面板 | 在拥塞治理中的角色 | 运维人员的使用场景 |
|------|-------------------|-------------------|
| 网络健康度 | 全局概览——"网络整体怎么样？" | 每天第一眼看这里 |
| 队列丢包 Top5 | 定位——"哪里在丢包？" | 健康度下降时看这里 |
| ECN 报文数 Top5 | 定位——"哪里在拥塞？" | 发现拥塞趋势时看这里 |
| Headroom Buffer 趋势 | 趋势——"拥塞在恶化还是好转？" | 判断是否需要干预 |
| 网络拥塞趋势 | 趋势——"拥塞的时间规律是什么？" | 找到拥塞的时间模式 |
| 设备资源统计 | 基础——"设备本身有没有问题？" | 排除设备层面的问题 |
| 资产负载 Top5 | 基础——"哪些设备压力大？" | 容量规划参考 |
| 告警汇总 | 事件——"有没有严重事件？" | 紧急响应 |
| Events | 事件——"最近发生了什么？" | 时间线回溯 |

### 6.3 AIDC 产品的竞争策略

**我们打不过 NVIDIA Spectrum-X 的性能隔离，但我们可以打"可观测性"这张牌。**

| 竞争维度 | NVIDIA 的优势 | 我们的机会 |
|----------|--------------|-----------|
| 性能隔离 | 逐包 AR + 硬件 CC（我们做不到） | — |
| 可观测性 | NetQ 只管 NVIDIA 设备 | **多厂商 RoCE 监控**（客户网络不全是 NVIDIA） |
| 易用性 | NetQ 偏运维工具，学习曲线陡 | **Dashboard 化、可视化优先** |
| 成本 | Spectrum-X 全套很贵 | **轻量部署，按需付费** |
| 多租户可视 | 有但绑定 NVIDIA 生态 | **跨厂商的租户级网络视图** |

**具体策略：做"AIDC 网络的 Datadog"——不做数据面优化，做管理面的极致可观测性。**

---

## 七、云DC 产品的深度思考

### 7.1 云DC 产品的核心逻辑

**一句话：云DC 网络管理的本质是"自动化降本"。**

云DC 客户的核心诉求不是性能极致，而是：
- 业务上线快（Day 0/Day 1 自动化）
- 运维人力少（Day 2 智能化）
- 不被厂商锁定（多厂商支持）

### 7.2 云DC 产品的差距与路径

从竞品分析看，AmpCon 的差距已从“没有 Day 0 产品形态”变为“已有交互原型，但缺真实后端闭环”：

| 生命周期 | 竞品覆盖度 | AmpCon 当前覆盖 | 核心差距 |
|---|---|---|---|
| Day 0（基础建设） | 高 | 中低：已有 Inventory、L3 Fabric、Topology 和 Workspace UI 原型 | 无持久化、配置生成、真实 Build 和下发 |
| Day 1（业务部署） | 高 | 低：有导航与对象框架，业务 Studio 不完整 | 缺 VXLAN/VRF/租户资源模型及南向执行 |
| Day 2（运维监控） | 高 | 中：已有 Dashboard、Topology、告警和设备视图 | 真实遥测、诊断深度和闭环处置仍需加强 |

**策略保持聚焦，但阶段描述需要调整：**

```text
不做“全生命周期重型平台”
做“Day 2 可视化 + 轻量 Day 0”
先把已验证的 Provisioning 前端模型接成真实、可审计、可回退的最小闭环
再扩展 VXLAN EVPN、资源池和租户能力
```

前端原型的价值是降低需求与交互风险；下一阶段的成败标准不是增加更多静态页面，而是让同一个 Workspace 变化能够持久化、Build、同步、审批、执行并回写设备结果。

### 7.3 云DC 产品的竞争策略

| 客户类型 | 竞品短板 | 我们的切入点 |
|----------|---------|-------------|
| 多厂商混合网络客户 | H3C/华为只管自家设备 | **统一管理多品牌设备** |
| 中小规模 DC（<500 设备） | Cisco ACI/华为 NCE 太重 | **轻量部署，单机即用** |
| 已有 Fabric 但缺可视化 | 竞品可视化是附属功能 | **可视化作为核心卖点** |
| 需要 DC + Campus 统一管理 | 竞品 DC 和 Campus 是两个产品 | **融合平台，一套管全部** |

---

## 八、产品成功的关键判断

### 8.1 什么决定产品成功？

| 关键因素 | 权重 | 我们的状态 | 行动 |
|----------|------|-----------|------|
| 场景聚焦 | 30% | 🟡 需要更聚焦 | 先打 AIDC 可观测性，再扩云DC |
| 客户痛点命中 | 25% | 🟢 方向正确 | 持续验证：每月至少 2 个客户深访 |
| 产品体验 | 20% | 🟢 可视化体验好 | 持续打磨 Dashboard 和拓扑交互 |
| 生态开放 | 15% | 🟡 API 待建设 | 优先开放北向 REST API |
| 商业模式 | 10% | 🔴 待定义 | 按 App 订阅 vs 按设备数授权 |

### 8.2 产品经理必须回答的 5 个问题

| # | 问题 | 我的回答 |
|---|------|----------|
| 1 | 客户为什么买？ | AIDC：看到拥塞、快速定位、减少训练浪费。云DC：统一管理多厂商、降低运维复杂度 |
| 2 | 客户为什么买我们而不是竞品？ | 轻量（不需要集群）、多厂商（不锁定）、融合（一个平台管全部） |
| 3 | 客户愿意付多少钱？ | AIDC：按 GPU 集群规模，年费 10-50 万。云DC：按设备数，年费 5-20 万 |
| 4 | 第一批客户从哪来？ | 已有交换机客户中有 AI 业务的、多品牌混合网络的中型企业 |
| 5 | 什么时候能盈利？ | 20 个付费客户即可覆盖研发成本（假设 ARPU 15 万/年） |

### 8.3 最大的风险和应对

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| NVIDIA 把 NetQ 做成免费标配 | 中 | 高 | 强化多厂商价值，不和 NVIDIA 正面竞争 |
| 客户要求 Day 1 配置能力才买单 | 高 | 高 | 阶段 2 必须在 6 个月内交付 Fabric 构建能力 |
| 华为/H3C 降价抢市场 | 高 | 中 | 打差异化（多厂商+轻量），不打价格战 |
| 技术团队资源不足 | 高 | 高 | 聚焦核心场景，砍掉非关键功能 |

---

## 九、总结：产品方向的一页纸

```
┌─────────────────────────────────────────────────────────────────┐
│                    AmpCon DC 产品方向总结                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  定位：轻量级、多厂商、融合场景的网络智能运维平台                    │
│                                                                  │
│  核心价值：                                                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ 看得见      │  │ 管得了      │  │ 治得好      │             │
│  │ 可视化+监控 │→│ 自动化+编排 │→│ 智能+闭环   │             │
│  │ 已实现      │  │ 前端原型    │  │ 长期目标    │             │
│  │             │  │ 后端待闭环  │  │             │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                  │
│  AIDC 核心逻辑：拥塞治理的可观测性                                 │
│  云DC 核心逻辑：多厂商统一管理的自动化                              │
│                                                                  │
│  差异化：多厂商 × 轻量部署 × 融合场景 × 可视化优先                  │
│                                                                  │
│  不做：不做硬件级性能优化、不做全生命周期重型平台                     │
│  要做：做极致可观测性、做轻量自动化、做跨厂商统一视图                 │
│                                                                  │
│  成功标准：12 个月内 20 个付费客户，ARPU ≥ 15 万/年                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 九点一、Provisioning 收敛决策

本阶段不继续增加相互独立的配置页面，而是把所有设备配置来源收敛到一条受控链路：

```text
Network Design / Studios / Templates & CLI
→ Workspace Build / authoritative Diff / Submit
→ platform Action 或 AMPCon Work Order
→ Change Control
→ Running Verification / Compliance
```

Network Design 固定使用 `Fabric Design → Reconcile → Configuration Scope → Configuration Preview` 四步。Fabric Design 只表达逻辑目标；Inventory 独占设备与物理连接事实；Reconcile 生成共享 Solution Target Manifest；Configuration Preview 自动汇总所有来源并以 Device Review 展示 Designed/Running，但不承担正式 Build 和 Submit。

这一设计形成三条产品约束：

1. 任何来源都不能绕过 Workspace 与 Change Control；Submit 更新 Designed，执行成功并重新采集后才更新 Running。
2. 身份冲突、重复 Assignment 和端口归属冲突是硬门禁；未上线、LLDP 未形成等是部署 Findings，不能被绿色状态掩盖。
3. Templates & CLI 是独立高级来源，不伪装成 Studio；它与 Studio 的重叠只在共同 Workspace Build/Diff 中裁决。

当前原型已经把共享 Inventory 提升到 AIDC 应用层，并实现 Preview、Studio Contribution Review、Device Configuration Review 与前端 Reconcile gate；后端仍需补齐持久化 Manifest、真实 Build、RBAC、审计、Action/Task 映射和执行回写。

---

## 十、变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.5 | 2026-08-21 | 收敛 Provisioning 四步 Network Design、统一 Workspace/Change Control 生命周期、共享 Inventory 与 Solution Target Manifest、Reconcile 门禁、Configuration Preview 和 Templates & CLI 高级来源 | AmpCon Product Team |
| v1.4 | 2026-08-19 | 将 Blueprint 层横向对比扩展到 Arista、Apstra、华为和新华三，并拆分一等对象、对象层级、拓扑资源、变更版本、运行验证、GPU Pod 路径和 AMPCon 取舍七组细表 | AmpCon Product Team |
| v1.3 | 2026-08-19 | 补充 Juniper Apstra 业务视角，重点对比 Blueprint 与华为/新华三业务服务抽象；将 AMPCon 产品架构调整为 Intent Center、Studio Definition、Fabric Blueprint、Workspace/Change Control 四层 | AmpCon Product Team |
| v1.2 | 2026-08-19 | 确定“Intent Center 业务入口 + Studios 工程工作台 + Arista 对齐信任链”的产品架构，并链接字段级信任合同 | AmpCon Product Team |
| v1.1 | 2026-08-18 | 校准 Provisioning 当前状态：已有可交互前端原型，尚无后端配置闭环；更新阶段、云 DC 差距与路线判断，并链接 Provisioning 主设计文档 | AmpCon Product Team |
| v1.0 | 2026-05-14 | 初始版本 | AmpCon Product Team |
