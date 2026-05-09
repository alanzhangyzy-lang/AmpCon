# 友商网络健康度评分方案深度调研报告

| 项目 | 内容 |
|------|------|
| 文档编号 | SR-AMPCON-VENDOR-HEALTH-001 |
| 版本 | v1.0 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-05-06 |

---

## 1. 调研背景与目标

### 1.1 背景

AmpCon 融合控制器管理三种网络场景（数据中心、园区、光传输），需要为每个 Site 提供 0-100 的健康度评分来反映网络整体运行状态。本报告深度调研业内主流厂商（Arista、Cisco、Juniper、华为、华三）在各场景的健康分数实现方案。

### 1.2 目标

输出两套方案：
- **方案 A（通用基础方案）**：适用于三个场景的基础实现，快速交付 MVP
- **方案 B（演进专业方案）**：深入对应业务场景，满足业内最新方案设计

### 1.3 调研范围

| 厂商 | 数据中心 | 园区网络 | 光传输 |
|------|----------|----------|--------|
| Arista | ✅ CloudVision + CUE | ✅ CloudVision CUE | ❌ 不涉及 |
| Cisco | ✅ Catalyst Center | ✅ Catalyst Center | ❌ 不涉及 |
| Juniper | ✅ Data Center Assurance | ✅ Mist AI | ❌ 不涉及 |
| 华为 | ✅ iMaster NCE-FabricInsight | ✅ iMaster NCE-CampusInsight | ✅ iMaster NCE-T |
| 华三 | ✅ SeerAnalyzer-DC / AD-DC | ✅ SeerAnalyzer-Campus / AD-Campus | ❌ 不涉及 |

---

## 2. 厂商方案详细分析

### 2.1 Arista CloudVision + CUE

#### 2.1.1 数据中心场景

**产品定位**：CloudVision 是多域网络管理平台，CUE（CloudVision Unified Edge）为园区/边缘场景提供服务。

**健康度模型**：**合规性驱动 + SLA Dashboard 双模式**

##### 模式一：合规性检查模型（传统 DC）

| 检查维度 | 检查内容 | 权重 |
|----------|----------|------|
| 配置合规 | 设备运行配置与设计配置的一致性（Config Diff） | 30% |
| 镜像合规 | 设备 EOS 版本是否符合目标版本 | 20% |
| 设备状态 | CPU/内存/温度/电源/风扇状态 | 20% |
| 接口状态 | 端口 Up/Down、错误计数器、CRC | 15% |
| BGP/OSPF 邻居状态 | 协议会话是否 Established | 10% |
| MLAG 状态 | 双活链路聚合健康 | 5% |

**计算公式**：
```
健康度 = Pass 项数 / 总检查项数 × 100%
```

##### 模式二：SLA Dashboard 模型

Arista CUE 的 SLA Dashboard 提供网络、设备、应用三个维度的健康百分比：

| 维度 | 指标 | 阈值默认值 |
|------|------|-----------|
| 网络健康 | 整体网络连通性 | Green ≥ 98.5% |
| 设备健康 | 设备在线率、资源利用率 | Orange ≥ 80% |
| 应用健康 | 应用可达性、响应时间 | Red < 80% |

**阈值模式**：
- 支持静态阈值配置
- 支持动态基线（基于历史数据自动计算）

##### 特色能力

1. **动态基线（CV-CUE Baselines）**：
   - 每 15 分钟自动计算基线
   - 基于 mean + 2σ 的异常检测
   - 消除静态阈值的误报/漏报

2. **FEED 异常监控**：
   - 持续监控网络异常
   - 自动分析异常原因
   - 提供动态修复建议

3. **AQL 高级查询语言**：
   - 通过 AQL 查询设备健康状态
   - 支持电源、风扇、温度、CPU、内存、磁盘等细粒度监控
   - 支持 TCAM 容量、转发表容量等硬件资源监控

#### 2.1.2 园区场景

**Infrastructure Dashboard** 提供 AP 健康监控：

