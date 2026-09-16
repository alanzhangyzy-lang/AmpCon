# STD-AI-004 RoCE Access 软件需求规格说明书（SR）

| 项目 | 内容 |
|---|---|
| 文档编号 | SR-AMPCON-AIDC-ROCE-ACCESS-001 |
| Studio ID | `STD-AI-004` |
| Studio 名称 | `RoCE Access` |
| 版本 | v1.0 |
| 日期 | 2026-09-11 |
| 状态 | Draft |
| 适用产品 | AmpCon-DC AIDC Network |
| 目标读者 | 产品经理、网络架构师、前端开发、后端开发、测试工程师 |

> **对象声明**：本文档只定义 `STD-AI-004 / RoCE Access`，其工作流采用**左侧纵向导航**。本文档不描述 `STD-AI-005 / RoCE Access 2`；后者是独立的横向导航比较版本，不得与本 Studio 合并实现、共享名称或混用验收结果。

---

## 1. 文档目的与证据规则

本文档定义 RoCE Access 的产品定位、对象边界、四阶段工作流、字段与默认值、Domain/Leaf/NIC 模型、Inventory/LLDP 依赖、Topology 行为、Workspace 生命周期、校验、RBAC、验收标准及当前原型差距。

需求使用三类状态标识：

- **[CURRENT] 当前实现**：可由当前前端代码直接确认的行为。
- **[TARGET] 产品目标**：产品化后必须满足的权威行为，可能需要后端或平台能力。
- **[LIMIT] Demo 限制**：当前界面可展示但尚未形成真实闭环的能力。

证据优先级：

1. 用户确认的页面层级、标签、位置与视觉反馈是 UI 第一基准。
2. 当前代码用于确认已经实现的字段、默认值和交互。
3. Arista 官方资料用于确认 Studios、Workspace、Build、Submit 与 Change Control 语义。
4. RoCE Access 的 Domain、NIC 规划、批量 VLAN/IP 生成和 Access Topology 是 **AmpCon 产品扩展**，不得描述为 Arista 原生 Studio 行为。

---

## 2. 背景与产品目标

### 2.1 背景

AIDC 裸金属 GPU 服务器通常具有 2、4、8 或 16 个高速 NIC。每个 NIC 或 NIC 组需要映射到不同 Leaf，并为 Leaf 下行端口批量生成 VLAN、网关、PVID、VLAN Interface 和 MTU 等接入意图。若逐设备、逐端口配置，规模化部署容易出现 Leaf–NIC 错配、VLAN/IP 重复和端口占用冲突。

RoCE Access 提供一个面向网络工程师的 Access Workbench：先规划单服务器 NIC 扇出和 Leaf 规模，再生成网络参数、绑定真实 Inventory Leaf，最后确认每台设备的目标接入配置。
### 2.2 产品目标

1. 通过 `Server NIC Total` 与 `Single-Server Access Port Count per Leaf` 建立可预测的 Leaf–NIC Domain 模型。
2. 通过起始 VLAN、起始网关和步长批量生成 Leaf 接入参数。
3. 优先使用 Inventory 和已接受的 LLDP 事实自动分配物理 Leaf 与端口。
4. 允许用户在 Device Allocation 中交换逻辑 Leaf/NIC 组，但不复制物理设备事实。
5. 在 Topology 中清晰表达 Leaf、NIC、VLAN、IP 和端口关系，并区分逻辑端口与真实目标端口。
6. 模拟 Leaf 可以参与设计预览，但不能进入最终 Apply。
7. Studio 只保存 Workspace input；配置必须经过 Build、Review、Submit 和受控 Change Control 执行。

### 2.3 成功指标

| 指标 | 目标 |
|---|---|
| 规划效率 | 一次输入可生成最多 1024 台 Leaf 的 Domain、VLAN 和网关规划 |
| 映射正确性 | 已接受 LLDP 存在时优先复用观测到的 Leaf–Server 连接 |
| 可解释性 | 任一 Config Confirm 链路可定位到 Device、Leaf interface、NIC、VLAN 和 IP |
| 安全门禁 | 模拟/未分配 Leaf、无 Check Network、字段错误或不完整 Domain 均阻止 Apply |
| 生命周期合规 | Studio 不直接写设备；执行必须由 Workspace 后续受控流程完成 |

---

## 3. 产品定位与职责边界

### 3.1 对象所有权

| 对象/事实 | Owner | RoCE Access 用法 |
|---|---|---|
| Device identity、Hostname、Management IP、Model、Role | Inventory and Topology | 只读筛选与物理 Leaf Assignment |
| Physical interface、已接受 LLDP connection | Inventory and Topology | 只读生成映射与真实端口证据 |
| Fabric、Pod、Leaf membership | Fabric / Network Design | 只读限定可选 Leaf 范围 |
| Access scale、Domain、VLAN/IP、逻辑 Leaf/NIC 映射 | RoCE Access | Studio input 与生成结果 |
| Workspace revision、Build、Synchronize、Review、Submit | Workspace 平台 | 候选变更隔离与验证 |
| Provisioning Action / 产品工作单 | Provisioning adapter / AmpCon | 将已提交 revision 映射为受控执行对象 |
| 审批、排期、执行、日志 | Change Control | 最终设备变更控制 |
| Running state、compliance | Inventory / Telemetry / Compliance | 执行后验证，不由 Studio 写入 |

