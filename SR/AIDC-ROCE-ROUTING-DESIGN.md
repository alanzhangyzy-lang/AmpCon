# AIDC RoCE 网络路由设计方案

> **文档版本**：v1.0  
> **日期**：2026-06-12  
> **范围**：AIDC智算中心 RoCE 网络路由架构设计  
> **目标读者**：网络架构师、解决方案架构师、产品经理

---

## 1. 概述与设计目标

### 1.1 背景

AI 数据中心（AIDC）的 GPU 集群互联以 RoCE（RDMA over Converged Ethernet）为主流传输协议。随着大模型训练规模从千卡扩展到十万卡级别，传统数据中心的路由设计已无法满足 AI 训练网络对**零丢包、低延迟、高带宽利用率**的极端要求。

RoCE 网络路由设计的核心矛盾在于：
- **流量特征**：AllReduce/All-to-All 集合通信产生大量同步突发（Incast）和低熵长流（Elephant Flow）
- **无损要求**：任何丢包都触发重传，严重影响训练效率
- **规模压力**：万卡/十万卡集群要求极低的跨节点延迟（<10μs 同 Pod）

### 1.2 设计目标

| 目标 | 指标 |
|------|------|
| 零丢包 | PFC 触发率 <0.1%，无 PFC Storm |
| 低延迟 | 同 Pod GPU-to-GPU 延迟 <5μs，跨 Pod <10μs |
| 高带宽利用率 | 链路利用率 >90%，有效带宽 >85% |
| 快速收敛 | 故障恢复 <100ms（传统路由），<1ms（多路径喷洒） |
| 可扩展性 | 支持 10,000—131,000+ GPU 规模 |
| 运维简洁 | 最小化控制平面复杂度 |

---

## 2. 网络分层架构

### 2.1 AIDC 三网分离

```
┌─────────────────────────────────────────────────────────────────┐
│                    AIDC 数据中心网络分层                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 前端网络 (Frontend Network)                              │    │
│  │  • 用途：用户接入、管理、数据集加载                        │    │
│  │  • 协议：传统 Ethernet + EVPN/VXLAN Overlay              │    │
│  │  • 带宽：100/200GbE，允许超额订阅                         │    │
│  │  • 路由：标准 eBGP + EVPN                                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 后端网络 (Backend Network) — GPU 互联 ★核心★             │    │
│  │  • 用途：GPU-to-GPU 集合通信 (AllReduce/All-to-All)      │    │
│  │  • 协议：RoCEv2，无损传输                                 │    │
│  │  • 带宽：400/800GbE，1:1 无超额订阅                      │    │
│  │  • 架构：双平面/多平面 Clos                               │    │
│  │  • 路由：纯 L3 / EVPN-VXLAN（视场景选择）                │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 存储网络 (Storage Network)                               │    │
│  │  • 用途：数据集读取、Checkpoint 写入                      │    │
│  │  • 协议：RoCE 或 TCP                                     │    │
│  │  • 可独立部署或与前端融合                                  │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 后端网络拓扑选型

| 拓扑类型 | 适用规模 | 网络层数 | 代表方案 |
|---------|---------|---------|---------|
| 单平面 Spine-Leaf | <4,000 GPU | 2 层 | 传统 CLOS |
| 双平面 Spine-Leaf | 4,000–15,000 GPU | 2 层 | 阿里云 HPN 7.0 |
| 多平面 (4-Plane) | 15,000–131,000+ GPU | 2 层 | Oracle OCI Acceleron |
| MPFT (8-Plane) | 16,000+ GPU | 2 层 | DeepSeek-V3 |

---

## 3. Underlay 路由协议设计

### 3.1 协议选择：eBGP Unnumbered

GPU 后端网络主流采用 **eBGP Unnumbered** 作为 Underlay 路由协议。

**为什么选择 eBGP Unnumbered：**

| 维度 | eBGP Unnumbered | OSPF/IS-IS | 静态路由 |
|------|----------------|------------|---------|
| 邻居发现 | IPv6 Link-Local 自动发现 | 自动发现 | 手动配置 |
| 大规模部署 | 无需规划邻居 IP | 区域设计复杂 | 不可行 |
| AS 隔离 | 每设备独立 AS，天然隔离 | 单一 IGP 域 | 无 |
| 故障域 | 小（单链路/单设备） | 大（同 Area 全扩散） | 无收敛 |
| ECMP 支持 | 原生多路径 | 原生多路径 | 手动配置 |
| 运维复杂度 | 低（模板化配置） | 中 | 高 |

### 3.2 BGP AS 编号规划

#### 3.2.1 单平面 AS 设计

```
┌─────────────────────────────────────────────────────┐
│ Spine 层 (每台 Spine 独立 AS)                        │
│   Spine-1: AS 65001                                  │
│   Spine-2: AS 65002                                  │
│   ...                                                │
│   Spine-N: AS 65xxx                                  │
├─────────────────────────────────────────────────────┤
│              ↕ eBGP (IPv6 Link-Local)                │
├─────────────────────────────────────────────────────┤
│ Leaf 层 (每台 Leaf 独立 AS)                          │
│   Leaf-1: AS 64001 ← GPU Server 1                   │
│   Leaf-2: AS 64002 ← GPU Server 2                   │
│   ...                                                │
│   Leaf-M: AS 64xxx ← GPU Server M                   │
└─────────────────────────────────────────────────────┘
```

#### 3.2.2 多平面 AS 设计（每 Plane 独立 AS 空间）

```
Plane A:                           Plane B:
  Spine-A1: AS 65001                 Spine-B1: AS 65101
  Spine-A2: AS 65002                 Spine-B2: AS 65102
  ...                                ...
  Leaf-A1:  AS 64001                 Leaf-B1:  AS 64101
  Leaf-A2:  AS 64002                 Leaf-B2:  AS 64102
  ...                                ...