| 指标 | 阈值 | 说明 |
|------|------|------|
| AP CPU 利用率 | 80% | AP 健康度核心指标 |
| AP 内存利用率 | 80% | 内存健康检查 |
| Crash/Reboot 计数 | 24h 内统计 | 稳定性指标 |
| Low Power 状态 | 功率不足检测 | 供电健康 |
| 连接状态 | Up/Down | 连通性 |
| 链路速度 | 端口协商速率 | 性能指标 |
| RF 噪声 | 射频干扰 | 无线质量 |
| 信道使用率 | 信道占用 | 容量指标 |

**Application Experience Dashboard**：
- 按应用分类的体验评分
- Good/Fair/Poor 三级评估
- 支持应用级 SLA 监控

---

### 2.2 Cisco Catalyst Center

#### 2.2.1 数据中心 + 园区场景（统一模型）

**健康度模型**：**设备级评分 → 站点聚合模型**

##### 设备级评分（0-10 分）

每 5 分钟计算一次设备健康度，基于以下 KPI：

| KPI | 权重 | 阈值 | 评分规则 |
|------|------|------|----------|
| 可达性 | 最高优先级 | ICMP/SNMP 可达 | 不可达直接判定 Poor |
| CPU 利用率 | 20% | 90% | 超阈值降分 |
| 内存利用率 | 20% | 90% | 超阈值降分 |
| 链路错误率 | 15% | CRC/Input/Output Errors | 错误率影响评分 |
| 链路可用性 | 25% | 接口 Up/Down | Down 接口扣分 |
| 电源/风扇状态 | 10% | 硬件健康 | 异常扣分 |
| 温度状态 | 10% | 过热检测 | 超温扣分 |

##### 设备分类标准

| 状态 | 分数区间 | 颜色 | 判定条件 |
|------|----------|------|----------|
| Good | 8-10 | 绿色 | 所有 KPI 正常 |
| Fair | 4-7 | 琥珀色 | 部分 KPI 超阈值 |
| Poor | 0-3 | 红色 | 任一关键 KPI 严重异常 |

##### 站点健康度计算

```
站点健康度 = Good 设备数 / 总设备数 × 100%
```

按设备类型分层统计：
- Access 设备健康度
- Distribution 设备健康度
- Core 设备健康度
- Router 设备健康度
- WLC/AP 设备健康度

##### Network Services 健康度

| 服务 | 检查方式 | 权重 |
|------|----------|------|
| AAA 服务 | 认证成功率 | 40% |
| DHCP 服务 | 分配成功率 | 30% |
| DNS 服务 | 解析成功率 | 30% |

##### Client 健康度

| 维度 | 指标 | 阈值 |
|------|------|------|
| 连接成功率 | 成功连接数/总尝试数 | > 95% |
| RSSI | 平均信号强度 | > -70 dBm |
| SNR | 信噪比 | > 20 dB |
| 漫游成功率 | 成功漫游数/总漫游数 | > 90% |

**API 支持**：
- `GET /dna/intent/api/v1/site-health` - 站点健康度
- `GET /dna/intent/api/v1/network-health` - 网络健康度
- `GET /dna/intent/api/v1/client-health` - 客户端健康度

---

### 2.3 Juniper Mist + Data Center Assurance

#### 2.3.1 数据中心场景（Data Center Assurance）

**健康度模型**：**SLE（Service Level Expectations）百分比模型**

Juniper Data Center Assurance 定义了 5 个核心 SLE 维度：

##### System Health SLE

| Classifier | Sub-classifiers | 说明 |
|------------|-----------------|------|
| Device Traffic | — | 设备流量影响 |
| Config Deviation | — | 配置变更影响 |
| Environment | Fan, Power, Temp | 硬件环境问题 |
| Resources | CPU, Disk, Memory | 系统资源问题 |

##### Link Health SLE

