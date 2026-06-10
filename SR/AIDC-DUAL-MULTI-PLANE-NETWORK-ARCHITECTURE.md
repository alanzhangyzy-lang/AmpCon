# AIDC智算中心双平面与多平面网络架构详细方案

> 信息来源：西贝吹风公众号文章、Oracle OCI Acceleron官方博客、阿里云HPN论文、DeepSeek-V3论文(arxiv 2505.09343)
> 整理日期：2026年5月21日

---

## 一、背景与驱动力

随着大模型（LLM）参数规模指数级增长，传统三层胖树CLOS拓扑在**成本、可扩展性和鲁棒性**方面逐渐暴露局限性。核心挑战包括：

1. **交换机缓存瓶颈**：无损RDMA需要对数据包进行缓存，缓存需求随带宽、延迟和跳数增加而增加，超过一定规模，单一交换芯片无法提供足够缓冲维持无损行为
2. **哈希极化问题**：大模型训练的低熵、突发流量（elephant flows）导致ECMP哈希极化，流量分布不均
3. **成本与功耗**：三层CLOS需要大量Super-Spine交换机，成本和功耗急剧上升
4. **规模扩展限制**：单一Fabric的端口密度、光器件等物理限制

**多平面架构的核心思想**：将流量分配到多个独立的网络平面，每个平面作为独立的无阻塞、无损网络结构运行，具有独立缓存、拥塞控制和故障域。

---

## 二、智算中心组网基础架构

### 2.1 传统CLOS架构

**两层CLOS架构（Spine-Leaf）**：
```
[GPU Servers] → [Leaf/ToR] → [Spine]
```

**三层CLOS架构**：
```
[GPU Servers] → [Leaf/ToR] → [Spine] → [Super-Spine]
```

### 2.2 Rail-only架构
- MIT于2023年提出
- 保留HB域和Rail交换机，移除Spine交换机
- 显著降低网络成本和功耗
- 以51.2T交换机（128×400G端口）为例，8台交换机即可组成千卡训练集群

### 2.3 Rail-Optimized Fat-Tree（ROFT）架构
- 大部分流量聚合在轨道内传输（只经过一级交换）
- 小部分流量进行跨轨道传输（经过二级或多级）
- 多个轨道并行传输加速AI训练通信

---

## 三、双平面网络架构（Dual-Plane）

### 3.1 阿里云HPN 7.0双端口双平面架构

**发布时间**：2024年（SIGCOMM 2024论文发表）

**核心设计**：
- 在ROFT架构基础上，将每个网卡的400G端口拆分成**双端口2×200G**
- 每个200G端口分别连接到两个不同的Leaf（ToR）交换机
- Leaf交换机下行400G端口被拆分为两条200G链路，连接不同网卡端口

**网络拓扑**：
```
GPU Server (NIC: 1×400G → 2×200G)
  ├── Port 0 (200G) → ToR-A (Plane A)
  └── Port 1 (200G) → ToR-B (Plane B)

Plane A: [ToR-A Group] → [Spine-A Group]
Plane B: [ToR-B Group] → [Spine-B Group]
```

**规模能力**：两层组网即可容纳 **15,000+ GPU**（传统方案需要三层CLOS）

### 3.2 路由设计

**ECMP优化**：
- 传统网络中，多层ECMP导致哈希极化（相同五元组的流量被映射到相同路径）
- 双平面设计将ToR交换机分为两个独立组，流量进入上行链路后路径固定
- 避免了汇聚层的哈希极化，确保流量均匀分布
- 显著降低队列长度，提升网络性能

**路径选择**：
- 减少ECMP发生的次数（从多层减少到单层）
- 大幅缩小路径选择的搜索空间
- 允许精确选择能够承载elephant flows的网络路径

### 3.3 控制器/控制平面设计

**分布式控制**：
- 故障时仅需更新**局部ECMP组**，无需全局控制器介入
- 恢复效率大幅提升
- 每个平面独立运行路由协议

**故障处理**：
- GPU双上联连接两个独立ToR交换机，消除单点故障风险
- 单平面故障时，流量自动切换到另一平面
- 无需全局SDN控制器协调

### 3.4 双平面核心优势

| 特性 | 说明 |
|------|------|
| 消除哈希极化 | 两个独立ToR组，流量路径固定，避免汇聚层极化 |
| 扩展性提升 | 两层组网容纳15K+ GPU，减少一层网络 |
| 成本控制 | 相比三层CLOS减少Super-Spine层，降低部署成本 |
| 增强可靠性 | 双上联消除单点故障，局部ECMP更新即可恢复 |
| 容错能力 | 单平面故障仅损失50%带宽，不影响训练连续性 |

---

## 四、多平面网络架构（Multi-Plane）

### 4.1 三种多平面组网类型

#### 类型一：单服务器多GPU卡多平面（DeepSeek MPFT）

**代表方案**：DeepSeek-V3 Multi-Plane Fat-Tree（MPFT）

**架构描述**：
- 每个节点配备8块GPU和8个400Gbps IB NIC
- 每块GPU对应一个独立的IB NIC，属于不同的"网络平面"（Plane）
- 8块GPU卡对应连接到8个不同的Plane（即8个两层胖树平面）

**网络拓扑**：
```
GPU Server Node (8 GPU + 8 NIC):
  GPU0 → NIC0 → Plane 0 (Leaf-Spine)
  GPU1 → NIC1 → Plane 1 (Leaf-Spine)
  GPU2 → NIC2 → Plane 2 (Leaf-Spine)
  ...
  GPU7 → NIC7 → Plane 7 (Leaf-Spine)

每个Plane内部（两层胖树）:
  32 Spine + 64 Leaf
  每Plane接入: 64 × 32 = 2,048 GPU
  8个Plane总计: 16,384 GPU
```

**交换机规格**：64×400G IB交换机

**路由设计**：
- 每个Plane内部独立运行路由协议（IB子网管理器）
- 跨平面流量交换必须通过**节点内转发（Intra-node forwarding）**
- 即：GPU-A（Plane 0）→ 节点内NVLink/PCIe → GPU-B（Plane 3）→ NIC-B → Plane 3网络

**控制器设计**：
- 每个Plane有独立的IB子网管理器（Subnet Manager）
- 各Plane独立进行路由计算和路径分配
- 无需跨Plane的全局控制器

**成本优势**：相比三层胖树架构，MPFT可节省高达**40%**的网络成本

#### 类型二：单GPU卡多网口多平面（OCI / 阿里云扩展）

**代表方案**：Oracle OCI 4-Plane、阿里云HPN双平面

**核心原理**：
- 将GPU卡对应的Scale-out网卡上单个400G或800G端口，拆分为2个或4个低速200G端口
- 每个200G端口分别连接到不同的网络平面

**Oracle OCI 4-Plane架构**：
```
GPU Server:
  GPU → NIC (4×200G ports)
    ├── Port 0 (200G) → Plane 0
    ├── Port 1 (200G) → Plane 1
    ├── Port 2 (200G) → Plane 2
    └── Port 3 (200G) → Plane 3

每个Plane: 独立的两层Clos Fabric
  - 独立数据平面
  - 独立控制平面
  - 独立缓存和拥塞控制
```

**多级负载均衡机制**：
1. **NIC层面流量分流**（第一层）：数据包进入网络时在NIC层面进行流量分流到不同Plane
2. **平面内每跳负载均衡**（第二层）：数据包在对应Plane内通过交换矩阵传输时，每个交换节点进行ECMP负载均衡
3. **端到端拥塞控制**：系统实时感知每个Plane的拥堵状态，动态调整流量分配策略
4. **每通道负载平衡**：防止单一热点路径拥塞
5. **链路级保活信号**：确保物理连接的稳定性和可靠性

