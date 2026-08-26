# AIDC Node Addition VLAN 接入配置方案

> **文档版本**：v1.0  
> **日期**：2026-07-16  
> **范围**：AmpCon-DC AIDC 场景 Leaf 下行 GPU 服务器 VLAN 接入配置设计  
> **目标读者**：产品经理、前端开发、后端开发、测试工程师

---

## 1. 背景与问题

### 1.1 背景

AmpCon-DC 当前 Node Addition 功能支持 GPU 服务器的纳管和 NIC-Leaf 物理映射，但缺少 AIDC 场景下 Leaf 交换机下行端口的网络配置（VLAN、网关等），导致 AIDC 场景的服务器接入配置无法通过控制器完成。

### 1.2 现状

| 模块 | 当前能力 | 缺失 |
|------|----------|------|
| Node Addition > Switch Port Group | 定义 NIC-Leaf 映射、Port Mode、LAG Mode、VLAN Domain 关联 | VLAN ID、Gateway IP、MTU |
| VLAN Domain | 为 Cloud DC 设计（2 Leaf pair），AIDC 单归场景自动生成 1 Leaf 的 VD | 无缺失，系统已支持 Single Leaf |
| Network Access (VL2) | Cloud DC Overlay 接入（VXLAN + Logical Switch） | 不适用于 AIDC 纯 VLAN 场景 |

### 1.3 目标

在 Node Addition 中扩展 AIDC 场景的 VLAN 接入配置能力，支持：
- 单 VLAN + VLANif 网关批量配置
- 128+ 台 Leaf 的快速部署（一次操作覆盖整个 POD）
- 不影响 Cloud DC 现有流程
- 为未来多租户（EVPN Type 5）预留演进路径

---

## 2. 业界参考

### 2.1 Juniper Apstra

- **物理拓扑**（Rack Type / Generic System）与**网络配置**（Connectivity Template / Virtual Network）分离
- GPU Backend 走 L3 直连 /31（IP Link primitive）
- 多租户通过 Routing Zone（VRF）+ EVPN Type 5 实现
- 批量配置通过 Blueprint + IP Pool 自动分配，一次 Commit 下发

### 2.2 华三 AD-DC

- "VLAN 接入"功能：选 POD → 批量配置 PVID + 网关
- 支持"设置组网"：填起始 VLAN + 起始网关 + 步长，系统按 POD 内 Leaf 顺序自动递增分配
- 配置和设备的对应关系通过"选择设备"步骤建立
- Leaf 视图展示每台设备的配置结果

### 2.3 AmpCon-DC 选择

在 Node Addition 中一站式完成物理映射 + 网络配置 + 批量部署。AIDC 场景是纯物理网络 VLAN 接入，不走 Overlay，放在 Resource 模块（Node Addition）是正确的位置。

---

## 3. 方案设计

### 3.1 核心思路

- 在 Node Addition 的 "Leaf Access" Tab 中新增 "Set Up Network" 功能
- 通过起始值 + 步长批量生成所有 Leaf 的 VLAN + Gateway 配置
- 通过"设备添加"建立逻辑占位符与物理 Leaf 的绑定关系
- 配置下发跟随 Node Addition 的部署流程

### 3.2 VLAN Domain 策略

VLAN Domain 根据 Fabric 的 **Service Network Type** 决定是否携带：

| Service Network Type | VLAN Domain | 说明 |
|---------------------|-------------|------|
| VXLAN | 必填（系统自动生成） | Cloud DC 场景，VLAN Domain 管理 BD/VLAN 资源池 |
| VLAN | **不携带** | AIDC 场景，不需要 VLAN Domain；VLAN ID 在 Node Addition 中直接指定 |

Fabric 创建时（Edit Template > Basic Information）已确定 Service Network Type（VLAN / VXLAN）。Node Addition 的 Switch Port Group 根据所属 Fabric 的 Service Network Type 自动决定是否展示 VLAN Domain 字段。