Plane C:                           Plane D:
  Spine-C1: AS 65201                 Spine-D1: AS 65301
  Spine-C2: AS 65202                 Spine-D2: AS 65302
  ...                                ...
  Leaf-C1:  AS 64201                 Leaf-D1:  AS 64301
  Leaf-C2:  AS 64202                 Leaf-D2:  AS 64302
```

**设计原则：**
- 每个 Plane 的 AS 号互不重叠
- 路由信息不跨 Plane 传播
- 各 Plane 故障域完全独立

### 3.3 IP 地址规划

#### 3.3.1 Loopback 地址（设备标识 + VTEP）

| 设备类型 | IP 范围 | 掩码 | 用途 |
|---------|---------|------|------|
| Spine（Plane A） | 10.1.0.0/24 | /32 | Router-ID / VTEP |
| Spine（Plane B） | 10.2.0.0/24 | /32 | Router-ID / VTEP |
| Leaf（Plane A） | 10.1.1.0/24 | /32 | Router-ID / VTEP |
| Leaf（Plane B） | 10.2.1.0/24 | /32 | Router-ID / VTEP |
| GPU Server（Plane A） | 10.1.10.0/16 | /32 | RoCE 端点 |
| GPU Server（Plane B） | 10.2.10.0/16 | /32 | RoCE 端点 |

#### 3.3.2 P2P 链路地址

- Leaf-Spine 互联：使用 /31 子网（IPv4）或 /127（IPv6）
- 也可使用 **IPv6 Link-Local Unnumbered**，无需分配 P2P 地址
- 推荐：大规模部署使用 Unnumbered，减少地址规划开销

#### 3.3.3 GPU Server 接入地址

```
GPU Server 接入方式:

方式A - 纯L3接入 (推荐):
  Server → /31 P2P 链路 → Leaf
  每条链路分配独立 /31，路由精确

方式B - L2 VLAN接入:
  Server → Access VLAN → Leaf (SVI)
  适用于需要二层扩展的场景
```

### 3.4 BGP 配置要点

#### 3.4.1 BFD 快速故障检测

```
配置参数:
  BFD Interval:     100ms (TX/RX)
  BFD Multiplier:   3
  故障检测时间:      300ms (3 × 100ms)

优化方案 (大规模集群):
  BFD Interval:     50ms
  BFD Multiplier:   3
  故障检测时间:      150ms