**路由设计（Oracle Acceleron）**：
- 每个Plane是完全独立的Clos Fabric，有独立的数据平面和控制平面
- **无命运共享（No Fate Sharing）**：各Plane之间无物理或逻辑关联
- 典型物理网络路由协议不足以支撑多平面决策
- **关键创新**：路由决策在网络边缘（NIC）完成，而非网络设备内部
- NIC固件 + 主机软件组合进行路径探测和最优路由选择
- NIC主动探测网络识别最优路由

**控制器设计（Oracle Acceleron）**：
- 每个Plane有**独立的控制平面**，互不影响
- 网络收敛事件（链路故障/恢复）限制在单个Plane内
- NOS（网络操作系统）可以在不同Plane上运行不同版本
- 支持分阶段升级、滚动更新、快速回滚
- 无需集群级别的全局控制器协调

**规模能力**：OCI支持扩展到 **131,072 GPU** 及以上

#### 类型三：单GPU卡单网口多光通道多平面

**核心原理**：
- 单个400G或800G网络接口由4个光学通道组成（4×100G或4×200G）
- 光纤连接采用4通道8芯的多模或单模光纤
- 通过**Shuffle Box**进行多个光学通道的"洗牌"或"映射"后连接到不同Plane的交换机

**网卡支持**：
- NVIDIA CX-8已原生支持4个网络平面（4-Plane）
- 在一个QP（Queue Pair）上实现多路径数据包喷洒（multi-path packet spraying）
- 支持硬件级乱序包处理，确保数据一致性

**网络拓扑**：
```
GPU → NIC (单800G端口, 4×200G光学通道)
  → Shuffle Box (光纤通道映射)
    ├── 通道0 → Plane 0 Leaf交换机
    ├── 通道1 → Plane 1 Leaf交换机
    ├── 通道2 → Plane 2 Leaf交换机
    └── 通道3 → Plane 3 Leaf交换机
```

### 4.2 理想多平面组网模式（4-Plane详细设计）

以102.4T交换机为例：
- 提供128个800G端口
- 通过Shuffle提供512个200G端口
- 每个GPU通过4个200G分别连接到4个不同Plane
- 用一个QP驱动4个port，进行**逐包负载均衡选路**
- 对MoE all-to-all流量更友好

**规模计算（两层4平面）**：
```
交换机: 102.4T (128×800G → 512×200G via Shuffle)
Spine: 1,024台
Leaf:  2,048台
总GPU: 16,384个
```

注：交换机数量是单端口MPFT组网（768台）的4倍，但每GPU获得4倍带宽和冗余。

---

## 五、路由设计详解

### 5.1 AIDC网络路由的核心挑战

AI训练网络的路由设计与传统数据中心有本质区别，核心挑战包括：

**流量模式特殊性**：
- AllReduce集合通信产生大量**同步突发流量**（Incast），所有GPU在同一时刻发送数据
- MoE模型的All-to-All通信产生**全网状流量矩阵**，任意GPU对之间都有通信需求
- 流量呈现**低熵特征**：五元组种类少（同一训练任务的GPU间通信），传统ECMP哈希难以有效分散
- **Elephant Flow主导**：单条流可达数百Gbps，持续时间长

**无损传输要求**：
- RoCE/IB要求零丢包，任何丢包都会触发重传，严重影响训练效率
- PFC（Priority Flow Control）反压机制可能导致**HoL Blocking**和**PFC Storm**
- 需要在保证无损的同时实现高效负载均衡

**规模与延迟矛盾**：
- 万卡/十万卡集群要求极低的GPU-to-GPU延迟（<10μs同Pod内）
- 传统三层CLOS增加跳数，每跳增加~300-500ns延迟
- 多平面设计通过减少层数来降低延迟

### 5.2 AIDC网络Underlay与Overlay协议设计

在讨论具体的双平面/多平面路由设计之前，需要先明确AIDC网络中Underlay和Overlay的协议选择。这是多平面Clos网络路由设计的基础框架。

#### 5.2.1 AIDC网络分层架构

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIDC数据中心网络分层                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 前端网络 (Frontend Network)                                 │ │
│  │  - 用户接入、管理、数据集加载                                │ │
│  │  - 传统Ethernet + EVPN/VXLAN Overlay                       │ │
│  │  - 100/200GbE，可接受一定超额订阅                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 后端网络 (Backend Network) — GPU互联                        │ │
│  │  - GPU-to-GPU集合通信 (AllReduce/All-to-All)               │ │
│  │  - RoCEv2/InfiniBand，无损传输                              │ │
│  │  - 400/800GbE，1:1无超额订阅                               │ │
│  │  - 双平面/多平面Clos架构                                    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 存储网络 (Storage Network)                                  │ │
│  │  - 数据集读取、Checkpoint写入                               │ │
│  │  - RoCE或TCP，可独立或与前端融合                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### 5.2.2 后端网络（GPU Backend）的Underlay协议设计

GPU后端网络是双平面/多平面架构的核心，其Underlay协议设计有两种主流方案：

**方案A：纯L3 Underlay（Pure L3 Routed Fabric）— 主流方案**

```
┌─────────────────────────────────────────────────────────────┐
│ 纯L3 Underlay (无Overlay)                                    │
├─────────────────────────────────────────────────────────────┤
│ 路由协议: eBGP Unnumbered (IPv6 Link-Local)                  │
│ 寻址方式: 每条GPU-Leaf链路分配 /31 IPv4 或 /127 IPv6         │
│ 转发方式: 纯IP路由 + ECMP                                    │
│ 多租户隔离: 无（专用集群，单租户）                            │
│ RoCE传输: RoCEv2直接在L3 Underlay上运行                      │
│ 拥塞控制: DCQCN + PFC (直接在物理接口)                       │
├─────────────────────────────────────────────────────────────┤
│ 适用场景:                                                    │
│ • 专用AI训练集群（单租户/单任务）                            │
│ • 追求最低延迟和最高性能                                     │
│ • Meta、阿里云HPN、DeepSeek等大规模训练集群                  │
│ • OpenAI Stargate (SRv6静态路由)                             │
└─────────────────────────────────────────────────────────────┘
```

**每个Plane内的BGP设计**：
```
Plane内BGP拓扑 (以双平面为例):

Plane A:
  ┌─────────────────────────────────────────────┐
  │ Spine-A1 (AS 65001)                          │
  │ Spine-A2 (AS 65002)                          │
  │ ...                                          │
  │ Spine-AN (AS 65xxx)                          │
  ├─────────────────────────────────────────────┤
  │         ↕ eBGP (IPv6 Link-Local)            │
  ├─────────────────────────────────────────────┤
  │ Leaf-A1 (AS 64001) ← GPU Server 1 Port-A   │
  │ Leaf-A2 (AS 64002) ← GPU Server 2 Port-A   │
  │ ...                                          │
  └─────────────────────────────────────────────┘

Plane B:
  ┌─────────────────────────────────────────────┐
  │ Spine-B1 (AS 65101)                          │
  │ Spine-B2 (AS 65102)                          │
  │ ...                                          │
  ├─────────────────────────────────────────────┤
  │         ↕ eBGP (IPv6 Link-Local)            │
  ├─────────────────────────────────────────────┤
  │ Leaf-B1 (AS 64101) ← GPU Server 1 Port-B   │
  │ Leaf-B2 (AS 64102) ← GPU Server 2 Port-B   │
  │ ...                                          │
  └─────────────────────────────────────────────┘

特点:
  • 每个Plane独立AS空间，路由完全隔离
  • eBGP Unnumbered: 使用IPv6 Link-Local地址建立邻居
  • 无需手动配置邻居IP，简化大规模部署
  • BFD加速故障检测 (<50ms)
  • ECMP: 等价多路径，Leaf到任意Spine均为等价路径
```

**为什么GPU后端网络主流选择纯L3而非Overlay？**