| Classifier | Sub-classifiers | 说明 |
|------------|-----------------|------|
| Down Interfaces | — | 接口 Down 影响 |
| Bad Optics | — | 光模块问题 |
| Hot Cold Interfaces | Fabric Interfaces, Specific Interfaces | 流量异常接口 |
| Interface Flapping | Fabric Interfaces, Specific Interfaces | 接口震荡 |
| LAG Issues | Imbalance | 链路聚合问题 |
| ESI | — | ESI 接口问题 |

##### Fabric Health SLE

| Classifier | Sub-classifiers | 说明 |
|------------|-----------------|------|
| BGP | IP Reachability Spine to Leaf, Sessions | BGP 会话健康 |
| EVPN | Type 2, Type 3, Type 5, Flood List | EVPN 路由健康 |
| ECMP | Imbalance | ECMP 负载均衡 |

##### Virtual Infra Health SLE

| Classifier | 说明 |
|------------|------|
| Config Mismatch | VLAN 配置不匹配 |
| Non-redundant hosts | 主机冗余检查 |

##### Service Health SLE

| Classifier | 说明 |
|------------|------|
| Impacted by System Issues | 系统健康影响的业务 |
| Impacted by Link Issues | 链路健康影响的业务 |

**SLE 计算方式**：
```
SLE Score = Σ(Classifier Value) / Number of Classifiers
```

每个 SLE 以百分比展示，表示达标时间占比。

#### 2.3.2 园区场景（Mist AI）

**健康度模型**：**用户体验驱动的 SLE 模型**

##### 无线 SLE 维度

| SLE | Classifiers | 阈值示例 |
|-----|-------------|----------|
| Successful Connects | Association, Authorization, DHCP | 分阶段归因分析 |
| Time to Connect | 连接耗时 | 可配置阈值 |
| Roaming | 11r, OKC, Non-11r | 漫游成功率 |
| Throughput | 吞吐量达标率 | 应用类型相关 |
| Coverage | RSSI < -72dBm | 信号覆盖率 |
| Capacity | AP 容量利用率 | 客户端密度 |

##### 有线 SLE 维度

| SLE | 说明 |
|-----|------|
| Successful Connect | 端口认证成功率 |
| Throughput | 端口吞吐达标率 |
| Switch Health | CPU/内存/温度综合状态 |

##### AP Health SLE（2024 新增）

| Classifier | Sub-classifiers | 说明 |
|------------|-----------------|------|
| Network | Latency, Jitter, Tunnel Down | 网络层问题 |
| Infrastructure | CPU, Memory, Crash/Reboot | AP 基础设施健康 |

**特色能力**：
- 根因分析（Root Cause Analysis）：自动归因失败原因
- 机器学习：持续学习网络行为
- 全局视图：组织级、站点级、设备级下钻

---

### 2.4 华为 iMaster NCE 系列

#### 2.4.1 数据中心场景（FabricInsight）

**健康度模型**：**面向流级别的质量评估 + 多维加权模型**

##### AIDC 专用指标

| 指标 | 阈值 | 数据来源 | 说明 |
|------|------|----------|------|
| 流量丢包率 | 0.001% | INT | 逐流统计 |
| 端到端时延 | < 10μs (RoCE) | INT | 微秒级精度 |
| ECN 标记率 | 1% | Telemetry | 拥塞程度 |
| PFC 暂停帧频率 | 100 次/分钟 | Telemetry | 反压状态 |
| Buffer 利用率 | 80% | Telemetry | Memory/Headroom |
| 链路利用率 | 70% | Telemetry | 带宽使用 |

**计算公式**：
```
健康度 = 正常流数 / 总流数 × 100%
```

##### 三维度加权模型（通用 DC）

| 维度 | 权重 | 子指标 |
|------|------|--------|
| 网络健康 | 40% | 设备可达性、CPU/内存利用率、接口错误率、STP 收敛状态 |
| 用户体验 | 35% | 认证成功率、DHCP 分配成功率、DNS 解析成功率、应用时延 |
| 应用性能 | 25% | 关键应用的丢包率、时延、抖动 |

##### 特色能力