### 3.3 Leaf 下行端口确定

- Leaf Uplink Port Range 在 Fabric Template（Networking Settings）中已定义
- 系统自动计算：下行端口 = 总端口 - Uplink 端口
- Set Up Network 中用 "Leaf Downlink" 数量字段表示，无需用户手动选端口
- 绑定物理设备后，系统根据设备型号确定实际端口名

---

## 4. 用户操作流程

### 4.1 完整流程

```
Step 1: 创建 Node Group
  → 填写 Node Group Name、Node Count、Node Template(AI-Fabric-8x400G)、POD

Step 2: Set Up Network（批量组网配置）
  → 定义 Switch Port Group（NIC Port Group + Network Device 占位符 + LAG Mode）
  → 批量配置区：
     • Switch Group: Switch Group 1
     • Leaf Downlink: 64
     • Leaf Number: 128（系统自动生成 16 个 Switch Group）
     • Start VLAN ID: 10
     • VLAN ID Step: 1
     • Start Gateway: 192.168.10.254/24
     • Subnet Step: 1
  → Advanced Settings: Local Proxy ARP / ARP Direct Route Adv / ARP Aging Timer / MTU
  → Apply

Step 3: 确认配置结果
  → 表格展示每台 Leaf 的 Sysname + Port + VLAN ID + Gateway
  → 支持手动编辑单行微调

Step 4: 设备添加（绑定物理 Leaf）
  → 从 Fabric 可选设备列表中选择 Leaf 加入 Switch Group
  → 确定逻辑占位符（Leaf1~Leaf8）与物理设备的对应关系
  → 表格显示：Sysname → Network Device → NIC → Switch Group

Step 5: Apply / Deploy
  → 系统生成配置并下发到对应 Leaf 设备
```

### 4.2 配置生成示例（PicOS）

每台 Leaf 生成的配置：

```
vlan 10

interface vlan10
  ip address 192.168.10.254/24

interface ethernet ge-1/1/1
  switchport mode access
  switchport access vlan 10
  mtu 9216

interface ethernet ge-1/1/2
  switchport mode access
  switchport access vlan 10
  mtu 9216

... (所有下行端口)
```

128 台 Leaf 分别生成 VLAN 10~137 + Gateway 192.168.10.254 ~ 192.168.137.254 的配置。

---

## 5. 功能模块字段定义

### 5.1 Bare Metal Nodes 主面板

主面板为 Node Addition 的 Leaf Access Tab 页面，包含以下元素：

| 字段/元素 | 类型 | 必填 | 取值范围 | 说明 |
|-----------|------|------|----------|------|
| Fabric | 下拉选择 | 是 | 系统已创建的 Fabric 列表 | 选择所属 Fabric |
| Service Network Type | 只读展示 | — | VLAN / VXLAN | 根据 Fabric 自动带出，不可编辑 |
| Node Group | Tab 按钮 | — | — | 切换到 Node Group 配置 |
| Leaf Access | Tab 按钮 | — | — | 切换到 Leaf 接入配置（本方案） |
| Set Up Network | 操作按钮 | — | — | 点击打开 Set Up Network 弹窗 |
| Switch Port | 下拉选择 | 是 | Switch Group 1 ~ N | 切换查看不同 Switch Group 的配置 |
| Device Allocation | 操作链接 | — | — | 点击打开设备添加弹窗 |
| Switch Group Tab 栏 | Tab | — | Switch Group 1/2/3/4... | 显示各 Switch Group 的配置摘要 |

**主面板表格（配置结果展示）：**

| 列 | 说明 |
|----|------|
| Sysname | Leaf 逻辑名称（如 Switch-1 ~ Switch-8） |
| Port | 端口/端口范围（如 Te-1/1/1 - Te-1/1/64），或"需选择端口"提示 |
| VLAN ID | 分配的 VLAN ID（由 Set Up Network 自动生成） |
| 网关 | 分配的 Gateway IP/Mask |
| 操作 | 编辑按钮（支持手动修改单行） |