```

#### 3.4.2 路由策略

```
Leaf BGP策略:
  • 向 Spine 通告: 本机 Loopback + 下挂 GPU Server 路由
  • 从 Spine 接收: 默认路由 或 全量路由
  • ECMP: 启用 multipath，所有 Spine 为等价下一跳

Spine BGP策略:
  • 向 Leaf 通告: 聚合路由 或 全量路由
  • 从 Leaf 接收: Leaf Loopback + GPU Server 路由
  • 路由过滤: 防止 Leaf 间水平传递路由
```

#### 3.4.3 ECMP 配置

```
ECMP 关键参数:
  • Maximum Paths:    等于 Spine 数量（通常 32/64）
  • Hash Algorithm:   五元组哈希 (Src IP, Dst IP, Protocol, Src Port, Dst Port)
  • Resilient Hashing: 启用（链路故障时只重哈希受影响的流）
  • Hash Seed:        全网统一或分层差异化
```

---

## 4. Overlay 路由设计（多租户场景）

### 4.1 适用场景判断

```
┌─────────────────────┐
│ 是否需要多租户隔离？  │
└─────────┬───────────┘
          │
    ┌─────┼─────┐
    │ 否        │ 是
    ▼           ▼
┌─────────┐  ┌──────────────────────┐
│ 纯L3     │  │ EVPN/VXLAN Overlay   │
│ Underlay │  │ (选择Pure RT5模型)    │
│ (无需    │  │                      │
│ Overlay) │  │ VRF per Tenant       │
└─────────┘  │ VNI per Tenant       │
             │ BGP EVPN控制面        │
             └──────────────────────┘
```

### 4.2 Pure Type 5 EVPN/VXLAN（推荐多租户方案）

**为什么选择 Pure Type 5 而非 VLAN-Aware 模型：**

| 维度 | Pure Type 5 EVPN | VLAN-Aware EVPN |
|------|------------------|-----------------|
| 服务类型 | 纯 L3（IP-VRF） | L2+L3（MAC-VRF + IP-VRF） |
| VNI 分配 | 每租户 1 个 VNI | 每租户 8 个 VNI（每 GPU 链路一个） |
| MAC 学习 | 无 | 有（增加控制面开销） |
| 复杂度 | 低 | 高 |
| 拥塞控制 | DCQCN 直接工作 | 需要 VXLAN-aware DCQCN |
| 推荐度 | ★★★★★ | ★★★ |

#### 4.2.1 租户 VRF 设计

| 租户 | VRF | L3VNI | IP 网段 | GPU 分配 |
|------|-----|-------|---------|---------|
| Tenant-A | VRF-A | 10001 | 172.16.0.0/16 | Server 1-10, GPU 0-79 |
| Tenant-B | VRF-B | 10002 | 172.17.0.0/16 | Server 11-20, GPU 80-159 |
| Tenant-C | VRF-C | 10003 | 172.18.0.0/16 | Server 21-50, GPU 160-399 |

#### 4.2.2 BGP EVPN 路由类型

```
RoCE 多租户场景使用的 EVPN Route Types:

RT5 (IP Prefix Route):
  • 通告租户 GPU 的 /32 主机路由
  • 携带 VRF RT (Route Target) 实现租户隔离
  • 确保不同租户路由不互通

RT2 (MAC-IP Route):  [可选]
  • 仅在需要 L2 扩展时使用
  • 大规模训练场景通常不需要
```

#### 4.2.3 VXLAN QoS 穿透

```
VXLAN 封装对 RoCE QoS 的影响:

原始 RoCE 包:
  [Eth Header][IP Header(DSCP=26)][UDP][BTH][Payload]

VXLAN 封装后:
  [Outer Eth][Outer IP(DSCP=?)][Outer UDP][VXLAN][Original Packet]

关键配置:
  • 内层 DSCP → 外层 DSCP: 必须 copy（不是 remark）
  • 交换机 ECN 标记: 需要识别外层 IP 并在内层标记
  • PFC 优先级: 基于外层 DSCP 映射到正确 CoS 队列