1. **INT（In-band Network Telemetry）**：逐包采集，微秒级精度
2. **ML 基线**：机器学习建立网络行为基线，偏差 > 2σ 自动告警
3. **Fabric 级拓扑健康视图**：Spine-Leaf 每条链路的质量热力图

#### 2.4.2 园区场景（CampusInsight）

**健康度模型**：**雷达图六维度模型**

| 维度 | 指标 | 阈值 |
|------|------|------|
| 接入成功率 | 接入成功数/总尝试数 | > 95% |
| 接入时长 | 平均接入耗时 | < 3s |
| 漫游满足率 | 成功漫游数/总漫游数 | > 90% |
| 信号与干扰 | RSSI, SNR | RSSI > -70dBm |
| 容量健康 | 客户端密度 | 可配置 |
| 吞吐满足率 | 实际吞吐/预期吞吐 | > 80% |

**展示方式**：雷达图 + 各维度数值

#### 2.4.3 光传输场景（NCE-T）

**健康度模型**：**光层 + 电层双维度评估**

##### 光层质量

| 指标 | 阈值 | 说明 |
|------|------|------|
| 光功率偏差 | ±3dBm | 发送/接收功率与标称值偏差 |
| OSNR | 18dB | 光信噪比 |
| 色散补偿余量 | — | 色散补偿能力 |
| PMD | — | 偏振模色散 |

##### 电层质量

| 指标 | 阈值 | 说明 |
|------|------|------|
| 误码率（Pre-FEC） | 1e-4 | 前向纠错前误码率 |
| 误码率（Post-FEC） | 1e-15 | 前向纠错后误码率 |
| OTN 帧错误率 | — | OTN 层错误 |

##### 通道状态

| 指标 | 说明 |
|------|------|
| 波长通道利用率 | 通道占用率 |
| 保护路径可用性 | 主备路径状态 |
| 倒换次数 | 保护倒换频率 |

**计算公式**：
```
健康度 = 健康光路数 / 总光路数 × 100%
```

---

### 2.5 华三 SeerAnalyzer + AD-NET 系列

#### 2.5.1 数据中心场景（SeerAnalyzer-DC / AD-DC）

**健康度模型**：**基于 Telemetry + AI 的智能分析模型**

##### 核心能力

1. **实时数据采集**：基于 Telemetry 技术
2. **AI 算法分析**：场景化 AI 算法识别网络问题
3. **预测性维护**：预测潜在网络风险

##### 监控维度

| 维度 | 指标 | 说明 |
|------|------|------|
| 设备健康 | CPU/内存/温度/电源 | 基础设施监控 |
| 链路健康 | 带宽利用率/丢包率/延迟 | 链路质量监控 |
| Fabric 健康 | BGP/EVPN 会话状态 | 控制平面健康 |
| Overlay 健康 | VXLAN 隧道状态 | Overlay 网络健康 |
| 业务健康 | 应用性能指标 | 业务层监控 |

#### 2.5.2 园区场景（SeerAnalyzer-Campus / AD-Campus）

**健康度模型**：**AI 驱动的预测性维护模型**

##### 核心能力

1. **实时数据获取**：网络状态实时感知
2. **智能分析**：AI 驱动的故障识别
3. **预测性维护**：故障预测与预防

##### 监控维度

| 维度 | 指标 | 说明 |
|------|------|------|
| 终端接入 | 接入成功率/认证成功率 | 终端体验 |
| 无线质量 | RSSI/SNR/漫游成功率 | 无线网络质量 |
| 有线网络 | 端口状态/错误率 | 有线网络健康 |
| 应用体验 | 应用响应时间/可用性 | 应用层体验 |

---

## 3. 方案 A：通用基础方案

### 3.1 设计原则

1. **三种场景共用一套公式**，不区分数据中心/园区/光传输
2. **仅依赖基础设施层指标**，不涉及业务层指标
3. **实现简单**，适合 MVP 阶段快速上线
4. 参考 Cisco Catalyst Center 的"健康设备占比"思路