---

### 5.2 Set Up Network 弹窗

#### 5.2.1 Create Switch Port Group 区域

支持创建多个 Switch Port Group（对应 Node Template 的每个 NIC Panel）。

| 字段 | 类型 | 必填 | 取值范围 | 默认值 | 说明 |
|------|------|------|----------|--------|------|
| NIC Port Group | 只读/下拉 | 是 | Node Template 中定义的 NIC Port Group（如 AI-Fabric-8x400G_1） | — | 引用 Node Template |
| Link Count per Leaf Switch | 数字输入 | 是 | 1~8 | 1 | 每台 Leaf 到该 NIC 的物理链路数 |
| Select NIC Ports | 端口选择 | 是 | Panel 1~8（来自 Node Template） | — | 选择对应的 NIC 端口编号 |
| Network Device | 只读标签 | — | Leaf1 ~ Leaf8（逻辑占位符） | — | 绑定物理设备前为占位符，绑定后显示实际 Sysname |
| LAG Mode | Radio 单选 | 是 | LACP / Static LAG (No LACP) / No LAG | No LAG | AIDC GPU 场景默认 No LAG |

#### 5.2.2 Switch Group 配置区域（批量组网）

| 字段 | 类型 | 必填 | 取值范围 | 默认值 | 说明 |
|------|------|------|----------|--------|------|
| Switch Group | 下拉选择 | 是 | Switch Group 1 ~ N | Switch Group 1 | 选择要配置的 Switch Group |
| Leaf Downlink | 数字输入 | 是 | 1~128 | 64 | 每台 Leaf 的下行接入端口数。可根据 Fabric Template 的 Uplink Port Range 自动计算（总端口 - 上行口） |
| Leaf Number | 数字输入 | 是 | 8~1024 | 128 | Leaf 总数。系统根据此值自动生成 Switch Group 数量（= Leaf Number ÷ 8） |
| Start VLAN ID | 数字输入 | 是 | 2~4094 | 10 | 起始 VLAN ID |
| VLAN ID Step | 数字输入 | 是 | 1~100 | 1 | VLAN ID 递增步长。第 N 台 Leaf 的 VLAN = Start VLAN ID + (N-1) × Step |
| Start Gateway | IP/Mask 输入 | 是 | 合法 IPv4 + 掩码 | 192.168.10.254/24 | 起始网关地址 |
| Subnet Step | 数字输入 | 是 | 1~100 | 1 | 网段递增步长。第 N 台 Leaf 的网关第三段 = 起始第三段 + (N-1) × Step |

#### 5.2.3 Advanced Settings 区域

| 字段 | 类型 | 必填 | 取值范围 | 默认值 | 说明 |
|------|------|------|----------|--------|------|
| Local Proxy ARP | 复选框 | 否 | 启用/禁用 | 禁用 | 本地 ARP 代理。Leaf 代理同 VLAN 内主机的 ARP 请求 |
| ARP Direct Route Adv | 复选框 | 否 | 启用/禁用 | 禁用 | ARP 直连路由通告。Leaf 将 ARP 学到的主机路由通告给 Spine |
| ARP Aging Timer (sec) | 数字输入 | 否 | 60~86400 | 1800 | ARP 表项老化时间（秒） |
| MTU | 数字输入 | 否 | 1500~9216 | 9216 | 接口 MTU。AIDC RoCE 场景建议 9216 |

---

### 5.3 Device Allocation 弹窗

#### 5.3.1 可选设备列表（左侧）

从 Fabric 内所有已纳管的 Leaf 设备中列出可选设备：

| 列 | 说明 |
|----|------|
| Sysname | 设备系统名（如 Switch-1, Switch-2...） |
| Device Role | 设备角色（Leaf） |