### 3.2 与相邻模块的边界

- **Intent Center**：只表达业务意图并预填或调用本 Studio；不拥有设备配置、Domain、Workspace、Build、Tasks 或 Change Control 状态。
- **Inventory and Topology**：是物理设备、接口和连接的唯一事实源；RoCE Access 不维护第二份物理拓扑。
- **RoCE Lossless Policy**：负责 PFC、ECN/WRED、队列和无损 QoS；RoCE Access 负责 VLAN/IP/接入端口意图，两者不得互相复制字段。
- **Templates & CLI**：是独立高级配置源；其输出必须与本 Studio 在同一 Workspace Build 中检测重叠和冲突。
- **RoCE Access 2**：`STD-AI-005` 独立比较版本，采用水平导航，不属于本文档范围。

### 3.3 Arista 与 AmpCon 语义边界

Arista 官方 Studios 工作流使用 Workspace 承载一个或多个 Studio 变更，经 Build、Review、Submit 后进入 Change Control。RoCE Access 本身、Access Domain、批量 NIC/Leaf 规划及其页面布局均是 AmpCon 扩展。

Arista Studios 提交后通常形成可进入 Change Control 的 provisioning actions；Arista Classic Network Provisioning 另有 Task 路径。AmpCon 可以在顶级导航中提供 `Tasks`，但必须将其定义为映射已提交 Workspace revision 的产品工作单或平台对象视图，不得宣称“每个 Arista Studio Workspace 必然生成 Arista Task”，也不得重复创建可执行对象。

---

## 4. 用户角色与目标

| Persona | 主要目标 | 典型权限 |
|---|---|---|
| AIDC Network Architect | 定义 NIC 扇出、Leaf 数量、Domain 和地址规划 | Read、Edit Studio、Save |
| Network Operator | 核对 Inventory/LLDP，分配真实设备并处理异常映射 | Read Inventory、Assign、Save |
| Workspace Reviewer | 检查输入、生成配置、冲突、Warning 和设备 Diff | Review、Build |
| Change Approver | 审批目标设备、窗口、顺序和风险 | Approve/Reject |
| Change Executor | 在授权窗口执行、查看日志和失败设备 | Execute/Cancel/Remediate |
| Auditor | 查看 revision、操作者、审批和执行证据 | Read/Audit |

---

## 5. 术语与计算模型

| 术语 | 定义 |
|---|---|
| Server NIC Total | 单台服务器参与本接入网络的 NIC 总数；取值 2/4/8/16。 |
| Access Port Count per Leaf | 单台 Leaf 承载同一服务器的 NIC 数量。 |
| Logical Leaf / Device ID | Domain 内的逻辑位置 `Leaf1...LeafN`，不是物理设备 ID。 |
| Domain | 一组共同覆盖一台服务器全部 NIC 的逻辑 Leaf 集合。 |
| Generated mapping | 无可用 LLDP 时按规划算法生成的 Leaf/NIC 或目标端口。 |
| LLDP mapping | 从 Inventory 已接受连接事实解析出的 Leaf/NIC/端口关系。 |
| Adjusted mapping | 用户在 Device Allocation 中交换后的逻辑 Leaf/NIC 关系。 |
| Apply | 将有效 Studio input 保存到当前 Workspace；不代表设备部署。 |

核心计算：

```text
leavesPerDomain = serverNicTotal / accessPortsPerLeaf
domainCount = ceil(leafNumber / leavesPerDomain)
NICs(Leaf k) = ((k-1) × accessPortsPerLeaf + 1) ... (k × accessPortsPerLeaf)
VLAN(Leaf i) = startVlan + i × vlanStep
Gateway(Leaf i) = startGateway + i × subnetStep × subnetBlockSize
serverCapacityPerLeaf = floor(leafDownlink / accessPortsPerLeaf)
```

`serverNicTotal` 必须能被 `accessPortsPerLeaf` 整除；最终 Apply 时 `leafNumber` 必须形成完整 Domain。
---

## 6. 前置条件与依赖

| 依赖 | [TARGET] 要求 | 失败处理 |
|---|---|---|
| Open Workspace | 用户选择可写 Pending/Open Workspace | 所有写操作禁用 |
| Fabric | 至少一个有效 Fabric，且包含可访问 Leaf scope | 阻止 Check Network / Apply |
| Inventory | 最终目标 Leaf 已注册且 Role=Leaf | 未注册或模拟设备阻止 Apply |
| Topology/LLDP | 自动映射时只读取已接受的连接事实 | 无 LLDP 时允许 Generated，但必须明确标识 |
| Interface capability | 型号、端口数量、速率、占用状态可查询 | Build 输出设备/接口级错误 |
| Workspace/Build service | 支持 revision、保存、Build 和问题定位 | 保存失败保留本地草稿并允许重试 |
| RBAC | 服务端返回每项操作的 allowed/denial reason | UI 禁用并显示原因，API 再次鉴权 |

---

## 7. 信息架构与端到端流程

### 7.1 页面层级

`STD-AI-004 / RoCE Access` 使用左侧纵向导航，分为两组：

```text
1. RoCE Access Planning
   ├─ Network Plan
   └─ Network Recommended
2. Allocation & Confirmation
   ├─ Device Allocation
   └─ Config Confirm
```