| 维度 | 纯L3 Underlay | EVPN/VXLAN Overlay |
|------|--------------|-------------------|
| 延迟 | 最低（无封装开销） | 增加~50字节VXLAN头，增加封装/解封装延迟 |
| MTU | 无额外开销 | VXLAN封装需要额外50字节，需要Jumbo Frame(9000+) |
| DCQCN/PFC | 直接在物理接口生效 | 需要VXLAN-aware DCQCN，复杂度增加 |
| 复杂度 | 简单（纯路由） | 复杂（BGP EVPN + VXLAN + VRF） |
| 故障排查 | 直观（标准traceroute） | 困难（封装隧道内的问题难以定位） |
| 多租户 | 不支持（单租户专用） | 支持（VRF隔离） |
| 适用场景 | 专用训练集群 | GPUaaS多租户环境 |

**Meta的实践**：Meta在其大规模RoCE训练集群中采用纯L3 Routed Fabric，将GPU后端网络与前端网络物理分离，后端网络不需要Overlay，因为是单租户专用。

**阿里云HPN的实践**：HPN 7.0后端网络同样采用纯L3设计，每个Plane内运行独立的eBGP实例，RoCEv2直接在L3 Underlay上传输。

---

**方案B：EVPN/VXLAN Overlay（多租户GPUaaS场景）**

```
┌─────────────────────────────────────────────────────────────┐
│ EVPN/VXLAN Overlay (多租户GPU后端网络)                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Overlay层:                                                   │
│  • BGP EVPN控制平面 (RT5 IP Prefix / RT2 MAC-IP)           │
│  • VXLAN数据平面封装                                        │
│  • 每租户独立IP-VRF (L3隔离)                                │
│  • 可选MAC-VRF (L2扩展)                                     │
│                                                              │
│ Underlay层:                                                  │
│  • eBGP Unnumbered (IPv6 Link-Local)                        │
│  • 纯L3路由 + ECMP                                          │
│  • 提供VTEP间的IP可达性                                     │
│                                                              │
│ RoCE传输:                                                    │
│  • RoCEv2 over VXLAN                                        │
│  • VXLAN-aware DCQCN拥塞控制                                │
│  • 需要交换机支持内层ECN标记                                 │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│ 适用场景:                                                    │
│ • GPU-as-a-Service (GPUaaS) 多租户环境                      │
│ • 需要租户间强隔离的共享集群                                 │
│ • Cisco、Juniper、Dell等企业级AI Fabric方案                  │
└─────────────────────────────────────────────────────────────┘
```

**EVPN/VXLAN在多平面中的部署模式**（Juniper JVD方案）：

```
多平面 + EVPN/VXLAN 多租户设计:

物理层: 4-Plane Clos (每Plane独立Leaf-Spine)
  ├── Plane 0: Leaf-Spine Fabric
  ├── Plane 1: Leaf-Spine Fabric
  ├── Plane 2: Leaf-Spine Fabric
  └── Plane 3: Leaf-Spine Fabric

Underlay (每Plane内):
  ├── eBGP Unnumbered (IPv6 Link-Local)
  ├── Leaf-Spine间建立eBGP邻居
  └── 通告Loopback地址 (VTEP IP)

Overlay (跨Plane逻辑统一):
  ├── BGP EVPN Session (Leaf间iBGP或eBGP)
  ├── EVPN RT5 (IP Prefix Route) → 每租户一个IP-VRF
  ├── VXLAN VNI → 每租户一个VNI
  └── 租户GPU流量在VRF内路由，跨Plane通过NIC分流

租户隔离:
  Tenant A: VRF-A (VNI 10001) → GPU 0,1,2,3 on Server 1
  Tenant B: VRF-B (VNI 10002) → GPU 4,5,6,7 on Server 1
  Tenant C: VRF-C (VNI 10003) → All GPUs on Server 2,3
```

**两种EVPN模型对比**（来自Juniper JVD）：

| 维度 | Pure Type 5 EVPN/VXLAN | VLAN-Aware EVPN/VXLAN |
|------|------------------------|----------------------|
| 服务类型 | 纯L3 (IP-VRF only) | L2+L3 (MAC-VRF + IP-VRF) |
| 接口模式 | Access-mode, /31或/127 P2P | Access-mode, VLAN per link |
| VNI分配 | 每租户1个VNI | 每租户8个VNI (每GPU链路一个) |
| IRB接口 | 无 | 8个Anycast Gateway per server |
| MAC学习 | 无 | 有 |
| 拥塞控制 | Pure Type 5 DCQCN | Type 2&5 DCQCN |
| 复杂度 | 低 | 高 |
| 适用场景 | 大规模AI训练（长任务） | GPUaaS推理（短任务、动态分配） |
| 推荐度 | ★★★★★ (首选) | ★★★ (特殊需求时) |

**结论**：对于大规模AI训练集群，Pure Type 5 EVPN/VXLAN优于VLAN-Aware模型，因为其简化的IP路由、稳定的寻址和最小的控制平面开销更适合长时间运行的紧耦合训练任务。

#### 5.2.3 多平面架构下Underlay/Overlay的协议选择决策树

```
                    ┌─────────────────────┐
                    │ GPU后端网络需求分析   │
                    └─────────┬───────────┘
                              │
                    ┌─────────▼───────────┐
                    │ 是否需要多租户隔离？  │
                    └─────────┬───────────┘
                              │
              ┌───────────────┼───────────────┐
              │ 否                             │ 是
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ 纯L3 Underlay    │             │ 需要L2扩展？     │
    │ (无Overlay)      │             └────────┬────────┘
    │                  │                      │
    │ • eBGP Unnumb.   │          ┌───────────┼───────────┐
    │ • 每Plane独立    │          │ 否                     │ 是
    │ • RoCEv2直接跑   │          ▼                       ▼
    │ • DCQCN+PFC     │  ┌───────────────┐    ┌───────────────┐
    │                  │  │ Pure RT5 EVPN │    │ VLAN-Aware    │
    │ 适用:            │  │ (IP-VRF only) │    │ EVPN/VXLAN    │
    │ • 专用训练集群   │  │               │    │ (MAC-VRF+IRB) │
    │ • Meta/阿里/DS   │  │ 适用:         │    │               │
    │ • OpenAI MRC     │  │ • GPUaaS训练  │    │ 适用:         │
    └─────────────────┘  │ • 多租户隔离  │    │ • GPUaaS推理  │
                          │ • 企业AI平台  │    │ • 遗留应用    │
                          └───────────────┘    └───────────────┘
```

#### 5.2.4 各方案Underlay/Overlay协议栈总结

| 方案 | Underlay协议 | Overlay协议 | RoCE承载方式 | 多租户 |
|------|-------------|------------|-------------|--------|
| 阿里云HPN 7.0 | eBGP Unnumbered per Plane | 无 | RoCEv2 on L3 | 否 |
| DeepSeek MPFT | IB SM per Plane | 无（IB原生） | IB RDMA | 否 |
| Oracle OCI Acceleron | eBGP per Plane | 无（NIC MRC） | RoCEv2 on L3 | 否（NIC级隔离） |
| OpenAI MRC | SRv6静态路由 per Plane | 无 | RoCEv2 on SRv6 | 否 |
| Juniper JVD (GPUaaS) | eBGP Unnumbered | BGP EVPN RT5 + VXLAN | RoCEv2 over VXLAN | 是 |
| Cisco AI Fabric (GPUaaS) | eBGP | BGP EVPN + VXLAN | RoCEv2 over VXLAN | 是 |
| Dell AI Factory | eBGP | EVPN/VXLAN | RoCEv2 over VXLAN | 是 |

**关键洞察**：

1. **超大规模训练集群（Meta/阿里/DeepSeek/OpenAI）**：一律采用**纯L3 Underlay，无Overlay**。原因是这些集群是专用的，不需要多租户隔离，而Overlay带来的封装开销和复杂度会降低RoCE性能。