### 3.2 计算公式

```
设备级判定：每台设备判定为 Good / Fair / Poor
站点健康度 = Good 设备数 / 总设备数 × 100
```

### 3.3 设备状态判定规则

每台设备根据以下检查项进行分类，任一条件命中即取最差状态（优先级：Poor > Fair > Good）：

| 优先级 | 状态 | 判定条件 | 说明 |
|--------|------|----------|------|
| 1 | Poor | 设备离线（ICMP/SNMP 不可达） | 最高优先级 |
| 2 | Poor | 存在 Critical 级别活跃告警 | 严重告警 |
| 3 | Fair | CPU 利用率 > 90% | 参考 Cisco 阈值 |
| 4 | Fair | 内存利用率 > 90% | 参考 Cisco 阈值 |
| 5 | Fair | 存在 Major 级别活跃告警 | 重要告警 |
| 6 | Fair | 接口错误率 > 1% | 链路质量 |
| 7 | Good | 以上条件均不满足 | 设备正常 |

### 3.4 计算示例

| 场景 | 设备总数 | Good | Fair | Poor | 健康度 |
|------|----------|------|------|------|--------|
| 正常运行 | 68 | 64 | 3 | 1 | 94 |
| 轻微异常 | 68 | 50 | 12 | 6 | 74 |
| 严重故障 | 68 | 20 | 18 | 30 | 29 |

### 3.5 状态映射

| 评分区间 | 状态 | 颜色 | 说明 |
|----------|------|------|------|
| 90-100 | 健康（Healthy） | #10b981 绿色 | 网络运行正常 |
| 70-89 | 一般（Fair） | #f59e0b 琥珀色 | 存在需关注的问题 |
| 0-69 | 异常（Critical） | #ef4444 红色 | 需要立即处理 |

### 3.6 数据依赖

| 数据类型 | 采集方式 | 频率 |
|----------|----------|------|
| 设备在线状态 | ICMP/SNMP 轮询 | 1 分钟 |
| CPU/内存利用率 | SNMP/Telemetry | 5 分钟 |
| 接口状态与错误 | SNMP/Telemetry | 5 分钟 |
| 活跃告警 | 告警系统 API | 实时 |

### 3.7 优缺点

| 优点 | 缺点 |
|------|------|
| 对齐 Cisco 设计思路，业内认可度高 | 无法反映场景特有的业务质量 |
| 设备级判定逻辑清晰，避免重复扣分 | 对光传输场景不够精准 |
| 实现简单，适合 MVP 快速上线 | 权重固定，无法按场景调优 |
| 包含 CPU/内存资源检查 | 无动态基线能力 |

---

## 4. 方案 B：演进专业方案

### 4.1 设计原则

1. **按场景定制指标和权重**
2. **多维加权模型**，参考业内最佳实践
3. **支持阈值可配置**
4. 每个维度独立评分 0-100，最终加权汇总

### 4.2 通用公式

```
Site Health = Σ (维度评分_i × 权重_i)
```

其中每个维度评分 = 100 - 该维度的扣分，clamp 到 [0, 100]。

### 4.3 数据中心场景

参考华为 FabricInsight + Cisco Catalyst Center + Juniper DCA 的设计。

#### 4.3.1 维度与权重

| 维度 | 权重 | 说明 | 参考厂商 |
|------|------|------|----------|
| 设备可用性 | 25% | 设备在线率、可达性 | Cisco |
| 设备资源 | 15% | CPU、内存、温度 | Cisco + Arista |
| 链路质量 | 15% | 链路错误率、丢包率、Up/Down | Cisco |
| Fabric 健康 | 20% | BGP/EVPN 会话、ECMP 负载均衡 | Juniper DCA |
| RoCE/RDMA 质量 | 15% | ECN 标记率、PFC 暂停、Buffer | 华为 |
| 网络服务 | 10% | AAA/DNS/DHCP 服务可用性 | Cisco |

#### 4.3.2 各维度评分细则