筛选条件：
- 属于当前 Fabric
- Device Role = Leaf
- 尚未被其他 Switch Group 占用

总计：显示可选设备总数（如"总计: 128"）

#### 5.3.2 已选设备列表（右侧）

| 列 | 类型 | 说明 |
|----|------|------|
| Sysname | 只读 | 物理设备系统名（从左侧选入） |
| Network Device | 只读/自动分配 | 逻辑占位符（Leaf1~Leaf8），按选入顺序自动分配 |
| NIC | 只读 | 关联的 NIC Port Group（如 AI-Fabric-8x400G_1） |
| Switch Group | 只读 | 归属的 Switch Group（如 POD1） |

操作：
- Switch Group 选择器：选择当前要分配设备的 Switch Group
- 选入/移出按钮：将设备从可选移到已选
- 每个 Switch Group 最多选 8 台 Leaf

#### 5.3.3 绑定规则

| 规则 | 说明 |
|------|------|
| 每台 Leaf 只能属于一个 Switch Group | 不可重复选择 |
| 选入顺序 = Network Device 编号 | 第 1 个选入的 = Leaf1，第 2 个 = Leaf2... |
| 选入后 Set Up Network 中的配置自动关联 | Leaf1 对应 Start VLAN，Leaf2 对应 Start VLAN + Step... |
| 支持调整顺序 | 用户可在已选列表中拖拽/调整排序 |

---

### 5.4 Node Group 弹窗

| 字段 | 类型 | 必填 | 取值范围 | 说明 |
|------|------|------|----------|------|
| Node Group Name | 文本输入 | 是 | 任意字符串 | Node Group 名称 |
| Description | 文本输入 | 否 | — | 描述信息 |
| Node Count | 数字输入 | 是 | 1~1024 | GPU Server 数量 |
| Node Template | 下拉选择 | 是 | 系统已创建的 Node Template（如 AI-Fabric-8x400G） | 服务器 NIC 规格模板 |
| POD | 下拉选择 | 是 | 当前 Fabric 下已创建的 POD | 归属 POD |

**Node 信息表格：**

| 列 | 类型 | 说明 |
|----|------|------|
| Node Name | 自动生成/可编辑 | 节点名称（如 3_1） |
| IP Address | IP 输入 | 服务器管理 IP |
| User | 文本输入 | SSH 用户名 |
| Password | 密码输入 | SSH 密码 |
| Total Number | 只读 | NIC 总端口数（由 Template 决定，如 8） |
| NIC | 只读 | NIC 类型（如 AI） |

---

## 6. 与现有功能的关系

### 6.1 不改动的部分

| 模块 | 说明 |
|------|------|
| VLAN Domain | 逻辑和数据模型不变，AIDC 场景系统自动生成 Single Leaf VD |
| Network Access (VL2) | Cloud DC Overlay 逻辑不变 |
| Logical Networks / Routers / Switches | Service Provision 模块不变 |
| Physical Network / Fabric Design | 不变 |
| Fabric Template | 不变（已有 Leaf Uplink Port Range 定义） |

### 6.2 Node Addition 改动

| 改动项 | 说明 |
|--------|------|
| 新增 "Leaf Access" Tab | 与 "Node Group" 并列 |
| 新增 "Set Up Network" 功能 | 批量配置 VLAN + Gateway + 高级设置 |
| 新增 "设备添加" 功能 | 绑定逻辑占位符到物理 Leaf |
| VLAN Domain 字段行为调整 | Fabric 为 VLAN 类型时默认空可选 |
| Switch Port Group 扩展 | 增加 VLAN ID / Gateway / MTU 展示（由 Set Up Network 自动生成） |

---

## 7. 多租户演进

### 7.1 当前（单租户）

- 所有 GPU Server 在同一网络平面
- 不关联 Tenant / VPC
- Node Addition 直接配 VLAN + Gateway 下发

