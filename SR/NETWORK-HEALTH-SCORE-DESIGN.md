# 网络健康度评分设计方案

| 项目 | 内容 |
|------|------|
| 文档编号 | DS-AMPCON-HEALTH-001 |
| 版本 | v1.1 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-04-27 |

---

## 1. 背景

AmpCon 融合控制器管理三种网络场景（数据中心、园区、光传输），每个 Site 需要一个 0-100 的健康度评分来反映网络整体运行状态。本文档提供两版方案：

- **方案 A（简单通用版）**：统一公式，三种场景共用，不涉及业务层指标，实现简单
- **方案 B（专业版）**：参考 Cisco Catalyst Center / Juniper Mist / Huawei iMaster NCE 的设计，按场景定制权重和指标

---

## 2. 业内参考

| 厂商 | 产品 | 健康度计算方式 | 参考链接 |
|------|------|----------------|----------|
| Cisco | Catalyst Center (DNA Center) | **设备级评分 → 站点聚合模型。** 每台设备每 5 分钟计算一次健康度评分（0-10），评分基于多个 KPI 的综合判定：①可达性（ICMP/SNMP 是否可达）②CPU 利用率（阈值 90%）③内存利用率（阈值 90%）④链路错误率（CRC/Input/Output Errors）⑤链路可用性（接口 Up/Down 状态）。任一 KPI 超阈值则该设备标记为 Poor（0-3）、Fair（4-7）或 Good（8-10）。站点健康度 = Good 设备数 / 总设备数 × 100%，按设备类型（Access/Distribution/Core/Router/WLC/AP）分别统计。同时提供 Network Services 健康度（AAA/DNS/DHCP 可用性）和 Client 健康度（连接成功率/RSSI/SNR）作为补充维度。Critical Issues 面板展示 P1/P2 级别问题数量。 | [Assurance - Overall Health](https://www.cisco.com/c/en/us/td/docs/cloud-systems-management/network-automation-and-management/catalyst-center-assurance/2-3-7/b_cisco_catalyst_assurance_2_3_7_ug/b_cisco_catalyst_assurance_2_3_6_ug_chapter_0101.html) · [Assurance - Network Health](https://www.cisco.com/c/en/us/td/docs/cloud-systems-management/network-automation-and-management/catalyst-center-assurance/2-3-7/b_cisco_catalyst_assurance_2_3_7_ug/b_cisco_catalyst_assurance_2_3_6_ug_chapter_0110.html) · [Health Monitoring API](https://developer.cisco.com/docs/catalyst-center/health-monitoring/) |
| Juniper | Mist AI | **SLE（Service Level Expectation）百分比模型。** 不使用传统的设备健康评分，而是从用户体验角度定义多个 SLE 维度，每个维度独立计算达标百分比。**无线 SLE 维度：**①Successful Connects（连接成功率，细分为 Association/Authorization/DHCP 三阶段失败归因）②Time to Connect（连接耗时，阈值可配置）③Roaming（漫游成功率，区分 11r/OKC/Non-11r）④Throughput（吞吐量达标率）⑤Coverage（信号覆盖率，基于 RSSI 阈值 -72dBm）⑥Capacity（AP 容量利用率）。**有线 SLE 维度：**①Successful Connect（端口认证成功率）②Throughput（端口吞吐达标率）③Switch Health（交换机 CPU/内存/温度综合状态）。每个 SLE 以百分比展示（如 "Roaming: 96%"），支持下钻到具体失败原因的根因分析（Root Cause Analysis）。站点整体健康度为各 SLE 维度的最低值或加权平均。 | [Wireless SLE - Successful Connects](https://www.juniper.net/documentation/us/en/software/mist/mist-wireless/shared-content/topics/concept/sle-wireless-successful-connects.html) · [SLE Overview](https://www.juniper.net/documentation/us/en/software/mist/mist-aiops/shared-content/topics/concept/service-level-expectations.html) · [Wired SLE - Throughput](https://www.juniper.net/documentation/us/en/software/mist/mist-wired/shared-content/topics/concept/sle-wired-throughput.html) · [SLE Troubleshooting](https://www.juniper.net/documentation/us/en/software/mist/mist-wireless/topics/concept/mist-wireless-sle-troubleshooting.html) |
| Huawei | iMaster NCE-CampusInsight | **三维度加权模型 + ML 基线。** 基于 Telemetry 实时采集（gRPC/NETCONF），通过机器学习建立网络行为基线，三个评分维度加权合成：①**网络健康**（权重 40%）：设备可达性、CPU/内存利用率、接口错误率、STP 收敛状态②**用户体验**（权重 35%）：认证成功率、DHCP 分配成功率、DNS 解析成功率、漫游成功率、应用时延③**应用性能**（权重 25%）：关键应用的丢包率、时延、抖动。每个维度 0-100 分，加权汇总为站点健康度。支持智能基线对比（当前值 vs 历史基线），偏差超过 2σ 自动告警。 | [CampusInsight](https://e.huawei.com/ma/products/network-analysis/campusinsight) |
| Huawei | iMaster NCE-FabricInsight | **数据中心专用，面向流级别的质量评估。** 基于 INT（In-band Network Telemetry）逐包采集，核心指标：①**流量丢包率**（逐流统计，阈值 0.001%）②**端到端时延**（微秒级，阈值因业务类型而异，RoCE 流 < 10μs）③**ECN 标记率**（反映拥塞程度，阈值 1%）④**PFC 暂停帧频率**（反映反压状态，阈值 100 次/分钟）⑤**Buffer 利用率**（Memory/Headroom，阈值 80%）⑥**链路利用率**（阈值 70%）。健康度 = 正常流数 / 总流数 × 100%，同时提供 Fabric 级别的拓扑健康视图（Spine-Leaf 每条链路的质量热力图）。 | [FabricInsight](https://e.huawei.com/id/products/network-analysis/FabricInsight) |
| Huawei | iMaster NCE-T | **光传输专用，光层 + 电层双维度评估。** ①**光层质量**：光功率偏差（发送/接收功率与标称值的偏差，阈值 ±3dBm）、OSNR（光信噪比，阈值 18dB）、色散补偿余量、PMD（偏振模色散）②**电层质量**：误码率 BER（前纠错前/后，阈值 Pre-FEC 1e-4 / Post-FEC 1e-15）、OTN 帧错误率③**通道状态**：波长通道利用率、保护路径可用性、倒换次数④**设备状态**：单板温度、激光器老化指标、电源冗余状态。健康度按光路（Optical Trail）粒度评估，每条光路独立评分，站点健康度 = 健康光路数 / 总光路数 × 100%。 | [iMaster NCE-T](https://e.huawei.com/it/products/network-analysis/imaster-nce-t) |
| Arista | CloudVision | **合规性驱动的健康评估模型。** 不使用单一数值评分，而是基于多维合规性检查（Compliance Check）判定健康状态：①**配置合规**：设备运行配置与设计配置的一致性（Config Diff）②**镜像合规**：设备 EOS 版本是否符合目标版本③**设备状态**：CPU/内存/温度/电源/风扇状态④**接口状态**：端口 Up/Down、错误计数器、CRC⑤**BGP/OSPF 邻居状态**：协议会话是否 Established⑥**MLAG 状态**：双活链路聚合健康。每项检查为 Pass/Fail，站点健康度以百分比展示（Pass 项数 / 总检查项数 × 100%）。CloudVision CUE 的 SLA Dashboard 按 Location 级别展示网络/设备/应用健康百分比，阈值可配置（默认 Green ≥ 98.5%，Orange ≥ 80%，Red < 80%）。 | [CUE SLA Dashboard](https://www.arista.com/ug-cv-cue/cv-cue-dashboards) · [CUE Baselines](https://www.arista.com/ug-cv-cue/cv-cue-baselines) · [Device Compliance](https://www.arista.com/en/cg-cv/cv-device-compliance) · [System Health AQL](https://aql.arista.com/examples/system_health/index.html) |

> 以上内容基于公开文档整理，具体实现细节可能因版本不同而有差异。Content was rephrased for compliance with licensing restrictions.

---

## 3. 方案 A：简单通用版

### 3.1 设计原则

- **三种场景共用一套公式**，不区分数据中心/园区/光传输
- **仅依赖基础设施层指标**，不涉及业务层（如 RoCE、Wi-Fi 体验等）
- **实现简单**，适合 MVP 阶段快速上线
- 参考 Cisco Catalyst Center 的"健康设备占比"思路，但增加告警维度

### 3.2 计算公式

```
设备级判定：每台设备判定为 Good / Fair / Poor
站点健康度 = Good 设备数 / 总设备数 × 100
```

### 3.3 设备状态判定规则

每台设备根据以下检查项进行分类，任一条件命中即取最差状态（优先级：Poor > Fair > Good）：

| 状态 | 判定条件 | 说明 |
|------|----------|------|
| Poor (不健康) | 设备离线（ICMP/SNMP 不可达）| 最高优先级，直接判定 |
| Poor (不健康) | 存在 Critical 级别活跃告警 | 有严重告警即不健康 |
| Fair (亚健康) | CPU 利用率 > 90% | 参考 Cisco 阈值 |
| Fair (亚健康) | 内存利用率 > 90% | 参考 Cisco 阈值 |
| Fair (亚健康) | 存在 Major 级别活跃告警 | 有重要告警为亚健康 |
| Fair (亚健康) | 接口错误率 > 1%（CRC/Input/Output Errors）| 链路质量问题 |
| Good (健康) | 以上条件均不满足 | 设备运行正常 |

判定优先级：Poor > Fair > Good，任一条件命中即取最差状态。

### 3.4 计算示例

| 场景 | 设备总数 | Good | Fair | Poor | 健康度 |
|------|----------|------|------|------|--------|
| 正常运行 | 68 | 64 | 3 | 1 | 64/68 × 100 = **94** |
| 轻微异常 | 68 | 50 | 12 | 6 | 50/68 × 100 = **74** |
| 严重故障 | 68 | 20 | 18 | 30 | 20/68 × 100 = **29** |

### 3.5 状态映射

| 评分区间 | 状态 | 颜色 | 说明 |
|----------|------|------|------|
| 90-100 | 健康（Healthy） | #10b981 绿色 | 网络运行正常 |
| 70-89 | 一般（Fair） | #f59e0b 琥珀色 | 存在需关注的问题 |
| 0-69 | 异常（Critical） | #ef4444 红色 | 需要立即处理 |

### 3.6 优缺点

| 优点 | 缺点 |
|------|------|
| 对齐 Cisco Catalyst Center 设计思路，业内认可度高 | 无法反映场景特有的业务质量 |
| 设备级判定逻辑清晰，避免重复扣分 | 对光传输场景不够精准（光层指标缺失） |
| 包含 CPU/内存资源检查，不仅看在线/离线 | 权重固定，无法按场景调优 |
| 实现简单，适合 MVP 快速上线 | 无动态基线能力 |

---

## 4. 方案 B：专业版（按场景定制）

### 4.1 设计原则

- **按场景定制指标和权重**，数据中心关注 RoCE/Buffer，园区关注用户体验，光传输关注光层质量
- **多维加权模型**，参考 Cisco Catalyst Center + Juniper Mist SLE 的设计
- **支持阈值可配置**，运维人员可调整各维度权重
- 每个维度独立评分 0-100，最终加权汇总

### 4.2 通用公式

```
Site Health = Σ (维度评分_i × 权重_i)
```

其中每个维度评分 = 100 - 该维度的扣分，clamp 到 [0, 100]。

### 4.3 数据中心场景

参考 Cisco Catalyst Center 设备健康 + Huawei iMaster NCE-FabricInsight 的 RoCE 监控指标。

#### 维度与权重

| 维度 | 权重 | 说明 |
|------|------|------|
| 设备可用性 | 25% | 设备在线率、可达性 |
| 设备资源 | 15% | CPU、内存、温度 |
| 链路质量 | 15% | 链路错误率、丢包率、链路 Up/Down |
| RoCE/RDMA 质量 | 20% | ECN 标记率、PFC 暂停次数、Buffer 利用率 |
| 网络服务 | 10% | AAA/DNS/DHCP 服务可用性（参考 Cisco Network Services Health） |
| 告警状态 | 15% | 活跃告警数量与严重程度 |

#### 各维度评分细则

**设备可用性（25%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 设备在线率 | 70% | 在线数/总数 × 100 |
| 设备可达性 | 30% | ICMP/SNMP 可达设备数/总数 × 100 |

**设备资源（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| CPU 利用率 | 40% | 100 - avg(超阈值设备的超出百分比)；阈值 80% |
| 内存利用率 | 40% | 100 - avg(超阈值设备的超出百分比)；阈值 85% |
| 温度 | 20% | 100 - (超温设备数/总数 × 100)；阈值 75°C |

**链路质量（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 链路 Up 率 | 50% | Up 链路数/总链路数 × 100 |
| 接口错误率 | 30% | 100 - (有错误接口数/总接口数 × 100) |
| 丢包率 | 20% | 100 - avg(丢包率) × 1000（放大系数） |

**RoCE/RDMA 质量（20%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| ECN 标记率 | 40% | 100 - (ECN 标记包数/总包数 × 10000) |
| PFC 暂停频率 | 30% | 100 - min(PFC 暂停次数/分钟, 100) |
| Headroom Buffer 利用率 | 30% | 100 - avg(Buffer 利用率) |

**网络服务（10%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| AAA 服务可用性 | 40% | AAA 认证成功率 × 100 |
| DHCP 服务可用性 | 30% | DHCP 分配成功率 × 100 |
| DNS 服务可用性 | 30% | DNS 解析成功率 × 100 |

**告警状态（15%）**

| 子指标 | 评分规则 |
|--------|----------|
| 告警扣分 | 同方案 A 告警维度，归一化到 0-100 |

### 4.4 园区场景

参考 Juniper Mist SLE + Cisco Catalyst Center 无线健康度 + Arista CloudVision CUE。

#### 维度与权重

| 维度 | 权重 | 说明 |
|------|------|------|
| 设备可用性 | 15% | 交换机/AP 在线率 |
| 基础设施健康 | 15% | AP CPU/内存、Crash/Reboot、Low Power（参考 Arista Infrastructure Dashboard） |
| 有线网络质量 | 15% | 交换机端口 Up 率、错误率 |
| 无线网络质量 | 20% | AP 覆盖率、信号强度、连接成功率 |
| 用户体验 | 15% | 认证成功率、DHCP 成功率、漫游成功率、应用体验 |
| 网络服务 | 10% | AAA/DNS/DHCP 服务可用性 |
| 告警状态 | 10% | 活跃告警数量与严重程度 |

#### 各维度评分细则

**设备可用性（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 交换机在线率 | 50% | 在线数/总数 × 100 |
| AP 在线率 | 50% | 在线数/总数 × 100 |

**基础设施健康（15%）** — 参考 Arista CloudVision CUE Infrastructure Dashboard

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| AP CPU 利用率 | 30% | 100 - (CPU > 80% 的 AP 数 / 总 AP 数 × 100)；阈值 80%（参考 Arista） |
| AP 内存利用率 | 30% | 100 - (内存 > 80% 的 AP 数 / 总 AP 数 × 100)；阈值 80% |
| Crash/Reboot 计数 | 25% | 100 - min(24h 内 Crash+Reboot 次数 × 10, 100) |
| Low Power 状态 | 15% | 100 - (Low Power AP 数 / 总 AP 数 × 100) |

**有线网络质量（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 端口 Up 率 | 60% | Up 端口数/总端口数 × 100 |
| 接口错误率 | 40% | 100 - (有错误接口数/总接口数 × 100) |

**无线网络质量（20%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| AP 覆盖率 | 30% | 信号 ≥ -70dBm 的区域占比 × 100 |
| 平均信号强度 | 30% | 归一化：-30dBm=100, -90dBm=0，线性插值 |
| 连接成功率 | 40% | 成功连接数/总尝试数 × 100 |

**用户体验（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 认证成功率 | 30% | 成功数/总数 × 100 |
| DHCP 成功率 | 25% | 成功数/总数 × 100 |
| 漫游成功率 | 25% | 成功数/总数 × 100 |
| 应用体验 | 20% | Good 体验客户端数/总客户端数 × 100（参考 Arista Application Experience） |

**网络服务（10%）** — 同数据中心场景

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| AAA 服务可用性 | 40% | AAA 认证成功率 × 100 |
| DHCP 服务可用性 | 30% | DHCP 分配成功率 × 100 |
| DNS 服务可用性 | 30% | DNS 解析成功率 × 100 |

**告警状态（10%）**

同数据中心场景。

### 4.5 光传输场景

参考 Huawei iMaster NCE-T 光传输管理指标。

#### 维度与权重

| 维度 | 权重 | 说明 |
|------|------|------|
| 设备可用性 | 20% | OTN/DWDM 设备在线率 |
| 光层质量 | 30% | 光功率、OSNR、误码率 |
| 通道利用率 | 15% | 波长通道占用率 |
| 保护倒换 | 15% | 保护路径可用性、倒换次数 |
| 网络服务 | 5% | 管理通道可用性 |
| 告警状态 | 15% | 活跃告警数量与严重程度 |

#### 各维度评分细则

**设备可用性（20%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 设备在线率 | 100% | 在线数/总数 × 100 |

**光层质量（30%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 光功率偏差 | 30% | 100 - (偏差超阈值端口数/总端口数 × 100)；阈值 ±3dBm |
| OSNR | 40% | 归一化：≥25dB=100, ≤15dB=0，线性插值 |
| 误码率（BER） | 30% | 100 - (BER 超阈值链路数/总链路数 × 100)；阈值 1e-9 |

**通道利用率（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 波长通道利用率 | 100% | 100 - max(0, (利用率 - 80) × 5)；80% 以下满分，100% 扣完 |

**保护倒换（15%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 保护路径可用性 | 70% | 可用保护路径数/需保护路径数 × 100 |
| 倒换频率 | 30% | 100 - min(24h 内倒换次数 × 10, 100) |

**网络服务（5%）**

| 子指标 | 权重 | 评分规则 |
|--------|------|----------|
| 管理通道可用性 | 100% | 可用管理通道数/总管理通道数 × 100 |

**告警状态（15%）**

同数据中心场景。

### 4.6 状态映射

三种场景统一使用相同的状态映射：

| 评分区间 | 状态 | 颜色 | 说明 |
|----------|------|------|------|
| 90-100 | 健康（Healthy） | #10b981 绿色 | 网络运行正常 |
| 70-89 | 一般（Fair） | #f59e0b 琥珀色 | 存在需关注的问题 |
| 0-69 | 异常（Critical） | #ef4444 红色 | 需要立即处理 |

### 4.7 阈值模式

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

### 4.8 优缺点

| 优点 | 缺点 |
|------|------|
| 按场景定制，评分精准 | 实现复杂，需要各场景的数据采集能力 |
| 覆盖业务层指标（RoCE/Wi-Fi/光层/应用体验） | 需要更多的 Telemetry 数据源 |
| 包含 Network Services 维度（对齐 Cisco） | 阈值调优需要运维经验 |
| 包含 Infrastructure 健康维度（对齐 Arista） | 开发周期长 |
| 支持动态基线（mean + 2σ） | 动态基线需要 7 天历史数据积累 |
| 权重可配置，灵活性高 | — |
| 支持标准/严格两种阈值模式 | — |

---

## 5. 方案对比与建议

| 对比项 | 方案 A（简单通用） | 方案 B（专业版） |
|--------|-------------------|-----------------|
| 计算模型 | 设备分类聚合（Good/Fair/Poor） | 多维加权（按场景定制） |
| 实现复杂度 | 低 | 高 |
| 数据依赖 | 设备状态 + 告警 + CPU/内存 | + 业务指标 + Telemetry + Network Services |
| 场景区分 | 不区分 | 数据中心/园区/光传输分别定制 |
| 评分精准度 | 中等 | 高 |
| 可解释性 | 高（设备级 Good/Fair/Poor 透明） | 中（多维加权需文档说明） |
| 阈值模式 | 固定（90/70） | 标准/严格 + 静态/动态基线 |
| 对标厂商 | Cisco Catalyst Center | Cisco + Arista + Juniper Mist |
| 适用阶段 | MVP / v1.0 | v2.0+ |
| 开发周期 | 1-2 周 | 4-6 周 |

**建议路径：**

1. **v1.0 上线方案 A**，快速交付，覆盖基本健康度展示需求
2. **v2.0 升级方案 B**，增加 Network Services、Infrastructure 健康、Application Experience、动态基线能力
3. 方案 A → B 的过渡是平滑的：方案 A 的设备/告警/链路维度在方案 B 中完全保留，只是增加了业务层维度和场景化权重

---

## 6. 变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-04-27 | 初始版本，提供简单版和专业版两套方案 | AmpCon Product Team |
| v1.1 | 2026-04-27 | 基于 Cisco API / Arista CUE 文档优化：方案 A 改为设备分类聚合模型，方案 B 增加 Network Services / Infrastructure 健康 / Application Experience / 动态基线 / 阈值模式 | AmpCon Product Team |