页面右侧在 Network Plan、Network Recommended 和 Config Confirm 显示 Topology；Device Allocation 使用整页双列表，不显示 Topology。

### 7.2 标准流程

```text
选择 Open Workspace
→ Network Plan：定义 Fabric、NIC/Leaf 规模与下行端口范围
→ Check Network：校验并生成 Domain、逻辑 Leaf/NIC 与初始 Assignment
→ Network Recommended：生成/调整 VLAN 与 Gateway
→ Device Allocation：把逻辑位置绑定到真实 Inventory Leaf，可交换 Leaf/NIC 组
→ Config Confirm：确认设备、Domain、VLAN、Gateway、Switch Port 与右侧 Topology
→ Apply / Save to Workspace
→ Workspace Build（权威校验、生成配置、检测冲突）
→ Synchronize / Review / Submit
→ Provisioning Actions 或 AmpCon 映射工作单
→ Change Control 审批、排期、执行
→ Running/Compliance 验证或创建补偿变更
```

### 7.3 状态边界

- Check Network 只生成前端候选规划，不是 Workspace Build。
- Apply/Save to Workspace 只保存 Studio input，不直接操作设备。
- Build Succeeded 只表示当前 Workspace revision 可生成有效候选配置。
- Submit 更新 Designed/Mainline 候选事实，不等于 Running 已更新。
- 只有 Change Control 执行并经设备回采验证后，才能显示执行完成/Compliant。

---

## 8. 四阶段功能需求

### 8.1 Network Plan

#### 8.1.1 Basic Configuration

| 字段 | 类型 | 必填 | 默认值 | 规则 |
|---|---|---:|---|---|
| Configuration Name | Text | 是 | `AIDC RoCE Access` | Trim 后非空 |
| Fabric | Select | 是 | 首个可用 Fabric（草稿初始 `fabricId` 为空） | 只显示用户有权访问的 Fabric；切换后清空设备分配 |

#### 8.1.2 Access Scale

| 字段 | 类型 | 默认值 | 允许值/范围 | 联动 |
|---|---|---:|---|---|
| Server NIC Total | Select | 8 | 2、4、8、16 | 修改后清空 Assignment 和手工 override |
| Single-Server Access Port Count per Leaf | Select | 1 | UI 候选 1、2、4、8、16；必须 ≤ NIC Total 且整除 NIC Total | 决定每 Domain Leaf 数与每 Leaf NIC 组 |
| Leaf Number | Integer | 8 | 1–1024 | 修改后清空 Assignment 和 override |
| Leaf Downlink | Integer | 56 | 1–128 | 修改后自动重算 End Port |
| Start Port | Integer | 1 | ≥1 | 修改后 `End = Start + Leaf Downlink - 1` |
| End Port | Read-only | 56 | 派生值 | 不允许直接编辑 |

#### 8.1.3 Check Network

- [CURRENT] 校验基础字段后自动建立 Access Domains。
- [CURRENT] 自动分配顺序：按 Server LLDP 关系聚类并按 NIC 顺序排列 → 未关联真实 Leaf → 模拟 Leaf。
- [CURRENT] 结果提示包含 Leaf 数、Domain 数、LLDP 映射数和模拟设备数。
- [TARGET] Check Network 必须记录使用的 Fabric/Inventory revision 和规划算法版本；任一规模字段或 Fabric 变化后结果失效。
- [TARGET] 自动结果必须可解释：每个 Leaf 显示 `LLDP`、`Generated` 或 `Adjusted` 来源。

### 8.2 Network Recommended

#### 8.2.1 Set Up Network

| 字段 | 类型 | 必填 | 默认值 | 范围/规则 |
|---|---|---:|---|---|
| Domain | Read-only Select | 是 | All | 当前原型只支持全 Domain 批量设置 |
| Start VLAN ID | Integer | 是 | 10 | 2–4094，所有生成值不得超过 4094 |
| VLAN ID Step | Integer | 是 | 1 | 1–100 |
| Start Gateway | IPv4/Prefix | 是 | `192.168.10.254/24` | IPv4 octet 0–255，prefix 0–32；目标实现需完整解析 |
| Subnet Step | Integer | 是 | 1 | 1–100，按 prefix 对应 block 递增 |

Apply 只更新当前 Workspace 草稿中的 VLAN/IP 生成参数，并立即刷新表格和 Topology；不执行设备配置。

#### 8.2.2 Domain 浏览与结果表

- 支持 Previous/Next、Domain 下拉和 Domain 卡片快速切换。
- 搜索匹配 Device、VLAN 或 IP，并显示 `shown/total`。
- 摘要显示当前 Domain 的 VLAN Allocation、IP Allocation 及各自 Step。
- 表格列：`Device ID`、`Domain`、`VLAN ID`、`Gateway`、`Action`。
- 单行 Edit 当前复用全局 Set Up Network；[TARGET] 若支持单行 override，必须在数据模型中显式记录来源并执行全局冲突校验。

### 8.3 Device Allocation

#### 8.3.1 Access and Interface Behavior