```

---

## 5. 负载均衡设计

### 5.1 负载均衡层次架构

```
┌─────────────────────────────────────────────────────────────┐
│            AIDC RoCE 网络多级负载均衡架构                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  第一级: NIC 端口级分流 (跨 Plane)                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ GPU → NIC (多端口)                                    │   │
│  │   ├── Port 0 → Plane 0                               │   │
│  │   ├── Port 1 → Plane 1                               │   │
│  │   ├── Port 2 → Plane 2                               │   │
│  │   └── Port 3 → Plane 3                               │   │
│  │ 分流策略: 逐包 Round-Robin / QP 哈希 / 拥塞感知       │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  第二级: 交换机 ECMP / ARS (Plane 内)                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Leaf → ECMP → Spine-1 / Spine-2 / ... / Spine-N      │   │
│  │ 策略: 五元组哈希 + Flowlet + ARS 自适应               │   │
│  └──────────────────────────────────────────────────────┘   │
│                          ↓                                   │
│  第三级: Spine → 目的 Leaf (确定性转发)                      │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ Spine 到目的 Leaf 路径唯一（两层 Clos）               │   │
│  │ 无需额外负载均衡决策                                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 负载均衡算法对比

| 算法 | 分流粒度 | 乱序风险 | 负载均衡效果 | 硬件要求 | 适用场景 |
|------|---------|---------|------------|---------|---------|
| 传统 ECMP | 流（五元组哈希） | 无 | 差（Elephant Flow 问题） | 无特殊要求 | 通用 DC |
| Flowlet Switching | 流片段（idle gap） | 极低 | 中等 | Flowlet 检测 | AllReduce |
| ARS 自适应路由 | 流/Flowlet | 低 | 较好 | 交换机芯片支持 | AI 训练 |
| 逐包喷洒 | 单个数据包 | 高 | 最优 | NIC 乱序重组 | MoE All-to-All |

**学术研究数据（UC Berkeley 2025）：**
- 逐包喷洒比传统 ECMP 好 **~20%**（归一化集合通信完成时间）
- 在链路故障场景下，逐包喷洒优势更大（ECMP 性能急剧恶化）
- 大缓冲区 + 逐包喷洒可将 All-to-All 性能逼近理论最优

### 5.3 Flowlet Switching 配置

```
Flowlet 关键参数:

  Flowlet 间隔阈值: 50–200μs
    • 过小: 退化为逐包喷洒，乱序风险增加
    • 过大: 退化为 per-flow ECMP，负载均衡效果差
    • 推荐: 根据 AllReduce chunk 间隔调优，通常 100μs

  检测机制:
    • 交换机为每条流维护最后一个包的时间戳
    • 新到达的包与该时间戳的差值 > 阈值 → 新 Flowlet
    • 新 Flowlet 可重新哈希到不同出端口

  调优建议:
    • AllReduce (Ring): 间隔阈值 = 100–150μs
    • All-to-All (MoE): 间隔阈值 = 50–80μs（更激进）
```

### 5.4 ARS 自适应路由

```
ARS (Adaptive Routing and Switching) 工作原理:

  交换机维护每个出端口的:
    • 队列深度（实时监测）
    • 链路利用率
    • 拥塞标志位

  路由决策:
    1. 数据包到达交换机
    2. 查询 ECMP 组中所有候选出端口的拥塞状态
    3. 选择队列深度最浅/利用率最低的端口转发
    4. 如果所有端口拥塞程度相当 → 回退到哈希选择

  芯片支持:
    • Broadcom Tomahawk 5: 支持 ARS
    • Broadcom Jericho3-AI: 支持 ARS + VOQ
    • NVIDIA Spectrum-4: 逐包自适应路由（更激进）
    • Barefoot Tofino: 可编程 ARS 逻辑

  性能提升:
    • 比静态 ECMP 尾延迟降低 30–50%
    • 在 Incast 场景下效果最显著
```

### 5.5 逐包喷洒（Per-Packet Spraying）

**适用于 4-Plane 多平面架构 + CX-8 NIC：**