##### 设备可用性（25%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| 设备在线率 | 70% | 在线数/总数 × 100 | — |
| 设备可达性 | 30% | ICMP/SNMP 可达设备数/总数 × 100 | — |

##### 设备资源（15%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| CPU 利用率 | 40% | 100 - avg(超阈值设备的超出百分比) | 80% |
| 内存利用率 | 40% | 100 - avg(超阈值设备的超出百分比) | 85% |
| 温度 | 20% | 100 - (超温设备数/总数 × 100) | 75°C |

##### 链路质量（15%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| 链路 Up 率 | 50% | Up 链路数/总链路数 × 100 | — |
| 接口错误率 | 30% | 100 - (有错误接口数/总接口数 × 100) | 1% |
| 丢包率 | 20% | 100 - avg(丢包率) × 1000 | 0.1% |

##### Fabric 健康（20%）— 参考 Juniper DCA

| 子指标 | 权重 | 评分规则 | 说明 |
|--------|------|----------|------|
| BGP 会话健康 | 40% | Established 会话数/总会话数 × 100 | 参考 Juniper Fabric Health SLE |
| EVPN 路由健康 | 30% | 正常路由数/预期路由数 × 100 | Type-2/Type-3/Type-5 |
| ECMP 负载均衡 | 30% | 100 - (ECMP 不均衡度 × 100) | 参考 Juniper ECMP Imbalance |

##### RoCE/RDMA 质量（15%）— AIDC 专用

| 子指标 | 权重 | 评分规则 | 阈值 | 数据来源 |
|--------|------|----------|------|----------|
| ECN 标记率 | 40% | 100 - (ECN 标记包数/总包数 × 10000) | 1% | Telemetry |
| PFC 暂停频率 | 30% | 100 - min(PFC 暂停次数/分钟, 100) | 100/min | Telemetry |
| Headroom Buffer 利用率 | 30% | 100 - avg(Buffer 利用率) | 80% | Telemetry |

##### 网络服务（10%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| AAA 服务可用性 | 40% | AAA 认证成功率 × 100 |
| DHCP 服务可用性 | 30% | DHCP 分配成功率 × 100 |
| DNS 服务可用性 | 30% | DNS 解析成功率 × 100 |

#### 4.3.3 特色能力

1. **INT 数据采集**：支持微秒级时延监控（可选）
2. **动态基线**：基于历史 7 天数据自动计算阈值（mean + 2σ）
3. **流级别健康度**：正常流数/总流数（需要 INT 支持）

### 4.4 园区场景

参考 Juniper Mist SLE + Arista CUE + Cisco Catalyst Center 的设计。

#### 4.4.1 维度与权重

| 维度 | 权重 | 说明 | 参考厂商 |
|------|------|------|----------|
| 设备可用性 | 15% | 交换机/AP 在线率 | Cisco |
| 基础设施健康 | 15% | AP CPU/内存/Crash/Reboot/Low Power | Arista CUE |
| 有线网络质量 | 15% | 端口 Up 率、错误率 | Juniper Mist Wired SLE |
| 无线网络质量 | 20% | 覆盖率、信号强度、连接成功率 | Juniper Mist + Arista |
| 用户体验 | 15% | 认证/DHCP/漫游/应用体验 | Juniper Mist SLE |
| 网络服务 | 10% | AAA/DNS/DHCP 服务可用性 | Cisco |
| 告警状态 | 10% | 活跃告警数量与严重程度 | 通用 |

#### 4.4.2 各维度评分细则

##### 设备可用性（15%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 交换机在线率 | 50% | 在线数/总数 × 100 |
| AP 在线率 | 50% | 在线数/总数 × 100 |

##### 基础设施健康（15%）— 参考 Arista CUE

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| AP CPU 利用率 | 30% | 100 - (CPU > 80% 的 AP 数 / 总 AP 数 × 100) | 80% |
| AP 内存利用率 | 30% | 100 - (内存 > 80% 的 AP 数 / 总 AP 数 × 100) | 80% |
| Crash/Reboot 计数 | 25% | 100 - min(24h 内 Crash+Reboot 次数 × 10, 100) | — |
| Low Power 状态 | 15% | 100 - (Low Power AP 数 / 总 AP 数 × 100) | — |