| 字段 | 控件 | 默认值 | 产品语义 |
|---|---|---:|---|
| Sync downlink PVID | Toggle | Enabled | 将目标下行 access/native PVID 与生成 VLAN 同步 |
| VLAN Interface Config | Radio | Link Discovery | 当前唯一可见模式；依赖连接事实决定接口映射 |
| Local Proxy ARP | Toggle | Disabled | 高级接入参数，设备能力不支持时 Build 报错 |
| ARP Direct Route Adv | Toggle | Disabled | 高级接入参数，设备能力不支持时 Build 报错 |
| ARP Aging Timer (sec) | Integer | 1800 | 60–86400 |
| MTU | Integer | 9216 | 1500–9216；设备和端口必须支持 |

内部草稿还包含 `configureVlanInterface`、`linkDiscovery` 和 `addressPlanning`；当前 UI 未提供完整模式切换。[TARGET] 在模式定义、字段联动和配置生成契约确定前，不得把隐藏状态当作正式用户能力。

#### 8.3.2 Site Devices

- 只显示当前 Fabric 范围的 Leaf；当前 Demo 会补充模拟 Leaf 以完成规划预览。
- 搜索匹配 Sysname、Management IP、Role/Custom Role。
- 已分配设备显示所属 Domain 并禁用再次选择；同一物理 Leaf 只能属于一个 Domain slot。
- 表头全选只作用于当前可选筛选结果。

#### 8.3.3 Selected Devices

- 可按 All Domains 或单 Domain 查看，并按 Sysname、Leaf、NIC 搜索。
- 表格列：`Sysname`、`Device ID`、`NIC Port`、`Domain`。
- `Device ID` 是 `Leaf1...LeafN` 逻辑位置，不是 Inventory 主键。
- 修改 Device ID 时，系统在同一 Domain 内交换相关逻辑位置并重算 NIC 组，避免重复占用。
- 映射调整后来源标记为 `Adjusted`；Inventory 设备身份和 LLDP 原始事实保持不变。

### 8.4 Config Confirm

#### 8.4.1 左侧确认表

表格只展示配置确认所需的简洁信息：

| 列 | 说明 |
|---|---|
| Device | 物理 hostname；未分配时为 `Unassigned` 并提示风险 |
| Domain | Domain 归属 |
| VLAN ID | 最终生成或 override 的 VLAN |
| Gateway | 最终 IPv4/prefix |
| Switch Port | LLDP 发现端口；无 LLDP 时显示生成的目标端口/范围 |

左表不得再次展示 `Leaf1 · N NICs · LLDP/Generated/Adjusted` 等第二行摘要。完整 Leaf–NIC–端口关系由右侧 Topology 表达。

#### 8.4.2 Apply 门禁

Apply 必须同时满足：

1. Configuration Name 与 Fabric 有效。
2. Server NIC Total、Access Port Count、Leaf Number、Downlink 范围有效。
3. VLAN 与 Gateway 生成规则有效，所有 VLAN 均在 2–4094。
4. Leaf Number 能形成完整 Domain。
5. 已执行且未失效的 Check Network 存在。
6. MTU 和 ARP Aging Timer 合法。
7. 每个 slot 都绑定真实、已注册、当前 Fabric 范围内的物理 Leaf。
8. 不存在 simulated 或 unassigned Leaf。
9. [TARGET] 不存在接口能力、端口占用、VLAN/IP、配置所有权或并发 revision 阻断错误。

成功后文案必须为 `Saved to <Workspace>. Workspace Build is required before submission.`，不得显示 `Deployed`、`Applied to devices` 或同义文案。
---

## 9. Domain、Leaf、NIC 与端口模型

### 9.1 Domain 完整性

| NIC Total | Ports per Leaf | Leafs per Domain | 单 Leaf NIC 组示例 |
|---:|---:|---:|---|
| 8 | 1 | 8 | Leaf1→NIC-1，…，Leaf8→NIC-8 |
| 8 | 2 | 4 | Leaf1→NIC-1/2，…，Leaf4→NIC-7/8 |
| 8 | 4 | 2 | Leaf1→NIC-1..4，Leaf2→NIC-5..8 |
| 8 | 8 | 1 | Leaf1→NIC-1..8 |
| 16 | 1 | 16 | Leaf1→NIC-1，…，Leaf16→NIC-16 |
| 16 | 16 | 1 | Leaf1→NIC-1..16 |

同一公式适用于 2 和 4 NIC。UI 可以展示不完整 Domain 以辅助规划，但最终 Apply 必须阻止。

### 9.2 PlannedLeaf 最小模型

```ts
type PlannedLeaf = {
  index: number;
  domainId: string;
  logicalLeaf: string;          // Leaf1...LeafN
  nicNumbers: number[];         // 1-based NIC numbers
  deviceId?: string;            // Inventory canonical ID
  hostname: string;
  simulated: boolean;
  mappingSource: 'LLDP' | 'Generated' | 'Adjusted';
  leafInterfaces: string[];
  vlan: number;
  gateway: string;
};
```

[TARGET] API 必须保存稳定 ID 和 revision，不能使用 hostname、数组位置或 UI 文案作为跨对象关联键。

### 9.3 LLDP 解析规则