```
发送端 CX-8 NIC (Multi-Path QP):
  QP 发送队列 → 逐包 Round-Robin 到 4 个 Port
    ├── Packet 1 → Port 0 → Plane 0
    ├── Packet 2 → Port 1 → Plane 1
    ├── Packet 3 → Port 2 → Plane 2
    ├── Packet 4 → Port 3 → Plane 3
    ├── Packet 5 → Port 0 → Plane 0
    └── ...

接收端 CX-8 NIC:
  4 个 Port 接收 → 硬件乱序重组引擎 → 按 PSN 重排 → 交付上层
    • 重组窗口: 数千个 outstanding packets
    • 硬件完成，无 CPU 开销
    • 对 NCCL/应用层透明

总可用路径数 (4-Plane × 8 ECMP/Plane):
  = 32 条独立路径
  任一路径拥塞 → 仅影响 ~3% 的包
```

---

## 6. 拥塞控制设计

### 6.1 拥塞控制协议栈

```
┌─────────────────────────────────────────────────────────────┐
│                AIDC RoCE 拥塞控制分层                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1 - 跨 Plane 拥塞均衡 (NIC 层)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • NIC 探测各 Plane 拥塞状态                            │   │
│  │ • 动态调整 Plane 间流量分配权重                         │   │
│  │ • 避免向已拥塞 Plane 发送流量                          │   │
│  │ • 反应时间: <1ms                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Layer 2 - Plane 内端到端拥塞控制 (DCQCN)                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • 交换机 ECN 标记 (队列超阈值时)                       │   │
│  │ • 接收端发送 CNP (Congestion Notification Packet)     │   │
│  │ • 发送端根据 CNP 频率降低发送速率                      │   │
│  │ • 反应时间: ~RTT (数十 μs)                            │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Layer 3 - PFC 反压 (最后防线)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │ • PFC PAUSE 帧逐跳反压                                │   │
│  │ • 防止缓冲区溢出导致丢包                               │   │
│  │ • PFC Watchdog: 检测 PFC Storm 并自动恢复             │   │
│  │ • 反应时间: ~数 μs（物理层级别）                       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 ECN 阈值设计

```
ECN 标记阈值规划:

         缓冲区使用率
  0%    ├────────────────────────────────────── 100%
        │                    │           │
        │   正常工作区域     │  ECN 标记  │  PFC 触发
        │                    │   区域     │   区域
        │                    │           │
        └────────────────────┴───────────┴──────
                            30%         70%

关键阈值:
  • ECN 起始标记阈值:  缓冲区 30% (开始概率性标记)
  • ECN 最大标记阈值:  缓冲区 60% (100% 标记)
  • PFC 触发阈值:      缓冲区 70% (发送 PAUSE)
  • PFC 恢复阈值:      缓冲区 50% (恢复传输)

设计原则:
  • ECN 阈值 << PFC 阈值 (确保 DCQCN 先于 PFC 生效)
  • ECN 阈值越低 → DCQCN 越敏感 → 丢包风险越小 → 吞吐可能下降
  • 需要根据实际流量模型调优
```

### 6.3 DCQCN 参数调优

```
DCQCN 关键参数:

发送端参数:
  • 初始速率 (Rate): 线速
  • Alpha (α):      速率恢复增量因子，典型 1/256
  • Beta (β):       速率降低因子，典型 0.5
  • Rate Recovery Timer: 速率恢复间隔，典型 10–50μs
  • AI Timer:       加性增速定时器
  • HAI Timer:      超加性增速定时器

交换机端参数:
  • ECN 标记模式:   WRED (加权随机早期检测)
  • 最小阈值:       队列深度 30%
  • 最大阈值:       队列深度 60%
  • 标记概率:       线性从 0% 增长到 100%

AllReduce 优化建议:
  • Incast 场景频繁 → 降低 ECN 起始阈值 (如 20%)
  • 训练效率优先 → 适当增大 Rate Recovery Timer
  • 大 chunk AllReduce → 增大 α (更快恢复)
```

### 6.4 PFC 设计与防护

```
PFC 配置要点:

优先级映射:
  • Priority 3 (DSCP 26/CoS 3): RoCE 数据流量 — 启用 PFC
  • Priority 6 (DSCP 48/CoS 6): CNP 拥塞通知包 — 不启用 PFC
  • 其他优先级: 非 RoCE 流量 — 不启用 PFC

PFC Watchdog:
  • 检测 PFC Storm (持续 PAUSE 超时)
  • 超时时间: 100–500ms
  • 动作: 自动关闭异常端口的 PFC
  • 恢复: 定时自动恢复或手动干预