### 7.2 未来（多租户）

AIDC 多租户需要 EVPN Type 5 + VRF 隔离（参考 Juniper JVD）：

- Fabric 从 VLAN 类型升级为 VXLAN 类型
- 复用现有 Cloud DC 的 Overlay 逻辑：Tenant → Logical Network → Logical Router(VRF) → VL2 → Associate Bare Metal Node
- 配置生成变为 EVPN Type 5 + VXLAN + VRF
- Node Addition 保持纯物理层（不挂 Tenant），Tenant 归属通过 Service Provision 层实现

### 7.3 演进路径

```
Phase 1（当前）: VLAN Fabric + Node Addition 直配 → 单租户 GPU 接入
Phase 2（未来）: VXLAN Fabric + Overlay 逻辑复用 → 多租户 VRF 隔离
```

两个阶段 Node Addition 的物理映射逻辑不变，差异只在网络属性的来源和配置生成模板。

---

## 8. Switch Group 计算公式与规模验证

### 8.1 计算公式

```
每 Switch Group 的 Leaf 数 = Total NIC Port Number ÷ Physical Link Count per Leaf Switch
Switch Group 总数 = Leaf Number ÷ 每 Switch Group 的 Leaf 数
每台 Leaf 最大接入 Server 数 = Leaf Downlink ÷ Physical Link Count per Leaf Switch
总最大 Server 数 = Leaf Number × Leaf Downlink ÷ Total NIC Port Number
```

### 8.2 不同 GPU 服务器类型的 Switch Group 对应关系

#### 8 GPU 服务器（Total NIC Port = 8），Leaf 数量 128，Leaf Downlink 64

| Physical Link Count per Leaf | 每 Switch Group Leaf 数 | Switch Group 总数 | 每台 Leaf 接入 Server 数 | 总 Server 数 | 场景说明 |
|-----|-----|------|------|------|------|
| 1 | 8 | 16 | 64 | 1024 | Rail-optimized，每 NIC 单链路连不同 Leaf |
| 2 | 4 | 32 | 32 | 1024 | 每 2 NIC Bond 连同一 Leaf |
| 4 | 2 | 64 | 16 | 1024 | 每 4 NIC Bond 连同一 Leaf |
| 8 | 1 | 128 | 8 | 1024 | 全部 NIC 连同一 Leaf（单归） |

#### 4 GPU 服务器（Total NIC Port = 4），Leaf 数量 128，Leaf Downlink 64

| Physical Link Count per Leaf | 每 Switch Group Leaf 数 | Switch Group 总数 | 每台 Leaf 接入 Server 数 | 总 Server 数 | 场景说明 |
|-----|-----|------|------|------|------|
| 1 | 4 | 32 | 64 | 2048 | 每 NIC 单链路连不同 Leaf |
| 2 | 2 | 64 | 32 | 2048 | 每 2 NIC Bond 连同一 Leaf |
| 4 | 1 | 128 | 16 | 2048 | 全部 NIC 连同一 Leaf（单归） |

#### 2 GPU 服务器（Total NIC Port = 2），Leaf 数量 128，Leaf Downlink 64

| Physical Link Count per Leaf | 每 Switch Group Leaf 数 | Switch Group 总数 | 每台 Leaf 接入 Server 数 | 总 Server 数 | 场景说明 |
|-----|-----|------|------|------|------|
| 1 | 2 | 64 | 64 | 4096 | 每 NIC 单链路连不同 Leaf |
| 2 | 1 | 128 | 32 | 4096 | 全部 NIC 连同一 Leaf（单归） |

#### 16 GPU 服务器（Total NIC Port = 16），Leaf 数量 128，Leaf Downlink 64