1. 只读取当前 Fabric 中 `Leaf ↔ Endpoint` 的已接受 Inventory connection。
2. 无论 connection 的 source/target 方向如何，均归一化为 `leafInterface` 与 `serverInterface`。
3. 从服务器接口名末尾数字解析 NIC 序号；解析失败的连接保留为证据，但不得静默绑定错误 NIC。
4. 同一 Leaf 连接多个服务器时，当前自动算法选择连接数量最多、最小 NIC 序号最靠前的服务器组；[TARGET] 产品需让用户显式选择 Server/Node Group，避免跨服务器误聚类。
5. LLDP 与用户调整冲突时，保留 LLDP 事实并将候选标记为 Adjusted；Build 必须输出差异 Warning 或 Error。

### 9.4 Generated 端口规则

- Network Plan/Network Recommended 的 Topology 端口是规划标签，如 `Access-1`，不代表真实物理接口。
- Config Confirm 优先显示 LLDP 中实际 Leaf interface。
- 无 LLDP 时，Config Confirm 可显示按 Downlink Start 与本 Leaf 本地链路序号生成的目标端口（如 `Ethernet1`），但必须标识为 Generated，且 Build 必须校验设备真实接口存在、可用且未被其他配置占用。
- UI 不得在规划阶段把 `Access-1` 伪装成已发现的 `Ethernet1`，也不得在无 LLDP 时把 Generated 描述为 observed。

---

## 10. Topology 视觉与交互要求

### 10.1 展示阶段

| 阶段 | Topology | Leaf 标签 | 端口语义 |
|---|---|---|---|
| Network Plan | 显示 | 逻辑 Leaf | `Access-N` 逻辑标签 |
| Network Recommended | 显示 | 已分配时 hostname，否则逻辑 Leaf | 仍为规划标签，不显示为真实发现端口 |
| Device Allocation | 不显示 | — | 通过双列表完成分配 |
| Config Confirm | 显示 | 物理 hostname | LLDP 实际端口优先，否则 Generated 目标端口 |

### 10.2 图形内容

- 每个 Domain 独立展示 Leaf 行和 Server/NIC 行。
- Leaf 与 NIC 使用常规字重，不使用粗体；当前目标字号分别约 10.8px 与 10.4px。
- 每条链路包含 VLAN/IP 卡片；RoCE Access 目标卡片宽度 108px，VLAN 字号约 11.4px，IP 字号约 10px。
- VLAN/IP 卡片在 1/2/4/8/16 Access Port Count 下保持统一纵向基准，约位于链路的 64%。
- 多 NIC 扇出使用三次贝塞尔曲线；Leaf 侧从节点边缘立即弯曲，并在 VLAN/IP 卡片上方展开，避免公共直线段和 16 NIC 拥挤。
- 端口标签位于对应 VLAN/IP 卡片上方并水平对齐；上移间距按单 Leaf 链路数自适应：1 路约 35px、2–4 路约 37px、8–16 路约 39px。

### 10.3 Hover 与 View ports

- 悬浮单条链路时只显示精简关系，如 `AIDC-GPU-Leaf-01 Et1 ↔ NIC-1`，不追加状态、速率或冗余说明。
- 悬浮时只显示该链路的端口标签。
- `View ports` 显示当前 Topology 全部端口标签；再次点击变为 `Hide ports` 并隐藏常驻标签。
- RoCE Access 端口标签目标字号约 9px、字重 500，并使用白色描边保证曲线上可读。
- Zoom in、Zoom out、Fit view 始终可用；8 NIC 及以下可 fit-to-container，密集拓扑允许更宽画布。

### 10.4 可访问性

- Topology 使用 `role="img"` 和可读 aria-label。
- View/Hide ports 使用 `aria-pressed` 与动态 aria-label。
- 节点可通过 Enter/Space 激活；图标按钮必须有 title/aria-label。
- 颜色不是唯一状态表达；LLDP/Generated/Adjusted 和 validation 必须有文本。

---

## 11. 验证、冲突与错误处理

### 11.1 即时字段校验

| 编号 | 场景 | 处理 |
|---|---|---|
| VAL-001 | Configuration Name 为空 | 阻止 Check Network/Apply |
| VAL-002 | Fabric 为空或已删除 | 清空失效 Assignment，阻止 Apply |
| VAL-003 | NIC Total 非 2/4/8/16 | 阻止 Check Network |
| VAL-004 | Ports per Leaf ≤0、>NIC Total 或不能整除 | 阻止 Check Network |
| VAL-005 | Leaf Number 不在 1–1024 | 阻止 Check Network |
| VAL-006 | Downlink Start<1 或 End/Count 不一致 | 阻止 Check Network |
| VAL-007 | VLAN 起始值/生成值超出 2–4094 | 阻止 Apply |
| VAL-008 | VLAN/Subnet Step 不在 1–100 | 阻止 Set Up Network Apply |
| VAL-009 | Gateway 非合法 IPv4/prefix | 字段错误并阻止 Apply |
| VAL-010 | MTU 不在 1500–9216 | 阻止 Apply |
| VAL-011 | ARP Aging Timer 不在 60–86400 | 阻止 Apply |
| VAL-012 | Leaf Number 不能形成完整 Domain | 阻止 Apply |
| VAL-013 | Check Network 未执行或已失效 | 阻止 Apply |
| VAL-014 | 存在 simulated/unassigned Leaf | 列出缺失数量并阻止 Apply |

### 11.2 Build 权威校验

前端校验只用于即时反馈；后端 Build 必须至少重复并扩展以下检查：