2. **企业级GPUaaS平台（Cisco/Juniper/Dell）**：采用**EVPN/VXLAN Overlay**。原因是需要在共享物理基础设施上为多个租户提供GPU资源隔离，EVPN提供了成熟的多租户VRF隔离机制。

3. **多平面架构下的Overlay部署**：即使使用EVPN/VXLAN，每个物理Plane内仍然是独立的Underlay BGP实例。Overlay的EVPN Session可以跨Plane建立（通过NIC多端口连接），但数据平面的VXLAN封装仍在各Plane内独立转发。

4. **VXLAN-aware DCQCN**：当RoCE over VXLAN时，交换机需要能够识别VXLAN内层的RoCE包并正确执行ECN标记和PFC，这对交换机芯片提出了额外要求（如Broadcom Tomahawk5+、Jericho3-AI等支持）。

---

### 5.3 双平面路由设计（阿里云HPN 7.0）

#### 5.3.1 路由协议架构

```
┌─────────────────────────────────────────────────────┐
│                   路由协议栈                          │
├─────────────────────────────────────────────────────┤
│ L3路由: BGP Unnumbered / eBGP (每Plane独立AS设计)    │
│ 负载均衡: 改进型ECMP + Flowlet Switching             │
│ 拥塞控制: DCQCN (端到端) + ECN标记 (交换机)          │
│ 流量调度: NIC双端口分流 (第一级) + Plane内ECMP (第二级)│
└─────────────────────────────────────────────────────┘
```

**BGP路由设计**：
- 采用**eBGP Unnumbered**作为Underlay路由协议
- 每个Plane分配独立的AS号空间，Plane间路由完全隔离
- Leaf-Spine之间建立eBGP邻居关系
- 路由收敛限制在单Plane内，故障不跨Plane传播

**ECMP路径计算**：
- 传统三层CLOS中，从Leaf到目的Leaf需要经过两次ECMP选择（Leaf→Spine、Spine→目的Leaf）
- HPN双平面设计中，流量进入某个Plane后，仅需**一次ECMP选择**（ToR→Spine）
- Spine到目的ToR的路径是确定性的（因为目的ToR只在一个Plane中）
- 这将ECMP决策点从2个减少到1个，大幅降低哈希极化概率

#### 5.3.2 负载均衡机制

**第一级：NIC端口级分流**
```
发送端GPU → NIC (400G = 2×200G)
  ├── 流A → Port 0 → Plane A
  └── 流B → Port 1 → Plane B
分流策略: 基于QP/流的哈希，或基于拥塞感知的动态分配
```

**第二级：Plane内ECMP**
```
Plane A内部:
  ToR-A → ECMP选择 → Spine-A1 / Spine-A2 / ... / Spine-AN
  选择依据: 五元组哈希 + Flowlet切换
```

**Flowlet Switching（流片段切换）**：
- 将长流（Elephant Flow）按时间间隔切分为多个Flowlet
- 当检测到流中出现idle gap（>Flowlet间隔阈值，通常50-200μs）时，允许将后续Flowlet重新哈希到不同路径
- 避免了逐包喷洒带来的乱序问题，同时实现了比纯ECMP更好的负载均衡
- HPN中Flowlet间隔阈值需要根据AllReduce通信模式精心调优

**自适应路由（Adaptive Routing / ARS）**：
- 交换机芯片（如Broadcom Tomahawk5/Jericho3-AI）支持ARS（Adaptive Routing and Switching）
- 交换机实时监测各上行链路的队列深度/拥塞状态
- 动态将新到达的数据包/Flowlet调度到最空闲的上行链路
- 相比静态ECMP哈希，ARS可以将尾延迟降低30-50%

#### 5.3.3 拥塞控制

**DCQCN（Data Center Quantized Congestion Notification）**：
```
发送端NIC                    交换机                    接收端NIC
    │                          │                          │
    │──── 数据包 ────────────→│                          │
    │                          │ 队列超阈值→标记ECN       │
    │                          │──── ECN标记包 ─────────→│
    │                          │                          │
    │←──────────── CNP（拥塞通知包）────────────────────│
    │                          │                          │
    │ 降低发送速率              │                          │
    │ (基于α/β参数的            │                          │
    │  速率调节算法)            │                          │
```

- 交换机设置ECN标记阈值（通常为队列深度的30-50%）
- 接收端NIC收到ECN标记包后，向发送端发送CNP（Congestion Notification Packet）
- 发送端根据CNP频率动态调整发送速率
- HPN中针对AllReduce的Incast模式优化了DCQCN参数

**PFC（Priority Flow Control）**：
- 作为最后防线，防止缓冲区溢出导致丢包
- 设置PFC触发阈值高于ECN阈值（确保ECN先生效）
- HPN通过双平面分散流量，降低单Plane内的PFC触发频率
- 引入**PFC Watchdog**：检测PFC Storm并自动关闭异常端口

#### 5.3.4 故障场景下的路由收敛

**单链路故障**：
- BGP检测到邻居Down（BFD加速检测，<50ms）
- 仅更新该Plane内受影响的ECMP组（移除故障下一跳）
- 收敛时间：<100ms
- 另一Plane完全不受影响

**单ToR故障**：
- 该ToR下挂的GPU通过另一Plane的ToR继续通信
- 带宽降为50%（单Plane承载）
- 无需全局路由重算

**单Spine故障**：
- 该Plane内所有ToR更新ECMP组（移除故障Spine）
- 该Plane内带宽按比例下降（如原8条ECMP路径变为7条）
- 另一Plane不受影响

### 5.4 多平面路由设计（DeepSeek MPFT - InfiniBand）

#### 5.4.1 IB子网管理器（Subnet Manager）路由

**路由协议**：
- InfiniBand不使用传统IP路由协议（BGP/OSPF）
- 采用集中式**Subnet Manager（SM）**计算全网路由
- 每个Plane有独立的SM（主备模式）
- SM计算线性转发表（LFT），下发到每台交换机

**路由算法**：
```
SM路由计算流程:
1. 拓扑发现: SM通过SMP（Subnet Management Packet）发现全Plane拓扑
2. 路径计算: 基于Min-Hop或Fat-Tree路由算法计算所有源-目的对的路径
3. LFT生成: 为每台交换机生成线性转发表（端口→目的LID映射）
4. LFT下发: 通过SMP将LFT写入每台交换机的转发引擎
5. 周期性重算: 拓扑变化时触发部分或全量路由重算
```

**Fat-Tree路由算法**：
- 上行阶段：数据包从源Leaf向上转发到Spine，在每一层进行负载均衡分散
- 下行阶段：数据包从Spine向下确定性转发到目的Leaf
- 确保同一源-目的对的流量均匀分布在所有可用的上行路径上

#### 5.4.2 跨Plane路由（节点内转发）

```
GPU-0 (Plane 0) 需要与 远端GPU-3 (Plane 3) 通信:

方案: 节点内转发 (Intra-node Forwarding)
┌──────────────────────────────────────────────────┐
│ 本地节点                                          │
│  GPU-0 → NVLink/PCIe → GPU-3 → NIC-3 → Plane 3  │
│  (Plane 0)              (Plane 3)                 │
└──────────────────────────────────────────────────┘
         ↓ Plane 3网络传输
┌──────────────────────────────────────────────────┐
│ 远端节点                                          │
│  NIC-3 → GPU-3                                    │
│  (Plane 3)                                        │
└──────────────────────────────────────────────────┘
```

- 跨Plane通信必须经过节点内部的GPU互联（NVLink/PCIe）
- 这意味着跨Plane通信会消耗节点内部互联带宽
- DeepSeek通过**通信调度优化**，尽量将同一Plane内的GPU分配到同一并行组，减少跨Plane通信

#### 5.4.3 自适应路由（IB Adaptive Routing）

