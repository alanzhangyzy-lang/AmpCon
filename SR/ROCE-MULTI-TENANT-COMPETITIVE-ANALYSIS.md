# AIDC RoCE 网络多租户方案 — 竞争分析报告

> **文档版本**：v1.0  
> **日期**：2026-04-24  
> **范围**：NVIDIA Spectrum-X / Cisco ACI + Nexus / Arista Etherlink + EOS / H3C AD-AIDC  
> **目标读者**：产品经理、解决方案架构师、售前工程师

---

## 1. 背景与分析目的

### 1.1 背景

RoCE（RDMA over Converged Ethernet）已成为 AI 数据中心 GPU 集群互联的主流传输协议。随着 GPU 云服务（如 CoreWeave、Lambda）和企业多团队共享 AI 基础设施的需求增长，**RoCE 网络的多租户隔离**成为关键技术需求。

多租户隔离需要解决两个层面的问题：

- **网络隔离**：不同租户的流量不混、路由不通、策略独立
- **性能隔离**：一个租户的 AI 训练任务不影响另一个租户的网络性能

### 1.2 分析目的

本文档对比分析四家主流厂商在 RoCE 网络多租户场景下的技术方案、交换机功能依赖、以及各自的优劣势，为产品规划和竞争策略提供参考。

---

## 2. 厂商方案详述

### 2.1 NVIDIA Spectrum-X

#### 2.1.1 核心架构

Spectrum-X 是端到端方案，由两个硬件组件协同工作：

| 组件 | 型号 | 角色 |
|------|------|------|
| 交换机 | Spectrum-4（51.2Tbps ASIC） | 转发面、遥测采集、自适应路由 |
| 智能网卡 | BlueField-3 SuperNIC | 端侧拥塞控制、包重排序、QP 管理 |

两者必须配合使用，缺一不可。

#### 2.1.2 多租户隔离机制

**（1）网络隔离 — VRF + L3VNI**

每个租户分配独立的 VRF 实例和 L3VNI，拥有独立路由表：

| 租户 | VRF | L3VNI | 说明 |
|------|-----|-------|------|
| 租户 A | VRF-A | 50001 | GPU 训练集群 A |
| 租户 B | VRF-B | 50002 | GPU 训练集群 B |
| 租户 C | VRF-C | 50003 | 推理业务 |

- 基于标准 VXLAN BGP EVPN 控制面
- GPU 服务器通过 BlueField-3 SuperNIC 接入对应 VRF

**（2）性能隔离 — Spectrum-X 核心差异化**

性能隔离由三个子机制组合实现：

| 机制 | 工作原理 | 交换机侧 | SuperNIC 侧 |
|------|---------|----------|------------|
| **QoS 隔离** | 不同租户/任务分配不同 DSCP 标记和队列，每队列独立带宽保障和缓冲区 | 细粒度多队列调度、per-queue 缓冲区管理 | DSCP 标记 |
| **RoCE 自适应路由（AR）** | 逐包选择最不拥塞的出端口转发，基于出端口队列深度实时决策 | 逐包负载均衡、实时队列深度感知、邻居拥塞通知 | 接收端包重排序（乱序恢复） |
| **RoCE 拥塞控制（CC）** | 交换机嵌入带内遥测（INT），SuperNIC 执行拥塞控制算法动态调速 | 带内遥测采集、遥测优先传输通道 | 硬件执行 CC 算法，微秒级反应 |

**关键创新**：遥测数据可绕过拥塞队列传输，避免"拥塞信号本身被拥塞延迟"。

**（3）可观测性 — NetQ**

- 交换机 + SuperNIC 双向遥测数据采集
- Per-flow 路径追踪和延迟分析
- 按租户维度的网络健康状态视图

#### 2.1.3 对交换机功能的依赖