- Fabric、Device、Interface reference 和 revision 仍有效。
- 每台设备 Role=Leaf，且仍属于目标 Fabric scope。
- 目标 interface 存在、速率/MTU/模式受支持、未被互斥配置占用。
- LLDP 事实与候选 Assignment 的漂移或冲突。
- VLAN ID 唯一性、保留范围、跨 Studio ownership 和设备现有配置冲突。
- Gateway octet、prefix、network/broadcast/host 合法性、子网重叠和地址池 ownership。
- PVID、VLAN Interface、Proxy ARP、ARP route advertisement 的设备能力。
- Templates & CLI 或其他 Studio 对同一配置节点的重叠。
- 当前 Build 必须属于当前 Workspace revision；任何输入变化使旧 Build 失效。

### 11.3 问题结构

```json
{
  "code": "ROCE_ACCESS_INTERFACE_CONFLICT",
  "severity": "error",
  "studioId": "STD-AI-004",
  "studioPath": "domains[0].leaves[0].leafInterfaces[0]",
  "deviceId": "device-id",
  "interfaceName": "Ethernet1",
  "message": "The target interface is owned by another configuration source.",
  "remediation": "Choose another downlink or resolve the source conflict."
}
```

Error 阻止 Submit；Warning 可按平台策略允许继续，但必须在 Review 中可见并可追踪确认人。
---

## 12. Workspace、Build、Tasks 与 Change Control

### 12.1 Workspace 状态与操作

| 维度 | 典型状态 | 说明 |
|---|---|---|
| Workspace lifecycle | Pending/Open、Submitted、Abandoned | 不得用 Built 代替 lifecycle |
| Build state | In Progress、Success、Fail、Canceled、Skipped | 属于某个 Workspace revision |
| Synchronization | Current、Out of date、Conflict | Workspace 与 Mainline 的关系 |
| Validation severity | Error、Warning、Info | Build 问题等级 |
| Execution | 由 Change Control/Action 状态映射 | 不得由 Studio 本地状态写入 |

[TARGET] Studio 保存必须携带 `workspaceId`、`workspaceRevision`、`baseMainlineRevision`、`studioId=STD-AI-004`、input changes、assignment changes 和审计信息，并使用 revision/ETag 防止覆盖并发修改。

### 12.2 Save、Build、Review 与 Submit

1. Save to Workspace 保存结构化 Studio input，设置 `needsBuild=true`。
2. Build 执行 Input Validation、配置生成、配置验证及适用的平台校验。
3. Mainline 变化后先 Synchronize；冲突不得静默覆盖。
4. Review 必须固定 workspace revision、build ID、来源、设备 Diff、错误与 Warning。
5. Submit 服务端原子校验：Pending、同步为 Current、当前 revision Build Success、无阻断 Error、有 Submit 权限。
6. Submit 后 Studio 只读；不得把设备显示为已配置完成。

### 12.3 Tasks / Provisioning Actions

- [TARGET] 已提交 Workspace revision 映射为不可变的 provisioning action refs。
- [AMP] 若 AmpCon `Tasks` 页面展示产品工作单，必须保存 source workspace/revision、目标设备、diff digest、platform object type/ref 和 idempotency key。
- 同一 submitted revision + device + operation 只能产生一个执行对象，避免 Task 与 Action 双重执行。
- UI 必须明确产品工作单与 Arista Classic Task 的差异。

### 12.4 Change Control 与恢复

- Change Control 拥有执行计划、阶段/串并行关系、审批、排期、执行、日志和审计。
- 修改 action 集、目标设备、顺序或 plan revision 后，已有审批必须失效。
- 执行前重新检查设备可达性、Running 配置漂移和维护窗口。
- 失败必须记录设备、接口、阶段、attempt、错误码、日志引用和 retryable。
- 未得到平台已回滚并完成验证的证据前，不得显示 `Rolled back`。
- 默认恢复路径是创建关联原 Change Control 的补偿 Workspace，重新 Build、审批、执行并验证。

---

## 13. RBAC 与审计

本 SR 不硬编码具体角色名称，使用能力权限：

| 能力 | 允许操作 |
|---|---|
| `roceAccess.read` | 查看 Studio、规划、Assignment 和确认结果 |
| `roceAccess.write` | 编辑 input、Set Up Network、调整 Assignment、保存 Workspace |
| `inventory.read` | 读取设备、接口和 LLDP 事实 |
| `workspace.build` | 触发/取消 Build |
| `workspace.synchronize` | 同步 Mainline 并处理冲突 |
| `workspace.submit` | 提交当前有效 revision |
| `changeControl.create` | 创建或编辑执行计划 |
| `changeControl.approve` | 审批/拒绝当前 plan revision |
| `changeControl.execute` | 排期、执行、取消或发起恢复流程 |

前端禁用不能替代服务端鉴权。每次写操作至少审计 actor、角色、workspace/revision、对象路径、before/after digest、时间、request ID、结果和原因。审批与执行应支持职责分离策略。

---

## 14. 非功能需求