- IB交换机支持**Adaptive Routing（AR）**
- 交换机根据本地端口拥塞状态，动态选择转发端口
- 与静态LFT路由互补：LFT提供基础路径，AR在拥塞时动态偏移
- DeepSeek集群中AR对All-to-All通信模式效果显著

### 5.5 多平面路由设计（Oracle OCI Acceleron - RoCE）

#### 5.5.1 路由架构分层

```
┌─────────────────────────────────────────────────────────────┐
│                    OCI多平面路由架构                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 第一层: NIC边缘路由 (跨Plane决策)                      │   │
│  │  - NIC固件 + 主机软件协同                              │   │
│  │  - 主动探测各Plane健康状态和拥塞程度                    │   │
│  │  - 逐包/逐Flowlet选择最优Plane                        │   │
│  │  - Multipath Reliable Connection (MRC) 协议           │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ 第二层: Plane内Clos路由 (Plane内转发)                  │   │
│  │  - 每Plane独立运行路由协议 (BGP/OSPF)                  │   │
│  │  - 标准两层Clos ECMP转发                               │   │
│  │  - 交换机级ARS自适应路由                               │   │
│  │  - 独立的拥塞控制域                                    │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 5.5.2 NIC边缘路由（关键创新）

**为什么路由决策在NIC而非交换机？**
- 多Plane网络中，交换机只能看到自己所在Plane的状态
- 交换机无法感知其他Plane的拥塞/故障情况
- 只有NIC同时连接所有Plane，具有全局视野
- 因此，跨Plane的路由决策必须在NIC层面完成

**Multipath Reliable Connection（MRC）协议**：
- Oracle为多平面网络设计的专用传输协议
- 在单个QP连接上支持多路径并行传输
- 发送端NIC将数据包分散到多个Plane
- 接收端NIC负责乱序重组和可靠性保证

**NIC路由决策流程**：
```
1. 路径探测 (Path Probing):
   - NIC定期向各Plane发送探测包
   - 测量每个Plane的RTT、丢包率、拥塞程度
   - 建立各Plane的实时健康状态表

2. 路径选择 (Path Selection):
   - 基于探测结果，为每个数据包/Flowlet选择最优Plane
   - 选择策略: 加权轮询 / 最小RTT / 最小队列深度
   - 支持动态权重调整（拥塞Plane降权）

3. 故障检测与切换 (Failure Detection):
   - 探测包超时 → 标记Plane为不健康
   - 立即将流量转移到健康Plane
   - 无需等待网络层路由收敛
   - 切换时间: <1ms（NIC硬件级别）

4. 拥塞反馈闭环:
   - 接收端NIC通过CNP反馈各Plane拥塞信息
   - 发送端NIC据此调整各Plane的流量分配比例
   - 实现跨Plane的全局最优负载均衡
```

#### 5.5.3 Plane内路由

**路由协议**：
- 每个Plane运行独立的BGP实例（eBGP Unnumbered）
- Leaf-Spine之间建立BGP邻居
- 路由表规模小（单Plane内节点数 = 总节点数/Plane数）
- 收敛速度快（故障域小）

**Plane内ECMP + ARS**：
- 标准ECMP在Leaf→Spine方向进行负载均衡
- ARS（Adaptive Routing and Switching）在交换机芯片级别动态调整
- 结合NIC层面的跨Plane分流，实现三级负载均衡

#### 5.5.4 端到端拥塞控制

```
OCI拥塞控制分层:

Layer 1 - 跨Plane拥塞均衡 (NIC层):
  ├── 探测各Plane拥塞状态
  ├── 动态调整Plane间流量分配
  └── 避免将流量发送到已拥塞的Plane

Layer 2 - Plane内拥塞控制 (交换机+NIC):
  ├── ECN标记 (交换机队列超阈值时标记)
  ├── DCQCN速率调节 (发送端根据CNP降速)
  └── PFC反压 (最后防线，防止丢包)

Layer 3 - 链路级流控 (物理层):
  ├── 信用制流控 (Credit-based Flow Control)
  └── 保活信号 (Link Keepalive)
```

### 5.6 多平面路由设计（4-Plane RoCE通用方案）

#### 5.6.1 逐包喷洒路由（Per-Packet Spraying）

**传统ECMP vs 逐包喷洒**：

| 维度 | 传统ECMP | Flowlet Switching | 逐包喷洒 |
|------|----------|-------------------|----------|
| 分流粒度 | 流（五元组哈希） | 流片段（idle gap切分） | 单个数据包 |
| 乱序风险 | 无 | 极低 | 高（需硬件重组） |
| 负载均衡效果 | 差（elephant flow问题） | 中等 | 最优（理论最均匀） |
| 硬件要求 | 无特殊要求 | 交换机支持Flowlet检测 | NIC支持乱序重组 |
| 适用场景 | 通用DC | AI训练（AllReduce） | AI训练（MoE All-to-All） |

**CX-8逐包喷洒实现**：
```
发送端 CX-8 NIC:
  QP发送队列 → 逐包Round-Robin分配到4个Port
  ├── Packet 1 → Port 0 → Plane 0
  ├── Packet 2 → Port 1 → Plane 1
  ├── Packet 3 → Port 2 → Plane 2
  ├── Packet 4 → Port 3 → Plane 3
  ├── Packet 5 → Port 0 → Plane 0
  └── ...

接收端 CX-8 NIC:
  4个Port接收 → 硬件乱序重组引擎 → 按序号重排 → 交付上层
  - 重组窗口: 支持数千个outstanding packets
  - 硬件级别完成，无CPU开销
  - PSN (Packet Sequence Number) 用于排序
```

#### 5.6.2 QP多路径（Multi-Path QP）

**传统RoCE QP**：
- 一个QP绑定一个网络路径（源IP/端口 → 目的IP/端口）
- 路径固定，无法利用多Plane带宽

**Multi-Path QP（CX-8/Acceleron）**：
- 单个QP可以同时使用多个物理路径（多个Plane）
- QP内部维护多个子连接（Sub-Connection），每个对应一个Plane
- 发送端在子连接间进行数据包分发
- 接收端跨子连接进行乱序重组
- 对上层应用透明（NCCL/MPI无需修改）

```
Multi-Path QP 结构:
┌─────────────────────────────────────┐
│ QP (应用层视角: 单一连接)            │
├─────────────────────────────────────┤
│ Sub-Connection 0 → Plane 0          │
│ Sub-Connection 1 → Plane 1          │
│ Sub-Connection 2 → Plane 2          │
│ Sub-Connection 3 → Plane 3          │
├─────────────────────────────────────┤
│ 发送调度器: Round-Robin / 加权 / 拥塞感知 │
│ 接收重组器: PSN排序 + 滑动窗口       │
└─────────────────────────────────────┘
```

#### 5.6.3 与集合通信库的协同

**NCCL/集合通信层面的路由感知**：
- NCCL（NVIDIA Collective Communications Library）负责集合通信的逻辑拓扑
- 多平面网络下，NCCL需要感知物理Plane拓扑
- Ring/Tree AllReduce的逻辑环/树需要与物理Plane对齐

**通信调度优化**：
```
AllReduce (Ring算法) 在多平面下的优化:
  - 将Ring中相邻节点尽量安排在同一Plane内
  - 减少跨Plane通信（特别是MPFT架构下的节点内转发）
  - Plane内通信延迟更低、带宽更确定

All-to-All (MoE) 在多平面下的优化:
  - All-to-All天然产生全网状流量，适合逐包喷洒
  - 4-Plane逐包喷洒可以将All-to-All带宽提升接近4倍
  - 每个Plane承载约1/4的All-to-All流量