PFC Deadlock 预防:
  • 无损路由设计确保无环路
  • 使用 "lossless + lossy" 混合模式
  • Buffer 预留足够容纳线速突发 + PFC 反压延迟
```

---

## 7. 故障场景与路由收敛

### 7.1 故障类型与影响

| 故障类型 | 检测时间 | 收敛时间 | 影响范围 | 带宽损失 |
|---------|---------|---------|---------|---------|
| 单链路 Down | BFD <150ms | <200ms | 单 ECMP 路径 | 1/N (N=Spine数) |
| 单 Leaf Down | BFD <150ms | <200ms | 该 Leaf 下 GPU（另一 Plane 接管） | 50%（双平面） |
| 单 Spine Down | BFD <150ms | <200ms | Plane 内带宽等比下降 | 1/N |
| 单 Plane 全Down | 多 BFD 超时 | <500ms | 该 Plane 所有流量 | 按 Plane 比例 |
| NIC 单端口故障 | NIC 硬件检测 | <1ms | 单 GPU 单 Plane | 25%（4-Plane） |

### 7.2 Resilient Hashing（弹性哈希）

```
传统 ECMP 故障行为:
  • 链路故障 → ECMP 组成员变化 → 所有流重新哈希
  • 大量流被迁移到其他链路 → 造成瞬时微突发
  • 可能触发 PFC / 丢包

Resilient Hashing 优化:
  • 链路故障 → 仅重新分配原本映射到故障链路的流
  • 其他流保持在原路径上不动
  • 最小化流量扰动
  • 所有主流交换机芯片均支持
```

### 7.3 多平面场景的故障恢复

```
双平面故障恢复流程:

T=0ms:     Plane A 内某 Spine 链路故障
T=50ms:    BFD 检测到链路 Down
T=100ms:   BGP 撤销故障路径，更新 ECMP 组
T=150ms:   Plane A 内流量重均衡到剩余路径
影响:       Plane B 完全不受影响

4-Plane + 逐包喷洒 (MRC 模式):
T=0μs:     Plane 2 内某路径故障
T=10μs:    NIC 检测到该路径包未 ACK
T=20μs:    NIC 将该路径加入黑名单
T=30μs:    后续包自动避开故障路径
影响:       仅损失 ~3% 带宽（1/32 路径）
恢复:       NIC 持续探测，路径恢复后自动启用
```

---

## 8. 先进路由方案对比

### 8.1 方案对比总览

| 维度 | eBGP + ECMP | eBGP + ARS | SRv6 静态路由 (MRC) | IB SM |
|------|-------------|------------|-------------------|--------|
| 控制平面 | 动态（BGP） | 动态（BGP） | 无（NIC 定义路径） | 集中式 SM |
| 路由计算 | 交换机分布式 | 交换机分布式 | 发送端 NIC | SM 集中计算 |
| 负载均衡 | 五元组哈希 | 拥塞感知动态 | 逐包喷洒 | Fat-Tree + AR |
| 故障收敛 | 100–500ms | 100–500ms | <1ms (NIC 级) | 秒级（SM 重算） |
| 复杂度 | 低 | 中 | 低（交换机侧） | 高 |
| 规模 | 万卡 | 万卡 | 十万卡+ | 万卡 |
| 代表用户 | 通用 | Arista/Broadcom | OpenAI | DeepSeek |

### 8.2 OpenAI MRC + SRv6 方案详解

MRC 代表了 AI 网络路由设计的范式转变：

```
设计理念对比:

传统 RoCE 路由:
  "消除故障 → 保证无丢包 → 单路径传输"

MRC 路由:
  "假设故障不可避免 → 容忍丢包 → 多路径喷洒 → 快速重传"
```

**SRv6 源路由转发：**
```
发送端 NIC 构造数据包:
┌─────────────────────────────────────────────┐
│ IPv6 Header                                  │
│ SRv6 Segment Routing Header:                 │
│   Segment[0] = 目的 Leaf SID                 │
│   Segment[1] = 中间 Spine SID               │
│   Segment[2] = 源 Leaf SID                  │
│ RoCE Payload                                 │
└─────────────────────────────────────────────┘