| Physical Link Count per Leaf | 每 Switch Group Leaf 数 | Switch Group 总数 | 每台 Leaf 接入 Server 数 | 总 Server 数 | 场景说明 |
|-----|-----|------|------|------|------|
| 1 | 16 | 8 | 64 | 512 | 每 NIC 单链路连不同 Leaf |
| 2 | 8 | 16 | 32 | 512 | 每 2 NIC Bond 连同一 Leaf |
| 4 | 4 | 32 | 16 | 512 | 每 4 NIC Bond 连同一 Leaf |
| 8 | 2 | 64 | 8 | 512 | 每 8 NIC Bond 连同一 Leaf |
| 16 | 1 | 128 | 4 | 512 | 全部 NIC 连同一 Leaf（单归） |

### 8.3 典型 AIDC 部署规模验证

以 128 端口交换机、8 GPU 服务器、Rail-optimized（Link Count=1）为例：

| 资源 | 数量 |
|------|------|
| Spine | 64 台（128×400G） |
| Leaf | 128 台（64×400G 上 + 64×400G 下） |
| Switch Group (POD) | 16 个（每组 8 台 Leaf） |
| Server | 1024 台（每台 8 GPU NIC） |
| GPU 总数 | 8192 |

**用户操作量**：
- Set Up Network 配置 1 次（填起始值 + 步长，覆盖所有 128 Leaf）或 16 次（per Switch Group）
- Device Allocation：系统按 Leaf 管理 IP 自动排序预分配，用户确认即可
- 总操作：≤17 次，对比逐台手配 128 次

---

## 9. 配置下发

### 9.1 下发机制

采用 H3C 模式——业务级独立部署：
- Set Up Network 配置完成 + 设备绑定完成 → Apply 触发增量下发
- 下发范围：仅涉及本次配置的 Leaf 设备
- 支持回滚（仅回滚 VLAN 接入部分，不影响 Underlay）

### 9.2 校验逻辑

Apply 前后端自动校验：
- VLAN ID 唯一性（跨 Switch Group 不重复）
- Gateway 子网不重叠
- 设备绑定完整性（所有 Switch Group 均已完成设备添加）
- 端口可用性（下行口未被其他配置占用）

---

## 10. 与 QoS 的关系

VLAN 接入配置（本方案）只负责 **VLAN + Gateway + MTU**。

RoCE QoS 配置（PFC / ECN / DCQCN / Buffer）由独立的 RoCE 部署模块处理，不在 Node Addition 中配置。两者并行，共同组成 AIDC Leaf 的完整下行配置：

```
Leaf 下行完整配置 = VLAN 接入（本方案） + RoCE QoS（独立模块）
```

---

## 11. 风险与注意事项

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| Leaf Downlink 自动计算依赖 Fabric Template 准确性 | 端口分配错误 | 绑定设备后校验实际端口数与计算值是否匹配 |
| 用户手动修改单台 Leaf 配置导致跨 Group 冲突 | VLAN/子网重叠 | Apply 时后端唯一性校验 |
| 先 Set Up Network 后绑设备的顺序依赖 | 未绑设备时无法下发 | Apply 前强制检查设备绑定完整性 |
| 大规模部署（128 Leaf）下发失败部分设备 | 配置不一致 | 支持重试 + 部分回滚 + 失败设备标记 |

---

## 12. 参考文档

| 文档 | 说明 |
|------|------|
| Juniper JVD: AI DC with EVPN Multitenancy | GPU Backend 多租户架构参考 |
| Juniper JVD: AI Fabric IP Services | DCQCN/PFC/ECN 配置参考 |
| 华三 AD-DC VLAN 接入文档 | 批量组网操作参考 |
| AmpCon-DC 2.5.1 User Guide - Node Addition | 现有 Node Addition 流程参考 |
| AmpCon-DC 2.5.1 User Guide - VLAN Domain | VLAN Domain 自动生成逻辑参考 |
| AmpCon-DC 2.5.1 User Guide - Network Access (VL2) | Cloud DC Overlay 接入参考 |