| 交换机能力 | 用途 | 是否 Spectrum-4 专有 |
|-----------|------|---------------------|
| VXLAN 封装/解封装 | VRF + L3VNI 租户隔离 | 否，通用能力 |
| BGP EVPN 控制面 | Overlay 网络控制 | 否，通用能力 |
| 多 VRF 实例 | 路由隔离 | 否，通用能力 |
| 细粒度多队列 QoS | 带宽/缓冲区隔离 | 否，但精细度有差异 |
| PFC（Priority Flow Control） | 无损以太网 | 否，通用能力 |
| ECN（Explicit Congestion Notification） | 拥塞标记 | 否，通用能力 |
| **逐包自适应路由** | **避免拥塞热点** | **是，Spectrum-4 专有** |
| **带内遥测 + 优先遥测通道** | **实时拥塞感知** | **是，Spectrum-4 专有** |
| **邻居拥塞状态通知** | **跨交换机负载均衡** | **是，Spectrum-4 专有** |
| **与 SuperNIC 协同协议** | **端到端性能隔离** | **是，Spectrum-X 专有** |

> **参考来源**：[NVIDIA Spectrum-X 技术博客](https://developer.nvidia.com/blog/turbocharging-ai-workloads-with-nvidia-spectrum-x-networking-platform/)；[Zadara Spectrum-X 介绍](https://www.zadara.com/blog/2025/06/03/high-performance-ai-networking-with-spectrum-x-enabling-nvidias-vision-through-zadara/)
> *Content was rephrased for compliance with licensing restrictions*

---

### 2.2 Cisco ACI + Nexus

#### 2.2.1 核心架构

Cisco 提供两条技术路线，可组合使用：

| 模式 | 控制器 | 交换机固件 | 多租户能力 |
|------|--------|-----------|-----------|
| ACI 模式 | APIC（3 节点集群） | ACI 专用固件 | 最完整（Tenant/VRF/BD/EPG/Contract） |
| NX-OS 模式 | NDFC（Nexus Dashboard Fabric Controller） | 标准 NX-OS | 标准（VRF + L3VNI） |

#### 2.2.2 多租户隔离机制

**（1）ACI 模式 — 最完整的多租户策略模型**

ACI 拥有业界最精细的多租户对象模型：

| 层级 | 对象 | 作用 |
|------|------|------|
| 第 1 层 | **Tenant（租户）** | 最顶层隔离单元，独立策略空间 |
| 第 2 层 | **VRF** | 三层路由隔离，关联 L3VNI |
| 第 3 层 | **Bridge Domain（BD）** | 二层广播域，关联 L2VNI |
| 第 4 层 | **Application Profile** | 应用画像，逻辑分组 |
| 第 5 层 | **EPG（Endpoint Group）** | 端点分组，GPU 服务器按 EPG 归类 |
| 策略层 | **Contract** | 白名单策略，默认 EPG 间不通，需显式放行 |

**（2）NX-OS VXLAN EVPN 模式 — 标准多租户**

与 NVIDIA Spectrum-X 的 VRF + VNI 思路一致：

| 租户 | VRF | L3VNI | L2VNI（计算网段） | L2VNI（存储网段） |
|------|-----|-------|-----------------|-----------------|
| 租户 A | VRF-A | 50001 | 30001 | 30002 |
| 租户 B | VRF-B | 50002 | 30003 | 30004 |

**（3）RoCE 无损网络 — QoS 机制栈**

| 机制 | 工作原理 | 交换机依赖 |
|------|---------|-----------|
| **PFC** | 基于 802.1Qbb，对特定优先级流量逐跳反压防丢包 | per-priority PFC + PFC Watchdog |
| **ECN** | 队列深度超阈值时标记 ECN 位，通知端侧降速 | WRED + ECN 标记 |
| **PFC + ECN 组合** | ECN 软着陆 + PFC 硬刹车 | 缓冲区需足够大 |
| **AFD（Approximate Fair Drop）** | 多租户共享队列时确保每个流获得公平缓冲区份额 | **Nexus 9000 ASIC 专有** |
| **VXLAN QoS 穿透** | VXLAN 封装时外层 IP 头正确复制内层 DSCP 值 | DSCP copy 能力 |

#### 2.2.3 对交换机功能的依赖

| 交换机能力 | 用途 | 是否 Cisco 专有 |
|-----------|------|----------------|
| VXLAN 封装/解封装 | Overlay 网络 | 否，通用能力 |
| BGP EVPN 控制面 | Overlay 控制 | 否，通用能力 |
| 多 VRF + L3VNI | 三层租户隔离 | 否，通用能力 |
| L2VNI + Bridge Domain | 二层租户隔离 | BD 是 ACI 概念 |
| PFC + PFC Watchdog | 无损以太网 | 否，通用能力 |
| ECN + WRED | 拥塞标记 | 否，通用能力 |
| DSCP QoS 映射 | 流量分类 | 否，通用能力 |
| VXLAN QoS 穿透（DSCP copy） | 隧道中保持 QoS | 部分交换机不支持 |
| **ACI 策略 TCAM** | **Contract 白名单策略硬件执行** | **是，ACI 模式专有** |
| **AFD（Approximate Fair Drop）** | **多租户公平缓冲区分配** | **是，Nexus 9000 专有** |
| **APIC 意图驱动编排** | **自动化策略下发** | **是，ACI 专有** |

> **参考来源**：[Cisco RoCE over VXLAN Fabrics 白皮书](https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/roce-storage-implementation-over-nxos-vxlan-fabrics.html)；[Cisco AI/ML 网络蓝图](https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-data-center-networking-blueprint-for-ai-ml-applications.html)；[Cisco VXLAN 多租户配置指南](https://www.cisco.com/c/en/us/td/docs/switches/datacenter/pf/configuration/guide/b-pf-configuration/Multi-Tenancy.html)
> *Content was rephrased for compliance with licensing restrictions*

---


### 2.3 Arista Etherlink + EOS

#### 2.3.1 核心架构

| 组件 | 型号/平台 | 角色 |
|------|----------|------|
| AI Leaf 交换机 | 7060X6（Broadcom Tomahawk 5，51.2Tbps） | 接入层，浅缓冲 |
| AI Spine 交换机 | 7800R4（Broadcom Jericho3-AI） | 汇聚层，VOQ + 深缓冲 |
| 分布式交换 | 7700R4 DES（Jericho3-AI，调度式 Fabric） | 超大规模集群 |
| 操作系统 | EOS Smart AI Suite | AI 优化软件功能集 |
| 编排平台 | CloudVision + AVD（Arista Validated Design） | 网络编排与可观测性 |

Arista 使用 **Broadcom 芯片**（非自研 ASIC），不强制绑定特定网卡品牌。

#### 2.3.2 多租户隔离机制

**（1）网络隔离 — VXLAN EVPN + VRF**

标准 VXLAN BGP EVPN 方案，与 Cisco NX-OS 模式一致：

| 租户 | VRF | L3VNI | 网段 |
|------|-----|-------|------|
| 租户 A | VRF-A | 50001 | GPU 计算 + 存储 |
| 租户 B | VRF-B | 50002 | GPU 计算 + 存储 |

通过 AVD 框架提供标准化多租户部署模板，CloudVision Studios 支持 Tenant → VRF → Network 层级编排。

**（2）性能隔离 — 硬件架构驱动**

Arista 的性能隔离侧重交换机自身硬件架构优势，不依赖专用网卡：

| 机制 | 工作原理 | 平台要求 |
|------|---------|---------|
| **VOQ（虚拟输出队列）** | 每个入端口为每个出端口维护独立队列，从根本上消除队头阻塞（HoL Blocking）。一个租户的拥塞不会阻塞其他租户到不同出端口的流量 | 仅 R 系列（Jericho ASIC）：7800R4、7700R4、7280R4 |
| **Deep Buffer（深缓冲）** | GB 级缓冲区吸收 AI 训练微突发流量，降低 PFC 触发概率，为每个租户的突发流量提供更大容错空间 | 仅 R 系列 |
| **Cluster Load Balancing（CLB）** | 基于 RDMA Queue Pair（QP）级别的负载均衡，比传统 per-flow ECMP 粒度更细。可与第三方 SmartNIC 集成 | 7060X6 + 7800R4（EOS 2025 新功能） |
| **PFC + ECN + DCQCN** | 标准无损以太网 QoS 栈 | 全系列 Etherlink |

**（3）7700R4 DES — 超大规模特殊方案**

| 特性 | 说明 |
|------|------|
| 架构 | 多个物理交换机组合为一个逻辑交换机 |
| 调度方式 | 调度式 Fabric（Scheduled Fabric），无拥塞流量喷洒 |
| 负载均衡 | 逐包调度，不依赖 ECMP |
| 性能隔离 | DES 内部天然无拥塞，性能隔离效果好 |
| 部署案例 | Meta 已部署用于大规模 AI 集群 |

**（4）安全隔离 — MSS（Multi-Domain Segmentation Services）**

- 基于端点身份（而非 IP/VLAN）的微分段
- 可在 VRF 内部进一步细分安全域
- 与 CloudVision 集成，提供零信任网络访问

#### 2.3.3 对交换机功能的依赖

| 交换机能力 | 用途 | 平台支持 |
|-----------|------|---------|
| VXLAN 封装/解封装 | Overlay 网络 | 全系列 |
| BGP EVPN 控制面 | Overlay 控制 | 全系列 |
| 多 VRF + L3VNI | 三层租户隔离 | 全系列 |
| PFC + ECN + DCQCN | 无损以太网 | 全系列 Etherlink |
| DSCP QoS 映射 | 流量分类 | 全系列 |
| **VOQ（虚拟输出队列）** | **消除队头阻塞，天然性能隔离** | **仅 R 系列（Jericho ASIC）** |
| **Deep Buffer（GB 级缓冲）** | **吸收微突发，减少 PFC 风暴** | **仅 R 系列** |
| **Cluster Load Balancing** | **RDMA QP 级负载均衡** | **7060X6 + 7800R4** |
| **DES 调度式 Fabric** | **无拥塞流量喷洒** | **仅 7700R4 DES** |
| MSS 微分段 | 安全隔离 | 全系列（EOS 功能） |

> **参考来源**：[Arista Etherlink 发布](https://www.arista.com/en/company/news/press-release/19493-arista-unveils-etherlink-ai-networking-platforms)；[Arista 7800R4 AI Spine](https://blogs.arista.com/blog/powering-ai-centers-with-ai-spines)；[Arista Smart AI Suite](https://www.arista.com/company/news/press-release/21271-pr-20250312)；[Arista R4 产品线扩展](https://blogs.arista.com/blog/arista-extends-dc-ai-leadership-with-new-platforms-higher-speed)
> *Content was rephrased for compliance with licensing restrictions*

---

### 2.4 H3C AD-AIDC

#### 2.4.1 核心架构

| 组件 | 说明 |
|------|------|
| 控制器 | AD-AIDC 控制器 |
| 管理模块 | RoCE 网络模块（资源隔离、VLAN 接入、VXLAN 接入、虚拟链路层网络、虚拟路由器、虚拟端口、虚拟路由器连接） |
| 交换机 | H3C 数据中心交换机系列 |

#### 2.4.2 多租户隔离机制

**（1）资源隔离 — Fabric 级网络资源分区**

AD-AIDC 的"资源隔离"是最顶层的逻辑划分，每个实例圈定一部分物理网络资源：

| 字段 | 说明 |
|------|------|
| 资源隔离名称 | 隔离域标识 |
| 已编排网络数量 | 该域内的网络实例数 |
| 资源隔离管理 IP | 管理面地址 |
| Fabric（类型） | 关联的物理 Fabric |
| POD | 关联的 POD |
| 租户 | 归属租户 |

**（2）网段规划 — IP 资源预分配**

按 Fabric 维度预规划 IP 地址段：

| Fabric | 骨干网段 | 端口数 | 存储客户端网段 | 端口数 | 分配方式 |
|--------|---------|--------|--------------|--------|---------|
| fabric_test | 1 个 | 24 | 1 个 | 0 | 自动 DHCP |
| fabric | 1 个 | 24 | 1 个 | 27 | 自动 DHCP |

**（3）网络虚拟化层次**

AD-AIDC 通过以下子模块构建从下到上的网络虚拟化层次：

| 层级 | 模块 | 作用 |
|------|------|------|
| 接入层 | VLAN 接入 / VXLAN 接入 | 二层接入方式（Underlay / Overlay） |
| 端口层 | 虚拟端口 | 物理端口虚拟化封装 |
| 二层 | 虚拟链路层网络 | 统一 VLAN/VXLAN 的二层抽象（VLAN-Network、PVLAN 模型） |
| 三层 | 虚拟路由器 | 三层路由虚拟化（类似 VRF） |
| 互联层 | 虚拟路由器连接 | 跨域路由互联 |
| 隔离层 | 资源隔离 | 最顶层 Fabric 级资源分区 |

#### 2.4.3 对交换机功能的依赖

| 交换机能力 | 用途 | 说明 |
|-----------|------|------|
| VLAN / VXLAN | 二层接入与隔离 | 标准能力 |
| VRF | 三层路由隔离 | 标准能力 |
| PFC + ECN | 无损以太网 | 标准能力 |
| QoS / DSCP | 流量分类与优先级 | 标准能力 |
| PVLAN | 细粒度二层隔离 | 标准能力 |
| 控制器南向接口 | 策略自动下发 | H3C 自有协议 |

> **说明**：H3C AD-AIDC 的公开技术文档较少，以上分析基于控制器 UI 截图和产品页面信息。

---

## 3. 综合对比

### 3.1 多租户能力矩阵

| 能力维度 | NVIDIA Spectrum-X | Cisco ACI + Nexus | Arista Etherlink + EOS | H3C AD-AIDC |
|---------|------------------|-------------------|----------------------|-------------|
| **网络隔离（VRF + VNI）** | ✅ | ✅ | ✅ | ✅ |
| **二层隔离（VLAN/VXLAN）** | ✅ | ✅（+ Bridge Domain） | ✅ | ✅（+ PVLAN） |
| **策略隔离（白名单/ACL）** | ⬜ 基础 QoS | ✅ EPG + Contract | 🔶 MSS 微分段 | ⬜ 基础 ACL |
| **性能隔离 — 负载均衡** | ✅ 逐包自适应路由 | ⬜ per-flow ECMP | 🔶 RDMA QP 级 CLB | ⬜ per-flow ECMP |
| **性能隔离 — 拥塞控制** | ✅ 硬件级端到端 CC | 🔶 PFC + ECN + AFD | 🔶 PFC + ECN + DCQCN | 🔶 PFC + ECN |
| **性能隔离 — 缓冲区架构** | 共享缓冲 | 共享缓冲 | ✅ VOQ + 深缓冲（R 系列） | 共享缓冲 |
| **租户级可观测性** | ✅ NetQ 流遥测 | ✅ Nexus Dashboard Insights | ✅ AI Analyzer | 🔶 基础监控 |
| **控制器自动化编排** | 🔶 Cumulus/SONiC + NetQ | ✅ APIC / NDFC | ✅ CloudVision + AVD | ✅ AD-AIDC 控制器 |

### 3.2 交换机功能依赖对比

| 交换机能力 | NVIDIA | Cisco | Arista | H3C | 通用性 |
|-----------|--------|-------|--------|-----|--------|
| VXLAN + BGP EVPN | ✅ | ✅ | ✅ | ✅ | 通用 |
| 多 VRF + L3VNI | ✅ | ✅ | ✅ | ✅ | 通用 |
| PFC + ECN | ✅ | ✅ | ✅ | ✅ | 通用 |
| DSCP QoS 映射 | ✅ | ✅ | ✅ | ✅ | 通用 |
| **逐包自适应路由** | ✅ | ❌ | ❌ | ❌ | Spectrum-4 专有 |
| **带内遥测 + 优先通道** | ✅ | ❌ | ❌ | ❌ | Spectrum-4 专有 |
| **交换机-网卡协同协议** | ✅ | ❌ | ❌ | ❌ | Spectrum-X 专有 |
| **ACI 策略 TCAM** | ❌ | ✅ | ❌ | ❌ | ACI 专有 |
| **AFD 公平缓冲区** | ❌ | ✅ | ❌ | ❌ | Nexus 9000 专有 |
| **VOQ 虚拟输出队列** | ❌ | ❌ | ✅ | ❌ | Jericho ASIC（R 系列） |
| **GB 级深缓冲** | ❌ | ❌ | ✅ | ❌ | Jericho ASIC（R 系列） |
| **DES 调度式 Fabric** | ❌ | ❌ | ✅ | ❌ | 7700R4 专有 |
| **RDMA QP 级 CLB** | ❌ | ❌ | ✅ | ❌ | EOS 2025 新功能 |

### 3.3 架构与生态对比

| 维度 | NVIDIA Spectrum-X | Cisco ACI + Nexus | Arista Etherlink + EOS | H3C AD-AIDC |
|------|------------------|-------------------|----------------------|-------------|
| **芯片来源** | 自研 Spectrum-4 | Broadcom + 部分自研 | Broadcom（TH5 + J3AI） | 自研/合作 |
| **是否强制专用网卡** | 是（BlueField-3） | 否 | 否（可选 SmartNIC） | 否 |
| **控制器** | Cumulus/SONiC + NetQ | APIC / NDFC | CloudVision + AVD | AD-AIDC |
| **操作系统** | Cumulus Linux / SONiC | ACI 固件 / NX-OS | EOS | Comware |
| **最大集群规模** | 数万 XPU | 数千-数万 XPU | 10 万+ XPU（DES） | 数千 XPU |
| **厂商锁定程度** | 高（交换机 + 网卡） | 中（交换机锁定） | 低（Broadcom 芯片） | 高（自有生态） |
| **开放性** | 中（SONiC 可选） | 中（NX-OS 模式较开放） | 高（标准协议 + API） | 低（封闭生态） |
| **超大规模客户** | CoreWeave、Lambda | Cisco 自用 | Meta、Microsoft | 国内运营商/企业 |

---

## 4. 竞争优劣势分析

### 4.1 NVIDIA Spectrum-X

| 优势 | 劣势 |
|------|------|
| 性能隔离最极致（逐包 AR + 硬件 CC） | 生态最封闭（交换机 + 网卡全套 NVIDIA） |
| 端到端优化，95% 有效带宽 | 成本高（SuperNIC 额外成本） |
| 专为 NCCL 优化，AI 训练性能最佳 | 多租户策略模型简单（仅 VRF 级） |
| GPU 云服务商首选 | 不适合混合负载数据中心 |

**最佳场景**：GPU 云服务商（卖算力给多租户）、纯 AI 训练集群

### 4.2 Cisco ACI + Nexus

| 优势 | 劣势 |
|------|------|
| 多租户策略模型最成熟（EPG + Contract） | RoCE 性能隔离无专有 AI 优化 |
| 安全隔离粒度最细（白名单模型） | ACI 模式学习曲线陡峭 |
| 企业级成熟度高，合规友好 | 负载均衡仍为 per-flow ECMP |
| 混合负载（AI + 传统业务）兼容好 | 超大规模 AI 集群案例较少 |

**最佳场景**：企业数据中心（AI + 传统业务混合）、需要严格合规和精细策略的场景

### 4.3 Arista Etherlink + EOS

| 优势 | 劣势 |
|------|------|
| 架构最开放，不绑定网卡 | 多租户策略模型不如 Cisco ACI 完整 |
| VOQ + 深缓冲天然性能隔离好 | CLB 是 2025 年新功能，成熟度待验证 |
| DES 架构支持 10 万+ XPU 规模 | X 系列（TH5）无 VOQ，性能隔离弱于 R 系列 |
| Meta 等超大规模客户背书 | 国内市场渠道和服务覆盖弱 |
| CLB 正在追赶 NVIDIA 自适应路由 | 无端到端交换机-网卡协同能力 |

**最佳场景**：超大规模 AI 集群、互联网/云厂商自建数据中心

### 4.4 H3C AD-AIDC

| 优势 | 劣势 |
|------|------|
| 国产自主可控 | 公开技术文档少，方案透明度低 |
| 控制器编排能力完整（资源隔离 + 网段规划） | 无专有 AI 性能隔离机制 |
| 国内渠道和服务覆盖强 | 生态封闭，仅支持自有设备 |
| 资源隔离 + 租户标签 + VRF 思路合理 | 超大规模集群案例和验证不足 |

**最佳场景**：国内企业/运营商 AI 数据中心、国产化要求场景

---

## 5. 关键结论

### 5.1 行业趋势判断

1. **RoCE 多租户是 GPU 云的刚需**，企业自用 AI 集群通常不需要严格多租户
2. **性能隔离比网络隔离更难**，网络隔离（VRF + VNI）是通用能力，性能隔离依赖交换机专有硬件
3. **端到端协同是趋势**，NVIDIA 的交换机-网卡协同模式正在被行业认可，Arista 也开始与 SmartNIC 集成
4. **VOQ 架构在多租户场景有天然优势**，Arista R 系列的 VOQ + 深缓冲在不依赖专用网卡的前提下提供了较好的性能隔离

### 5.2 竞争定位建议

| 如果目标客户是… | 主要竞争对手 | 关键差异化方向 |
|---------------|------------|--------------|
| GPU 云服务商 | NVIDIA Spectrum-X | 性能隔离深度、NCCL 优化 |
| 企业混合数据中心 | Cisco ACI | 多租户策略精细度、合规能力 |
| 超大规模互联网公司 | Arista Etherlink | 规模、开放性、运维简洁性 |
| 国内企业/运营商 | H3C AD-AIDC | 国产化、本地服务、性价比 |

### 5.3 技术能力差距总结

| 能力 | 行业领先者 | 差距描述 |
|------|----------|---------|
| 逐包自适应路由 | NVIDIA | 仅 Spectrum-4 ASIC 支持，其他厂商无等效能力 |
| 交换机-网卡端到端拥塞控制 | NVIDIA | 需要 SuperNIC 配合，其他厂商依赖标准 DCQCN |
| 多租户策略模型 | Cisco ACI | EPG + Contract 白名单模型，其他厂商仅 VRF 级 |
| VOQ + 深缓冲架构 | Arista R 系列 | 硬件架构优势，其他厂商共享缓冲 |
| RDMA QP 级负载均衡 | Arista CLB | 2025 年新功能，NVIDIA 通过 AR 实现类似效果 |
| 超大规模调度式 Fabric | Arista DES | 仅 7700R4 支持，Meta 已验证 |

---

## 6. 图例说明

| 符号 | 含义 |
|------|------|
| ✅ | 已支持 / 能力较强 |
| 🔶 | 部分支持 / 能力一般 |
| ⬜ | 基础支持 / 能力较弱 |
| ❌ | 不支持 / 无此能力 |

---

## 7. 参考资料

1. NVIDIA Spectrum-X 技术博客 — https://developer.nvidia.com/blog/turbocharging-ai-workloads-with-nvidia-spectrum-x-networking-platform/
2. Zadara Spectrum-X 方案介绍 — https://www.zadara.com/blog/2025/06/03/high-performance-ai-networking-with-spectrum-x-enabling-nvidias-vision-through-zadara/
3. Cisco RoCE over VXLAN Fabrics 白皮书 — https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/roce-storage-implementation-over-nxos-vxlan-fabrics.html
4. Cisco AI/ML 网络蓝图 — https://www.cisco.com/c/en/us/td/docs/dcn/whitepapers/cisco-data-center-networking-blueprint-for-ai-ml-applications.html
5. Cisco VXLAN 多租户配置指南 — https://www.cisco.com/c/en/us/td/docs/switches/datacenter/pf/configuration/guide/b-pf-configuration/Multi-Tenancy.html
6. Arista Etherlink AI 平台发布 — https://www.arista.com/en/company/news/press-release/19493-arista-unveils-etherlink-ai-networking-platforms
7. Arista 7800R4 AI Spine 博客 — https://blogs.arista.com/blog/powering-ai-centers-with-ai-spines
8. Arista Smart AI Suite 发布 — https://www.arista.com/company/news/press-release/21271-pr-20250312
9. Meta RoCE 网络论文 — https://engineering.fb.com/2024/08/05/data-center-engineering/roce-network-distributed-ai-training-at-scale/
10. Meta 与 Arista 合作博客 — https://blogs.arista.com/blog/meta-and-arista-build-ai-at-scale

> *本文档中引用的外部资料内容均已改写，以符合内容许可合规要求。*