交换机处理 (极度简化):
  1. 读取当前活跃 Segment
  2. 按 Segment 转发到下一跳
  3. 递减 Segment Left 指针
  4. 无路由表查询、无 ECMP 哈希计算
```

**MRC 关键优势：**
- 交换机作为"哑设备"，只转发不决策
- 无动态路由协议 → 无收敛延迟
- 带宽利用率 ~96%（传统 RoCE ~65%）
- 可在训练运行期间重启核心交换机

---

## 9. 拓扑感知路由优化

### 9.1 NCCL 拓扑感知

```
集合通信库 (NCCL) 与物理拓扑对齐:

AllReduce (Ring 算法):
  • Ring 中相邻节点尽量安排在同一 Plane 内
  • 减少跨 Plane 通信
  • Plane 内通信延迟更低、带宽更确定

  优化前: GPU-0(P0) → GPU-1(P1) → GPU-2(P2) → GPU-3(P3)
                     ↑ 跨Plane ↑ 跨Plane ↑ 跨Plane
  优化后: GPU-0(P0) → GPU-4(P0) → GPU-8(P0) → GPU-12(P0)
                     ↑ 同Plane  ↑ 同Plane  ↑ 同Plane

All-to-All (MoE):
  • 天然产生全网状流量矩阵
  • 适合逐包喷洒到所有 Plane
  • 4-Plane 逐包喷洒可将带宽提升接近 4 倍
```

### 9.2 Job Placement 与路由协同

```
训练任务放置策略:

策略1 - Locality-First (延迟优先):
  • 优先将同一训练任务的 GPU 放在同一 Leaf 下
  • 最大化本地通信 (只经过一级交换)
  • 适合对延迟敏感的小规模任务

策略2 - Spread (带宽优先):
  • 将训练任务 GPU 分散到多个 Leaf
  • 利用 Spine 层聚合带宽
  • 适合带宽密集型大规模训练

策略3 - Plane-Aware (多平面感知):
  • 确保同一并行组的 GPU 在同一 Plane 有直连路径
  • 减少跨 Plane 通信开销
  • 适合 MPFT 架构
```

---

## 10. 方案推荐与选型指引

### 10.1 按规模选型

| 集群规模 | 推荐拓扑 | 推荐路由方案 | 负载均衡 | Overlay |
|---------|---------|------------|---------|---------|
| <4,000 GPU | 单平面 Spine-Leaf | eBGP + ECMP | Flowlet | 可选 |
| 4,000–15,000 GPU | 双平面 | eBGP + ARS | ARS + NIC 分流 | 按需 |
| 15,000–50,000 GPU | 4-Plane | eBGP + ARS / SRv6 | 逐包喷洒 | 通常不需要 |
| 50,000–131,000+ GPU | 4-Plane + MRC | SRv6 静态 | Multi-Path QP | 不需要 |

### 10.2 按场景选型

| 场景 | 路由方案 | 关键特征 |
|------|---------|---------|
| 专用训练集群（单租户） | 纯 L3 + eBGP | 最低延迟、最简运维 |
| GPUaaS 多租户 | EVPN/VXLAN + eBGP | VRF 隔离、策略灵活 |
| 超大规模训练 (>50K GPU) | SRv6 + MRC | 极致带宽利用率、微秒级恢复 |
| 混合负载 (AI + 传统) | EVPN/VXLAN + ACI/NDFC | 策略精细、合规友好 |

### 10.3 交换机芯片与路由能力对应

| 芯片平台 | ARS 自适应路由 | 逐包喷洒 | VOQ | Deep Buffer | SRv6 |
|---------|--------------|---------|-----|-------------|------|
| Broadcom TH5 (51.2T) | ✅ | 需 NIC 配合 | ❌ | ❌ | ✅ |
| Broadcom Jericho3-AI | ✅ | 需 NIC 配合 | ✅ | ✅ (GB 级) | ✅ |
| NVIDIA Spectrum-4 | ✅ (逐包 AR) | ✅ (交换机级) | ❌ | ❌ | ✅ |
| Intel/Barefoot Tofino | 可编程 | 可编程 | ❌ | ❌ | ✅ |

---

## 11. 配置示例（参考）

### 11.1 eBGP Unnumbered Leaf 配置骨架

```
! === Leaf Switch (AS 64001) ===