```

### 5.7 OpenAI MRC多平面路由设计（2026年最新）

> 来源：OpenAI于2026年5月发布MRC协议，与NVIDIA、AMD、Broadcom、Intel、Microsoft联合开发，已提交OCP（Open Compute Project）开源。论文：[Resilient AI Supercomputer Networking using MRC and SRv6](https://arxiv.org/abs/2605.04333)

#### 5.7.1 MRC协议核心理念

MRC（Multipath Reliable Connection）代表了AI网络路由设计的**范式转变**：

**传统思路**：消除故障 → 保证无丢包 → 单路径传输
**MRC思路**：假设故障不可避免 → 容忍丢包 → 多路径喷洒 → 快速重传

**核心设计原则**：
- 禁用所有动态路由协议（无BGP、无OSPF）
- 接受有意的丢包（不追求零丢包）
- 将每个传输喷洒到数百条随机路径上
- 交换机做"哑设备"，只转发不决策

#### 5.7.2 SRv6静态路由（"Dumb Switch"模型）

**彻底简化控制平面**：
```
传统AI网络控制平面:
  ├── BGP动态路由协议
  ├── 路由收敛机制
  ├── ECMP哈希计算
  ├── Flowlet状态维护
  └── 复杂的故障恢复逻辑

MRC控制平面 (SRv6静态路由):
  ├── 发送端定义完整转发路径
  ├── 路由信息嵌入数据包头部（SRv6 Segment List）
  ├── 交换机仅按指令转发（无路由计算）
  └── 无动态路由协议、无收敛延迟
```

**SRv6路由工作方式**：
```
发送端NIC构造数据包:
┌─────────────────────────────────────────────┐
│ IPv6 Header                                  │
│ SRv6 Segment Routing Header:                 │
│   Segment[0] = 目的Leaf交换机 SID            │
│   Segment[1] = 中间Spine交换机 SID           │
│   Segment[2] = 源Leaf交换机 SID              │
│ Payload (RDMA数据)                           │
└─────────────────────────────────────────────┘

交换机处理:
  1. 读取当前活跃Segment
  2. 按Segment指示的下一跳转发
  3. 递减Segment Left指针
  4. 无需查路由表、无需ECMP哈希计算
```

**优势**：
- 交换机软件极度简化，降低bug风险
- 无路由收敛延迟（路由是静态的）
- 确定性转发，延迟可预测
- 在包含数十万台交换机的超大规模环境中，消除了分布式路由协议的复杂性

#### 5.7.3 逐包喷洒 + 多Plane并行

**MRC的流量分发机制**：
```
单个RDMA传输 (如 AllReduce的一个chunk):
  → 拆分为数百个数据包
  → 每个包随机选择:
      1. 目标Plane (从可用的N个Plane中选择)
      2. Plane内的具体路径 (通过SRv6 Segment指定)
  → 数百个包同时在数百条不同路径上并行传输

示例 (4-Plane, 每Plane 8条ECMP路径):
  总可用路径数 = 4 × 8 = 32条独立路径
  单个传输的包分散在32条路径上
  任一路径拥塞/故障只影响 ~3% 的包
```

**与传统RoCE的对比**：

| 维度 | 传统RoCE | OpenAI MRC |
|------|----------|------------|
| 路径模型 | 单路径 | 多路径喷洒 |
| 拥塞处理 | 热点易发 | 负载均衡 |
| 故障恢复 | 秒级 | 微秒级 |
| 控制平面 | 动态且复杂 | 静态且简化 |
| 稳定性 | 对故障敏感 | 容错设计 |
| 带宽利用率 | ~65% | ~96% |
| 网络层数 | 3-4层 | 2层 |
| GPU规模 | 有限 | 131,000+ |
| 网络跳数 | 5-7跳 | ~3跳 |

#### 5.7.4 MRC智能拥塞控制与自愈

**Packet Truncation（包截断）**：
```
传统方式: 拥塞时丢弃整个数据包 → 发送端超时才发现丢包
MRC方式:
  1. 交换机缓冲区满时，不完全丢弃数据包
  2. 移除Payload，保留Header
  3. 将截断的Header高优先级转发到目的端
  4. 目的端收到截断Header → 立即请求重传
  5. 避免将拥塞事件误判为路径故障
```

**微秒级故障恢复**：
```
故障检测与恢复流程:
  T=0μs:    链路故障发生
  T=10μs:   NIC检测到该路径上的包未收到ACK/截断通知
  T=20μs:   将该路径加入黑名单
  T=30μs:   后续包自动避开故障路径
  T=持续:   定期发送探测包检查故障路径是否恢复
  T=恢复:   路径恢复后自动重新加入活跃路径池

对比传统网络:
  BGP收敛: 数百毫秒到数秒
  PFC恢复: 数十毫秒
  MRC切换: 数十微秒