| 类别 | 要求 |
|---|---|
| 性能 | 1024 Leaf 规划在正常客户端 2 秒内完成；表格使用分页或虚拟化避免长任务阻塞 |
| 可用性 | 保存失败不丢失本地草稿；支持重试与恢复未保存编辑 |
| 一致性 | Workspace 保存原子化；部分写入失败不得留下半套 Domain/Assignment |
| 可观测性 | 记录 Check Network、Build、Submit、执行耗时与错误码，不记录凭据 |
| 安全 | 服务端输入校验、RBAC、CSRF 防护、输出编码和审计防篡改 |
| 可访问性 | 键盘操作、可见 focus、字段错误关联、状态非纯颜色表达 |
| 响应式 | 保持当前 Workbench 风格；窄屏通过最小宽度和内部滚动保留表格/Topology 可用性 |
| 可维护性 | 规划算法、配置生成和设备适配分层；前端不得成为权威生成器 |

---

## 15. 验收标准

### 15.1 身份与导航

| 编号 | Given / When / Then |
|---|---|
| AC-001 | 打开 `STD-AI-004` 时，标题为 `RoCE Access`，使用左侧纵向导航。 |
| AC-002 | `STD-AI-005 / RoCE Access 2` 保持独立横向版本，不影响本 Studio 草稿。 |
| AC-003 | 页头明确说明这是 AmpCon extension，并由共同 Workspace lifecycle 管理。 |

### 15.2 Network Plan

| 编号 | Given / When / Then |
|---|---|
| AC-010 | 新建草稿时默认 NIC=8、Leaf=8、Ports per Leaf=1、Downlink=56、Range=1–56。 |
| AC-011 | NIC=8、Ports per Leaf=2 时，生成每 Domain 4 个 Leaf，每 Leaf 2 个连续 NIC。 |
| AC-012 | Ports per Leaf 不能整除 NIC Total 时，Check Network 被阻止并显示字段级原因。 |
| AC-013 | 修改 NIC Total、Ports per Leaf 或 Leaf Number 后，旧 Assignment 和 override 失效。 |
| AC-014 | 有已接受 LLDP 时自动映射优先使用 LLDP；无 LLDP 时明确标为 Generated。 |

### 15.3 Network Recommended

| 编号 | Given / When / Then |
|---|---|
| AC-020 | 默认 Start VLAN=10、VLAN Step=1、Gateway=`192.168.10.254/24`、Subnet Step=1。 |
| AC-021 | Set Up Network Apply 后，所有 Domain 表格和 Topology 同步刷新。 |
| AC-022 | 任一生成 VLAN 超过 4094 时 Apply 被阻止。 |
| AC-023 | Gateway octet 超过 255、prefix 非法或子网溢出时显示错误。 |
| AC-024 | 搜索 Device/VLAN/IP 只过滤当前结果，不修改 Assignment。 |

### 15.4 Device Allocation

| 编号 | Given / When / Then |
|---|---|
| AC-030 | 同一物理 Leaf 已分配后，在 Site Devices 中禁用再次选择并显示所属 Domain。 |
| AC-031 | Device ID 从 Leaf1 改为 Leaf2 时，同 Domain 对应逻辑位置与 NIC 组交换，不产生重复 NIC。 |
| AC-032 | Device Allocation 页面不显示 Topology，使用双列表完成设备分配。 |
| AC-033 | simulated Leaf 可用于设计预览，但 Config Confirm Apply 必须阻止。 |
| AC-034 | MTU<1500 或 >9216、ARP Timer<60 或 >86400 时 Apply 被阻止。 |

### 15.5 Config Confirm 与 Topology

| 编号 | Given / When / Then |
|---|---|
| AC-040 | 左表只显示 Device、Domain、VLAN ID、Gateway、Switch Port。 |
| AC-041 | 左表不显示 `Leaf1 · N NICs · LLDP/Generated/Adjusted` 第二行。 |
| AC-042 | Network Plan/Recommended 链路端口显示 `Access-N` 逻辑标签，不伪装为真实端口。 |
| AC-043 | Config Confirm 有 LLDP 时显示实际 Leaf interface；无 LLDP 时显示 Generated 目标端口。 |
| AC-044 | 悬浮链路只显示精简 `Leaf port ↔ NIC` 关系。 |
| AC-045 | View ports 显示全部端口，再次点击 Hide ports 可撤销。 |
| AC-046 | Ports per Leaf=1/2/4/8/16 时 VLAN/IP 卡片位置一致，端口名不与卡片重叠。 |
| AC-047 | 16 NIC 扇出链路从 Leaf 边缘弯曲并在卡片上方展开，不形成拥挤公共直线。 |

### 15.6 Workspace 生命周期

| 编号 | Given / When / Then |
|---|---|
| AC-050 | 未选 Workspace 时所有写操作禁用。 |
| AC-051 | Save 成功只显示 Saved/Build Required，不显示已部署。 |
| AC-052 | Build 不属于当前 revision 时 Submit 被阻止。 |
| AC-053 | Submit 后 Designed 可更新，但 Running 只有 Change Control 执行并验证后才更新。 |
| AC-054 | AmpCon Tasks 映射不得造成同一 submitted revision 重复执行。 |
| AC-055 | 执行失败可定位到设备/接口/阶段；无回滚证据时不得显示 Rolled back。 |
---

## 16. 当前实现状态与产品化差距