! 接口配置
interface Ethernet1/1-48     ! 下行 - GPU Server 接入
  mtu 9216
  ip address 点对点 /31
  no shutdown

interface Ethernet1/49-64    ! 上行 - 连接 Spine
  mtu 9216
  ipv6 enable
  no shutdown

interface Loopback0
  ip address 10.1.1.1/32

! BGP 配置
router bgp 64001
  router-id 10.1.1.1
  bestpath as-path multipath-relax
  maximum-paths 16               ! = Spine 数量

  ! 上行 Spine 邻居 (Unnumbered)
  neighbor SPINE peer-group
  neighbor SPINE remote-as external
  neighbor SPINE bfd
  neighbor Ethernet1/49 peer-group SPINE
  neighbor Ethernet1/50 peer-group SPINE
  ...

  ! 下行 GPU Server 路由通告
  address-family ipv4 unicast
    network 10.1.1.1/32          ! Loopback
    redistribute connected       ! GPU Server /31 链路

! BFD 配置
bfd interval 100 min-rx 100 multiplier 3

! ECMP + Resilient Hashing
ip ecmp load-balance resilient
```

### 11.2 QoS + 无损配置骨架

```
! === RoCE 无损 QoS ===

! DSCP → Queue 映射
class-map type qos match-all ROCE_DATA
  match dscp 26

class-map type qos match-all ROCE_CNP
  match dscp 48

! 队列策略
policy-map type queuing ROCE_QUEUING
  class ROCE_DATA
    priority-group 3
    bandwidth percent 80
    pfc on
  class ROCE_CNP
    priority-group 6
    bandwidth percent 5
    pfc off

! ECN 标记
policy-map type qos ROCE_ECN
  class ROCE_DATA
    random-detect ecn
    random-detect minimum-threshold 150 kbytes
    random-detect maximum-threshold 400 kbytes

! PFC Watchdog
pfc watchdog timeout 200
pfc watchdog action drop
```

---

## 12. 总结

### 12.1 AIDC RoCE 路由设计核心原则

1. **纯 L3 为主**：GPU 后端网络优先采用纯 L3 Underlay，避免不必要的 Overlay 开销
2. **多平面分散**：通过双平面/多平面架构将流量分散到独立故障域
3. **多级负载均衡**：NIC 跨 Plane 分流 + Plane 内 ECMP/ARS + 可选逐包喷洒
4. **DCQCN 先于 PFC**：ECN 阈值低于 PFC 阈值，确保软着陆优先于硬刹车
5. **故障域最小化**：每 Plane 独立控制面，故障不跨 Plane 传播
6. **路由决策前移**：趋势是将智能路由决策从交换机移到 NIC 端（MRC/OCI 模式）

### 12.2 技术演进路线

```
2023-2024:  eBGP + ECMP + Flowlet (双平面)
              ↓
2025:       eBGP + ARS + NIC 分流 (4-Plane)
              ↓
2026+:      SRv6 + MRC + 逐包喷洒 (Multi-Plane, 十万卡+)
```

---

## 参考资料

1. Meta RoCE 网络论文 — https://engineering.fb.com/2024/08/05/data-center-engineering/roce-network-distributed-ai-training-at-scale/
2. 阿里云 HPN 7.0 (SIGCOMM 2024) — 双端口双平面架构
3. Oracle OCI Acceleron — 4-Plane + NIC 边缘路由
4. OpenAI MRC 协议 (arXiv:2605.04333) — SRv6 + 多路径喷洒
5. DeepSeek-V3 (arXiv:2505.09343) — MPFT 8 平面 IB 网络
6. UC Berkeley 负载均衡研究 (arXiv:2507.21372) — 逐包喷洒性能对比
7. IETF draft-hss-bgp-srv6-routing-planes-00 — BGP SRv6 多平面标准化
8. Juniper JVD — EVPN/VXLAN 多租户 AI Fabric 设计

> *本文档基于公开技术资料整理，内容已改写以符合内容许可合规要求。*