##### 有线网络质量（15%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 端口 Up 率 | 60% | Up 端口数/总端口数 × 100 |
| 接口错误率 | 40% | 100 - (有错误接口数/总接口数 × 100) |

##### 无线网络质量（20%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| AP 覆盖率 | 30% | 信号 ≥ -70dBm 的区域占比 × 100 | -70dBm |
| 平均信号强度 | 30% | 归一化：-30dBm=100, -90dBm=0，线性插值 | — |
| 连接成功率 | 40% | 成功连接数/总尝试数 × 100 | — |

##### 用户体验（15%）— 参考 Juniper Mist SLE

| 子指标 | 权重 | 评分规则 | 参考 SLE |
|--------|------|----------|----------|
| 认证成功率 | 30% | 成功数/总数 × 100 | Successful Connects SLE |
| DHCP 成功率 | 25% | 成功数/总数 × 100 | Successful Connects SLE |
| 漫游成功率 | 25% | 成功数/总数 × 100 | Roaming SLE |
| 应用体验 | 20% | Good 体验客户端数/总客户端数 × 100 | Application SLE |

##### 网络服务（10%）

同数据中心场景。

### 4.5 光传输场景

参考华为 iMaster NCE-T 的设计。

#### 4.5.1 维度与权重

| 维度 | 权重 | 说明 | 参考厂商 |
|------|------|------|----------|
| 设备可用性 | 20% | OTN/DWDM 设备在线率 | 华为 NCE-T |
| 光层质量 | 30% | 光功率、OSNR、误码率 | 华为 NCE-T |
| 通道利用率 | 15% | 波长通道占用率 | 华为 NCE-T |
| 保护倒换 | 15% | 保护路径可用性、倒换次数 | 华为 NCE-T |
| 网络服务 | 5% | 管理通道可用性 | 华为 NCE-T |
| 告警状态 | 15% | 活跃告警数量与严重程度 | 通用 |

#### 4.5.2 各维度评分细则

##### 设备可用性（20%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 设备在线率 | 100% | 在线数/总数 × 100 |

##### 光层质量（30%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| 光功率偏差 | 30% | 100 - (偏差超阈值端口数/总端口数 × 100) | ±3dBm |
| OSNR | 40% | 归一化：≥25dB=100, ≤15dB=0，线性插值 | 18dB |
| 误码率（BER） | 30% | 100 - (BER 超阈值链路数/总链路数 × 100) | 1e-9 |

##### 通道利用率（15%）

| 子指标 | 权重 | 评分规则 | 阈值 |
|--------|------|----------|------|
| 波长通道利用率 | 100% | 100 - max(0, (利用率 - 80) × 5) | 80% |

##### 保护倒换（15%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 保护路径可用性 | 70% | 可用保护路径数/需保护路径数 × 100 |
| 倒换频率 | 30% | 100 - min(24h 内倒换次数 × 10, 100) |

##### 网络服务（5%）

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 管理通道可用性 | 100% | 可用管理通道数/总管理通道数 × 100 |

### 4.6 阈值模式

支持两种阈值模式，用户可在系统设置中切换：

| 模式 | 健康 | 一般 | 异常 | 适用场景 |
|------|------|------|------|----------|
| 标准模式（默认） | ≥ 90 | 70-89 | < 70 | 一般企业网络 |
| 严格模式 | ≥ 95 | 85-94 | < 85 | 金融/医疗等高可用场景，对标 Arista（Green ≥ 98.5%） |

子指标阈值支持两种计算方式：

| 方式 | 说明 | 适用 |
|------|------|------|
| 静态阈值（默认） | 管理员手动配置固定阈值（如 CPU > 80%） | 所有场景 |
| 动态基线 | 阈值 = mean + 2σ（参考 Arista CUE），基于历史 7 天数据自动计算 | 方案 B v2.1+ |