| 能力 | [CURRENT] 当前前端 | [TARGET] 产品化要求 |
|---|---|---|
| 草稿 | React 内存中的 `VlanAccessDraft` | Workspace 持久化、revision、审计、刷新恢复 |
| Studio 区分 | `STD-AI-004` 纵向；`STD-AI-005` 横向 | 独立 API object/revision，禁止串稿 |
| Domain 生成 | 本地公式与数组生成 | 后端权威规划服务、算法版本和可重放结果 |
| Inventory | 读取共享 registered devices/connections | 服务端 canonical IDs、revision 和权限过滤 |
| LLDP | 前端从 connection 解析 | 明确 accepted evidence、冲突和观测时间 |
| 模拟 Leaf | 自动补齐到 Leaf Number | 仅设计预览；不可 Build/Submit 为真实目标 |
| Gateway 校验 | 正则检查格式；部分计算检查 octet | 完整 IPv4/prefix、溢出、网段与 host 合法性 |
| 端口能力 | Generated 字符串或 LLDP 名称 | 型号/速率/MTU/占用/所有权权威校验 |
| VLAN/IP 冲突 | 仅范围检查 | 跨 Domain、设备、Studio、地址池冲突检测 |
| Save to Workspace | 设置本地时间戳和提示 | 持久化 modification 与 `needsBuild=true` |
| Build | 页面文案/门禁概念 | 真实 build run、stages、issues 和 generated config |
| Tasks | 顶级静态原型 | 对 Action/Task 的明确映射与幂等执行 |
| Change Control | 静态演示 | 审批、排期、执行、日志、结果和恢复闭环 |
| RBAC | 主要依靠 UI disabled | 服务端能力鉴权与 denial reason |
| Compliance | 未实现 | 执行后 Running 回采与 Designed 对比 |

当前 Demo 不能被视为真实设备配置工具。特别是 Save/Apply、Build、Submit、Tasks、Change Control 和回滚均未形成后端闭环。

---

## 17. 非范围能力

本期明确不包括：

- RoCE Lossless QoS（PFC、ECN/WRED、DCQCN、Buffer、Queue）配置。
- GPU/NIC OS、驱动、固件、NCCL 或作业调度。
- Server IP、Bond/LAG、主机路由和服务器侧 VLAN 配置。
- 多租户 VRF/VXLAN/EVPN Type 5 服务编排。
- Intent Center 自建配置生命周期或绕过 Studio/Workspace 直接部署。
- 在 Studio 内直接执行设备 CLI。
- 把 simulated Leaf 自动转换为真实设备或允许其进入生产执行。
- 未经能力模型确认的自动回滚承诺。

---

## 18. 风险与待确认项

| 项目 | 风险 | 建议 |
|---|---|---|
| Server/Node Group 缺失 | 多个 Endpoint 的 LLDP 可能被错误聚类 | 产品化增加显式 Server/Node Group scope |
| Generated 端口命名 | 不同平台接口命名不一定为 EthernetN | 由设备 capability/adapter 返回接口 ID 与显示名 |
| VLAN Interface ownership | 可能与 L3、SVI 或其他 Studio 冲突 | Build 统一 ownership graph |
| Gateway 递增 | 不同 prefix 下 block step 可能快速溢出 | 后端使用无符号 IP 库并显示最终范围 |
| Proxy ARP/Route Adv | 厂商和 EOS 版本能力不同 | 设备级 capability gate，不静默忽略 |
| LLDP 漂移 | 规划后物理线缆变化 | Build 与 Execute 前比较 Inventory revision |
| 大规模 Topology | 1024 Leaf 不适合一次全量 SVG | 按 Domain 分页、按需渲染和虚拟化 |
| Tasks 命名 | 易与 Arista Classic Task 混淆 | UI 显示平台对象类型与来源，不虚构原生语义 |

---

## 19. 官方参考与合规说明

截至 2026-09-11，本 SR 依据以下 Arista 官方资料核对 Workspace、Studios 与 Change Control 语义：

1. [Arista CloudVision Workflow Overview](https://www.arista.com/zh/cg-cv/cv-workflow-overview)：Workspace 承载一个或多个 Studio 变更，提交后进入 Change Control 审批/执行流程。
2. [Arista CloudVision Studio Elements and Functions](https://www.arista.com/jp/cg-cv/cv-studio-elements-and-functions)：Workspace Review 中按 Studio 来源查看变更并返回对应配置位置。
3. [Arista Getting Started with Studios](https://www.arista.com/en/cg-cv/cv-getting-started-with-studios)：Studios、Inputs、Assignments 与 Workspace 的基础职责关系。
4. [Arista Advanced Change Control Lab](https://labguides.testdrive.arista.com/2025.1/data_center/cvp_adv_cc_studio/)：Change Control、执行前配置会话及恢复参考。
5. [Arista Using the Tasks Module](https://www.arista.com/ko/cg-cv/cv-using-the-tasks-module)：Classic Tasks 与 Change Control 的关系参考；不用于推断所有 Studio Workspace 必然生成 Task。

用户确认的截图和交互反馈决定本 Studio 的页面层级与视觉目标；官方资料决定生命周期语义。若不同 CloudVision 版本 UI 有差异，保留本项目视觉目标并在实现记录中注明版本差异。

Content was rephrased for compliance with licensing restrictions.

---

## 20. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|---|---|---|---|
| v1.0 | 2026-09-11 | 初始版本：定义 `STD-AI-004 / RoCE Access` 纵向四阶段工作流、Domain/Leaf/NIC 模型、Topology 端口语义及 Workspace 生命周期 | AmpCon Product Team |