```

**持续路径探测（Continuous Path Probing）**：
- 被黑名单的路径不会永久禁用
- MRC持续发送探测包检测故障链路是否恢复
- 恢复后自动重新加入活跃路由池
- 实现网络的自愈能力

#### 5.7.5 MRC对多平面架构的意义

MRC协议是专门为多平面网络设计的传输层协议：
- 单个QP的包可以喷洒到**所有Plane的所有路径**上
- 目标NIC通过**直接内存放置（Direct Memory Placement）**处理乱序到达
- 每个包携带虚拟内存地址信息和远程内存访问密钥
- 接收硬件可以将包直接写入最终内存位置，无需排序

**运维优势**：
- 可以在训练运行期间重启核心交换机而不中断工作负载
- 单个网卡端口故障仅导致带宽部分降低，不会导致整个任务崩溃
- 实现了从"构建避免故障的网络"到"构建在故障中继续训练的网络"的转变

### 5.8 IETF BGP SRv6 Routing Planes草案（标准化进展）

> 来源：IETF draft-hss-bgp-srv6-routing-planes-00（2025年3月）

**标准化方向**：IETF正在标准化基于BGP和SRv6的多平面路由框架：

**核心思想**：
- 在共享物理基础设施上创建多个逻辑路由平面
- 通过三个关键要素定义平面：
  1. **约束条件（Constraints）**：如Fabric颜色包含/排除
  2. **计算类型（Calculation Types）**：如最短路径
  3. **度量类型（Metric Types）**：如成本、延迟、带宽

**与多平面物理架构的关系**：
- 物理多平面：每个Plane是物理独立的Clos Fabric
- 逻辑多平面（SRv6 Routing Planes）：在同一物理Fabric上划分逻辑Plane
- 两者可以结合：物理多平面 + 每个物理Plane内的逻辑子平面

### 5.9 负载均衡算法性能对比（学术研究数据）

> 来源：UC Berkeley论文 "Load Balancing for AI Training Workloads"（arXiv:2507.21372, 2025年7月）

该论文系统性地对比了各种负载均衡算法在AI训练工作负载下的性能：

#### 5.9.1 核心发现

**结论一：逐包喷洒（Packet Spraying）全面优于ECMP**

在All-to-All流量模式下（归一化到理论最优完成时间）：
| 负载均衡方案 | 归一化CCT | 相对最优差距 |
|-------------|-----------|-------------|
| 主机端逐包喷洒 | ~1.22 | +22% |
| 交换机端逐包喷洒 | ~1.22 | +22% |
| 自适应路由（交换机AR） | ~1.20 | +20% |
| Flowlet切换 | ~1.25 | +25% |
| ECMP（传统） | ~1.41 | +41% |

- 逐包喷洒比ECMP好约**20%**
- 主机端喷洒与交换机端喷洒性能相当（无需特殊交换机支持）
- 自适应路由（AR）仅比随机喷洒好2-3%

**结论二：故障场景下逐包喷洒优势更大**

在链路故障场景下（2条链路90%带宽丢失）：
- ECMP性能急剧恶化（被哈希到故障链路的流无法逃脱）
- 自适应ECMP比静态ECMP好77%
- 逐包喷洒在所有故障场景下保持稳定，仅比最优差20-30%

**结论三：大缓冲区进一步放大喷洒优势**

| 工作负载 | 缓冲区 | 逐包喷洒(Host) | 逐包喷洒(Switch) | ECMP |
|---------|--------|---------------|-----------------|------|
| All-to-All | 大(400KB/port) | 1.06 | 1.06 | 1.35 |
| All-to-All | 小(32KB/port) | 1.24 | 1.22 | 1.41 |
| Permutation | 大 | 1.25 | 1.22 | 5.60 |
| Permutation | 小 | 1.30 | 1.31 | 5.25 |

- 大缓冲区下，逐包喷洒接近理论最优（仅差6%）
- ECMP在Permutation流量下性能极差（5.6倍于最优）
- 这为AI集群使用大缓冲区交换机提供了理论依据

**结论四：丢包恢复方案对比**

| 丢包恢复方案 | 适用场景 | 性能 | 实现复杂度 |
|-------------|---------|------|-----------|
| 纠删码（Erasure Coding） | 所有场景 | 最稳定（+5%固定开销） | 高（需硬件支持） |
| TCP dupACK | 高流数场景 | 好 | 低 |
| Packet Trimming | 低流数场景 | 好 | 中（需交换机支持） |
| RoCE PFC+NACK | 有序传输 | 对乱序敏感 | 低 |

- 纠删码在所有场景下表现最稳定，但需要~5%的带宽开销
- TCP在高流数（All-to-All）场景下表现良好（乱序概率低）
- Packet Trimming在低流数场景下优于TCP（显式丢包通知）
- 传统RoCE对乱序极度敏感，不适合逐包喷洒

#### 5.9.2 对多平面路由设计的启示

1. **主机端逐包喷洒是最佳选择**：无需特殊交换机支持，性能与交换机端喷洒相当
2. **AI集群应考虑大缓冲区交换机**：可将喷洒性能提升至接近理论最优
3. **纠删码是理想的丢包恢复方案**：但需要NIC硬件支持（类似加密引擎）
4. **全局负载信息可带来额外25%提升**：当前所有方案都基于本地决策，全局优化是未来方向
5. **Flowlet切换在低流数场景下退化为ECMP**：不适合Permutation流量模式

### 5.10 路由设计总结对比

| 维度 | 双平面（HPN） | 多平面-MPFT（DeepSeek） | 多平面-多端口（OCI） | OpenAI MRC |
|------|--------------|------------------------|---------------------|------------|
| 路由协议 | eBGP per Plane | IB SM per Plane | eBGP per Plane + NIC MRC | SRv6静态路由（无动态协议） |
| 跨Plane路由 | NIC双端口分流 | 节点内转发 | NIC边缘路由（探测+选路） | NIC逐包喷洒到所有Plane |
| 负载均衡 | NIC分流 + ECMP/Flowlet | Plane内LFT + AR | NIC喷洒 + ECMP + ARS | 全路径逐包随机喷洒 |
| 路径选择粒度 | 流级/Flowlet级 | 流级（LFT确定） | 包级（逐包喷洒） | 包级（随机喷洒） |
| 哈希极化解决 | 双Plane + 单层ECMP | 各Plane独立 | 逐包喷洒消除 | 随机喷洒完全消除 |
| 拥塞控制 | DCQCN + PFC | IB信用制流控 + AR | 分层拥塞控制 | Packet Truncation + 速率控制 |
| 故障切换时间 | <100ms (BGP) | SM重算LFT (秒级) | <1ms (NIC硬件) | ~20μs (NIC黑名单) |
| 乱序处理 | 不需要 | 不需要 | NIC硬件重组 | Direct Memory Placement |
| 带宽利用率 | ~80% | ~75% | ~90% | ~96% |
| 控制平面复杂度 | 中 | 中 | 中高 | 极低（静态路由） |
| 交换机要求 | 标准以太网 | IB交换机 | 标准以太网+ARS | 标准以太网（"哑设备"） |

---

## 五-附、控制器与控制平面设计

### 5-附.1 控制平面设计对比

| 维度 | 双平面（HPN） | 多平面-MPFT（DeepSeek） | 多平面-多端口（OCI） |
|------|--------------|------------------------|---------------------|
| 控制器类型 | 分布式，无全局控制器 | 每Plane独立子网管理器 | 每Plane独立控制平面 |
| 故障域 | 单Plane内收敛 | 单Plane内收敛 | 单Plane内收敛，无命运共享 |
| 故障恢复 | 局部ECMP组更新 | Plane内路由重算 | 自动流量转移到健康Plane |
| 升级策略 | 逐Plane升级 | 逐Plane升级 | 不同Plane可运行不同NOS版本 |
| 全局协调 | 不需要 | 不需要 | NIC层面协调，网络层面不需要 |

### 5-附.2 控制器架构详解

#### 阿里云HPN控制器

**架构特点**：分布式控制，无集中式SDN控制器
```
┌─────────────────────────────────────────┐
│ HPN控制平面                              │
├─────────────────────────────────────────┤
│ • 每台交换机独立运行BGP进程              │
│ • Plane内BGP自动发现邻居和路由           │
│ • 无需集中式控制器下发路由表             │
│ • 故障时本地BGP收敛，更新ECMP组          │
├─────────────────────────────────────────┤
│ 管理平面（非实时路由）:                   │
│ • 集中式网管系统负责配置下发             │
│ • 拓扑发现和可视化                       │
│ • 告警收集和关联分析                     │
│ • 固件升级和配置变更                     │
└─────────────────────────────────────────┘
```

#### DeepSeek MPFT控制器（IB Subnet Manager）

**架构特点**：每Plane集中式SM，Plane间完全独立
```
┌─────────────────────────────────────────┐
│ Plane 0 SM (主)  │  Plane 0 SM (备)     │
├─────────────────────────────────────────┤
│ 职责:                                    │
│ • 拓扑发现（周期性SMP扫描）              │
│ • 路由计算（Fat-Tree算法）               │
│ • LFT下发（写入每台交换机）              │
│ • 故障检测和路由重算                     │
│ • QoS策略和分区管理                      │
├─────────────────────────────────────────┤
│ 特点:                                    │
│ • 集中式计算，全局最优路由               │
│ • 故障重算时间较长（秒级）               │
│ • SM故障时备SM接管（主备切换）           │
│ • 8个Plane = 8组独立SM，互不影响         │
└─────────────────────────────────────────┘
```

#### Oracle OCI Acceleron控制器

**架构特点**：Plane内分布式路由 + NIC边缘智能
```
┌─────────────────────────────────────────┐
│ OCI多平面控制架构                        │
├─────────────────────────────────────────┤
│ Plane内控制平面:                         │
│ • 每Plane独立运行BGP                     │
│ • 交换机自主路由决策                     │
│ • 独立故障域，独立收敛                   │
│ • 可运行不同版本NOS                      │
├─────────────────────────────────────────┤
│ NIC边缘控制（跨Plane协调）:              │
│ • NIC固件实现路径探测和选路              │
│ • 主机软件提供策略和配置                 │
│ • 无需集中式跨Plane控制器               │
│ • 每个NIC独立决策，去中心化             │
├─────────────────────────────────────────┤
│ 运维管理平面:                            │
│ • 支持逐Plane滚动升级                   │
│ • 不同Plane可运行不同NOS版本            │
│ • 单Plane维护不影响其他Plane            │
│ • Zero-Trust路由安全策略                │
└─────────────────────────────────────────┘
```

### 5-附.3 控制平面对比总结

| 维度 | 双平面（HPN） | 多平面-MPFT（DeepSeek） | 多平面-多端口（OCI） |
|------|--------------|------------------------|---------------------|
| 控制器类型 | 分布式BGP，无全局控制器 | 每Plane集中式SM | Plane内分布式 + NIC边缘智能 |
| 故障域 | 单Plane内收敛 | 单Plane内收敛 | 单Plane内收敛，无命运共享 |
| 故障恢复 | 局部ECMP组更新(<100ms) | SM重算LFT(秒级) | NIC硬件切换(<1ms) |
| 升级策略 | 逐Plane升级 | 逐Plane升级 | 不同Plane可运行不同NOS版本 |
| 全局协调 | 不需要 | 不需要 | NIC层面协调，网络层面不需要 |
| 路由计算位置 | 每台交换机本地 | SM集中计算 | 交换机本地 + NIC边缘 |
| 可扩展性 | 好（分布式） | 中（SM计算量随规模增长） | 最好（完全去中心化） |

---

## 六、工程实现与物理部署

### 6.1 类型一（多GPU卡多Plane）部署
- 最简单，光纤连接方式与普通CLOS组网基本无区别
- 每个NIC独立连接到对应Plane的Leaf交换机

### 6.2 类型二（单卡多端口多Plane）部署

**情况A：网卡与交换机接口速率匹配**
- 如网卡200G、交换机200G
- 使用合适芯数的光缆直接连接

**情况B：网卡与交换机接口速率不匹配**
- 如网卡200G、交换机800G
- 需要使用**Shuffle Box**或**1分4分支线缆**
- 1分4的一端连接交换机800G高速端口
- 另一端连接**不同GPU卡**的200G端口（注意：不是同一GPU卡的4个端口）

### 6.3 类型三（单网口多光通道多Plane）部署
- 需要使用**Shuffle Box**进行光纤通道映射
- GPU到Shuffle Box：8芯MPO-MPO线缆
- Shuffle Box到各Plane交换机：8芯MPO-MPO线缆

### 6.4 Shuffle Box / Shuffle Cable

**功能**：
- 光纤配线架的特殊设计形式
- 将来自不同GPU的光学通道重新映射到正确的Plane交换机端口
- 解决网卡端口速率与交换机端口速率不匹配的问题

**Oracle的Shuffle Cable设计**：
- 两端都进行breakout的线缆
- NIC端和交换机端都可以fan out
- 减少物理线缆杂乱，最大化连接性
- 支持高效大规模部署和模块化替换

**高密度连接器**：
- 将光纤束更密集地分组
- 需要在多个物理连接器之间进行逻辑通道的洗牌
- 结构化布线系统便于快速故障排除

---

## 七、各厂商方案对比

| 厂商/方案 | 平面数 | 类型 | 规模 | 网络协议 | 关键特性 |
|-----------|--------|------|------|----------|----------|
| 阿里云 HPN 7.0 | 2 | 单卡双端口 | 15K+ GPU | RoCE/Ethernet | 消除哈希极化，两层万卡 |
| DeepSeek-V3 MPFT | 8 | 多卡多Plane | 16,384 GPU | InfiniBand | 节省40%成本，节点内转发 |
| Oracle OCI Zettascale | 4 | 单卡多端口 | 131,072+ GPU | RoCE/Ethernet | 独立控制平面，NIC智能路由 |
| OpenAI Stargate (MRC) | 多Plane | 单卡多端口 | 131,000+ GPU | RoCE+SRv6 | 静态路由，逐包喷洒，96%利用率 |
| NVIDIA CX-8 | 4 | 单卡单口多通道 | - | RoCE/IB | 硬件级乱序处理，QP多路径喷洒 |
| 理想4-Plane方案 | 4 | 单卡4端口 | 16,384 GPU | RoCE | 逐包负载均衡，MoE友好 |

---

## 八、组网模式性能对比（来自DeepSeek论文）

| 指标 | FT2(两层胖树) | MPFT(多平面) | FT3(三层胖树) | SF(Slim Fly) | DF(Dragonfly) |
|------|-------------|-------------|-------------|-------------|---------------|
| 每节点成本 | 低 | 较低 | 高 | 中 | 中 |
| 可扩展性 | 有限 | 好 | 好 | 中 | 中 |
| 网络层数 | 2 | 2 | 3 | 2 | 2-3 |
| 路由复杂度 | 低 | 中 | 高 | 高 | 高 |
| 容错能力 | 低 | 高（多Plane冗余） | 中 | 中 | 中 |

MPFT在每节点成本、扩展性等方面存在明显优势。

---

## 九、发展趋势总结

1. **三层组网变二层组网**：通过多平面设计，用两层Clos实现原来三层才能达到的规模
2. **二层万卡/十万卡**：双平面15K GPU，多平面16K-131K+ GPU
3. **多端口多平面组网**：从单端口单Plane演进到单卡多端口多Plane
4. **NIC智能化**：路由决策从网络设备下沉到NIC（固件+主机软件）
5. **硬件级乱序处理**：CX-8等新一代网卡原生支持多平面通信
6. **Shuffle Box标准化**：成为多平面部署的关键基础设施组件
7. **逐包喷洒替代流级ECMP**：更细粒度的负载均衡，消除elephant flow问题
8. **SRv6静态路由替代动态路由协议**：OpenAI MRC证明"哑交换机+智能NIC"模型可行
9. **容错优先于无损**：从"构建避免故障的网络"转向"构建在故障中继续训练的网络"
10. **纠删码丢包恢复**：学术研究表明纠删码是逐包喷洒场景下最稳定的丢包恢复方案

---

## 十、对AmpCon平台的设计启示

### 10.1 拓扑可视化
- 需要支持按Plane分层展示（Plane视图 vs 全局视图）
- 展示GPU到多Plane的连接关系
- Shuffle Box作为拓扑中的关键节点

### 10.2 健康度评分
- 单Plane降级对整体集群的影响评估（如4-Plane中1个故障 = 25%带宽损失）
- 跨Plane负载均衡健康度
- NIC多端口连接状态监控

### 10.3 告警与故障管理
- 区分单Plane故障 vs 跨Plane故障
- Plane级别的故障域隔离展示
- Shuffle Box连接异常告警

### 10.4 流量监控
- 各Plane的流量分布均衡度
- 逐包喷洒效果监控
- 拥塞热点在Plane维度的分布

---

*参考来源：*
- [西贝吹风 - 智算中心组网中的双平面及多平面](https://mp.weixin.qq.com/s/CHVnVwG6c3WLtJiIVFyaig)（2025.11）
- [西贝吹风 - 再谈智算中心多平面组网](https://mp.weixin.qq.com/s/G_Plt0deN0km4JJgsA0rkA)（2026.2）
- [Oracle - First Principles: Acceleron Multiplanar Networking Architecture](https://blogs.oracle.com/cloud-infrastructure/first-principles-acceleron-multiplanar-networking)（2026.3）
- [Oracle - First Principles: Unlocking Multiplanar Fabric with Multipath Reliable Connection](https://blogs.oracle.com/cloud-infrastructure/first-principles-multipath-reliable-connection)（2026.5）
- [Alibaba HPN: A Data Center Network for LLM Training](https://dl.acm.org/doi/10.1145/3651890.3672265)（SIGCOMM 2024）
- [DeepSeek-V3: Scaling Challenges and Reflections on Hardware for AI Architectures](https://arxiv.org/abs/2505.09343)（2025.5）
- [OpenAI - Supercomputer networking to accelerate large scale AI training](https://openai.com/index/mrc-supercomputer-networking/)（2026.5）
- [Resilient AI Supercomputer Networking using MRC and SRv6](https://arxiv.org/abs/2605.04333)（2026.5）
- [Load Balancing for AI Training Workloads - UC Berkeley](https://arxiv.org/abs/2507.21372)（2025.7）
- [IETF draft-hss-bgp-srv6-routing-planes-00](https://www.ietf.org/archive/id/draft-hss-bgp-srv6-routing-planes-00.html)（2025.3）
- [Broadcom Tomahawk 6 - 102.4T AI Data Center Switch](https://www.crn.com/news/components-peripherals/2025/broadcom-tomahawk-6-switch-is-a-turning-point-for-ai-data-centers)（2025）

*Content was rephrased for compliance with licensing restrictions.*