---

## 5. 方案对比与演进路径

### 5.1 两套方案对比

| 对比项 | 方案 A（通用基础） | 方案 B（演进专业） |
|--------|-------------------|-------------------|
| 计算模型 | 设备分类聚合（Good/Fair/Poor） | 多维加权（按场景定制） |
| 实现复杂度 | 低 | 高 |
| 数据依赖 | 设备状态 + 告警 + CPU/内存 | + Fabric/业务指标 + Telemetry + Network Services |
| 场景区分 | 不区分 | 数据中心/园区/光传输分别定制 |
| 评分精准度 | 中等 | 高 |
| 可解释性 | 高（设备级 Good/Fair/Poor 透明） | 中（多维加权需文档说明） |
| 阈值模式 | 固定（90/70） | 标准/严格 + 静态/动态基线 |
| 对标厂商 | Cisco Catalyst Center | Cisco + Arista + Juniper + 华为 |
| 适用阶段 | MVP / v1.0 | v2.0+ |
| 开发周期 | 1-2 周 | 4-6 周 |

### 5.2 演进路径

**建议路径**：

1. **v1.0 上线方案 A**，快速交付，覆盖基本健康度展示需求
2. **v2.0 升级方案 B**，增加 Network Services、Fabric 健康、用户体验、动态基线能力
3. 方案 A → B 的过渡是平滑的：方案 A 的设备/告警/链路维度在方案 B 中完全保留，只是增加了业务层维度和场景化权重

---

## 6. 参考文档

| 厂商 | 文档 | 链接 |
|------|------|------|
| Arista | CloudVision CUE SLA Dashboard | https://www.arista.com/en/ug-cv-cue/cv-cue-dashboards |
| Arista | CloudVision CUE Baselines | https://www.arista.com/ug-cv-cue/cv-cue-baselines |
| Arista | Device Compliance | https://www.arista.com/en/cg-cv/cv-device-compliance |
| Arista | System Health AQL | https://aql.arista.com/examples/system_health/index.html |
| Cisco | Catalyst Center Health Monitoring API | https://developer.cisco.com/docs/catalyst-center/health-monitoring/ |
| Cisco | Monitor and Troubleshoot Network Health | https://www.cisco.com/c/en/us/td/docs/cloud-systems-management/network-automation-and-management/dna-center-assurance/ |
| Juniper | Data Center Assurance SLE Overview | https://www.juniper.net/documentation/us/en/software/juniper-data-center-assurance/user-guide/topics/concept/juniper-data-center-assurance-sle-overview.html |
| Juniper | Mist SLE Overview | https://www.juniper.net/documentation/us/en/software/mist/mist-aiops/shared-content/topics/concept/service-level-expectations.html |
| Juniper | Mist Wired SLE | https://www.juniper.net/documentation/us/en/software/mist/mist-aiops/shared-content/topics/concept/sle-wired-successful-connect.html |
| 华为 | iMaster NCE{}
FabricInsight | https://e.huawei.com/en/products/network-analysis/fabricinsight |
| 华为 | iMaster NCE-CampusInsight | https://e.huawei.com/en/products/network-analysis/campusinsight |
| 华为 | iMaster NCE-T 光传输 | https://carrier.huawei.com/en/products/fixed-network/nce/NCE-T/intelligent-otn-om |
| 华三 | SeerAnalyzer-DC | https://www.h3c.com/en/Products_and_Solutions/InterConnect/Data_Center/Flagship_Products/Software_Products/SeerAnalyzer/ |
| 华三 | SeerAnalyzer-Campus | https://www.h3c.com/en/Products_and_Solutions/InterConnect/Campus_Network/Products/MCAP/Analysis/SeerAnalyzer_Campus/ |

---

## 7. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-06 | 初始版本，深度调研 Arista/Cisco/Juniper/华为/华三健康分数方案，输出通用基础方案和演进专业方案 | AmpCon Product Team |
