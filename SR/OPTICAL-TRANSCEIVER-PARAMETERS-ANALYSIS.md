# 光模块监测参数竞品分析：传统DC vs AI数据中心

| 项目 | 内容 |
|------|------|
| 文档编号 | SR-OPTICAL-PARAMS-001 |
| 版本 | v1.0 |
| 作者 | AmpCon Product Team |
| 日期 | 2026-05-19 |
| 参考竞品 | Arista CloudVision / EOS、NVIDIA UFM / Spectrum-X / NetQ |

---

## 一、分析背景

光模块/光链路的健康监测参数体系在**传统DC**和**AI数据中心（AIDC）**场景下存在显著差异：

- **传统DC**：以Arista CloudVision + EOS为代表，关注链路可用性、基础DDM、FEC纠错等
- **AIDC**：以NVIDIA UFM + Spectrum-X + NetQ为代表，额外关注RDMA性能、拥塞控制、GPU通信效率、高频采样等

本文系统梳理两类场景的参数体系，为AmpCon光模块健康管理能力建设提供参数选型依据。

---

## 二、传统DC代表参数（参考 Arista CloudVision / EOS）

### 2.1 参数来源说明

Arista EOS 提供完整的 Transceiver Performance Monitoring 能力，通过 CloudVision 平台实现流式遥测（State Streaming Telemetry）上报和历史存储。参数通过 `show interfaces transceiver dom` 系列命令获取，支持 gNMI 流式上报。

> 参考来源：[Arista EOS Transceiver Performance Monitoring](https://www.arista.com/en/um-eos/eos-transceiver-performance-monitoring)（Content was rephrased for compliance with licensing restrictions）

### 2.2 基础DDM参数（所有光模块通用）

| 参数名称 | 单位 | 说明 | 告警阈值支持 | 采集粒度 |
|----------|------|------|-------------|----------|
| **Temperature** | °C | 模块壳体温度 | High Alarm/Warn, Low Alarm/Warn | 模块级 |
| **Voltage** | V | 模块供电电压 | High Alarm/Warn, Low Alarm/Warn | 模块级 |
| **TX Bias Current** | mA | 发射激光器偏置电流 | High Alarm/Warn, Low Alarm/Warn | 逐Lane |
| **Optical TX Power** | dBm | 发射光功率 | High Alarm/Warn, Low Alarm/Warn | 逐Lane |
| **Optical RX Power** | dBm | 接收光功率 | High Alarm/Warn, Low Alarm/Warn | 逐Lane |

### 2.3 PAM4高速信号质量参数（100G/400G+）

| 参数名称 | 单位 | 说明 | 告警阈值支持 | 采集粒度 |
|----------|------|------|-------------|----------|
| **SNR (Signal-to-Noise Ratio)** | dB | 信噪比，PAM4信号质量核心指标 | High/Low Alarm/Warn | 逐Lane |
| **Residual ISI** | ps/nm | 残余码间干扰 | High/Low Alarm/Warn | 逐Lane |
| **Level Transitions** | 计数 | PAM4电平跳变参数 | High/Low Alarm/Warn | 逐Lane |
| **TEC Current Error** | mA | 热电冷却器电流误差 | High/Low Alarm/Warn | 逐Lane |
| **Frequency Error** | GHz | 激光频率偏差 | High/Low Alarm/Warn | 逐Lane |

### 2.4 FEC/BER误码参数

| 参数名称 | 单位 | 说明 | 统计方式 | 采集粒度 |
|----------|------|------|---------|----------|
| **Pre-FEC BER** | 比率 | FEC纠错前误码率 | avg/min/max | 模块级或逐Lane |
| **Uncorrected BER (Post-FEC)** | 比率 | FEC无法纠正的误码率 | avg/min/max | 模块级 |
| **Host Pre-FEC BER** | 比率 | 主机侧FEC前误码率 | avg/min/max | 逐Lane |
| **Host Post-FEC Errored Frames Ratio** | 比率 | 主机侧FEC后错误帧比率 | avg/min/max | 逐Lane |
| **Media Pre-FEC BER** | 比率 | 媒体侧（光纤侧）FEC前误码率 | avg/min/max | 逐Channel |
| **Media Post-FEC Errored Frames Ratio** | 比率 | 媒体侧FEC后错误帧比率 | avg/min/max | 逐Channel |

### 2.5 相干光（400G-ZR/ZR+）专用参数

| 参数名称 | 单位 | 说明 | 适用场景 |
|----------|------|------|----------|
| **Chromatic Dispersion** | ps/nm | 色散（短链路） | DCI/长距 |
| **Differential Group Delay (DGD)** | ps | 差分群延迟 | DCI/长距 |
| **SOPMD** | ps² | 二阶偏振模色散 | DCI/长距 |
| **Polarization Dependent Loss (PDL)** | dB | 偏振相关损耗 | DCI/长距 |
| **Received OSNR Estimate** | dB | 接收端光信噪比估计 | DCI/长距 |
| **Received ESNR Estimate** | dB | 接收端电信噪比估计 | DCI/长距 |
| **Carrier Frequency Offset** | MHz | 载波频率偏移 | DCI/长距 |
| **SOP Rate of Change** | krad/s | 偏振态变化速率 | DCI/长距 |
| **Laser Temperature** | °C | 激光器温度 | DCI/长距 |
| **Laser Frequency** | GHz | 激光器实际频率 | DWDM |

### 2.6 CloudVision Performance Monitoring 统计机制

| 特性 | 说明 |
|------|------|
| **采样周期** | 默认15分钟，可配置（秒/分/时/天） |
| **采样间隔** | 主机每6秒读取一次模块诊断参数 |
| **统计维度** | 每个周期内记录 avg / min / max |
| **阈值越限计数** | 记录 High Alarm/Warn exceeded 次数 |
| **历史保留** | 当前周期 + 上一个完整周期 |
| **告警指示** | ALARM / WARN 状态标记 |
| **流式上报** | 通过 TerminAttr 代理流式上报到 CloudVision |
| **查询方式** | AQL (Advanced Query Language) + gNMI |

---

## 三、AI数据中心补充参数（参考 NVIDIA UFM / Spectrum-X / NetQ）

### 3.1 参数来源说明

NVIDIA 在 AI Fabric 场景下提供多层次遥测体系：
- **UFM (Unified Fabric Manager)**：InfiniBand/Ethernet Fabric 级遥测，120+ 唯一计数器
- **Spectrum-X + NetQ**：AI Factory 专用以太网遥测，高频采样 + RDMA 可视化
- **mlxlink**：设备级链路诊断工具
- **DTS (Data Transfer Service)**：SuperNIC 侧遥测

> 参考来源：[NVIDIA UFM Telemetry Fields](https://docs.nvidia.com/networking/display/ufmenterpriseumv6241/Low-Frequency-(Secondary)-Telemetry-Fields)、[NVIDIA Spectrum-X AI Factory Telemetry Blog](https://developer.nvidia.com/blog/next-generation-ai-factory-telemetry-with-nvidia-spectrum-x-ethernet/)（Content was rephrased for compliance with licensing restrictions）

### 3.2 NVIDIA UFM 光模块/线缆遥测参数

#### 3.2.1 光功率与环境（逐Lane，最多8 Lane）

| 参数名称 | 单位 | 说明 | 采集频率 |
|----------|------|------|---------|
| **rx_power_lane_[0-7]** | dBm | 每Lane接收光功率 | 300s（低频） |
| **tx_power_lane_[0-7]** | dBm | 每Lane发射光功率 | 300s（低频） |
| **Module_Voltage** | V | 模块内部供电电压 | 300s |
| **Module_Temperature** | °C | 模块温度 | 300s |
| **Chip_Temp** | °C | 交换芯片温度 | 300s |
| **Temperature** | °C | 线缆温度 | 300s |
| **Temp_flags** | 标志位 | 模块温度锁存告警标志 | 300s |
| **Vcc_flags** | 标志位 | 模块电压锁存告警标志 | 300s |

#### 3.2.2 SNR信噪比（AI场景关键参数）

| 参数名称 | 单位 | 说明 | 采集频率 |
|----------|------|------|---------|
| **snr_media_lane_[0-7]** | dB (1/256精度) | 媒体侧每Lane SNR，取三个眼图SNR最小值 | 300s |
| **snr_host_lane_[0-7]** | dB (1/256精度) | 主机侧每Lane SNR，取三个眼图SNR最小值 | 300s |

#### 3.2.3 BER误码率（多层次）

| 参数名称 | 说明 | 统计方式 | 采集频率 |
|----------|------|---------|---------|
| **Total_Raw_BER** | Pre-FEC 原始误码率 | 实时值 | 30s（高频） |
| **Effective_BER** | Post-FEC 有效误码率 | 实时值 | 30s（高频） |
| **Symbol_BER** | 经过所有物理层纠错后的符号误码率（含FEC+PLR） | 实时值 | 30s（高频） |
| **Raw_Errors_Lane_[0-3]** | 每Lane原始错误比特数 | 累计计数 | 30s（高频） |
| **Effective_Errors** | FEC未纠正的错误比特数 | 累计计数 | 30s |
| **Symbol_Errors** | 物理层纠错后仍存在的错误 | 累计计数 | 30s |
| **last_raw_ber / max_raw_ber / min_raw_ber** | 最近/最大/最小原始BER | 窗口统计 | 300s |
| **last_eff_ber / max_eff_ber / min_eff_ber** | 最近/最大/最小有效BER | 窗口统计 | 300s |
| **last_symbol_ber / max_symbol_ber / min_symbol_ber** | 最近/最大/最小符号BER | 窗口统计 | 300s |
| **EEBER** | 从RS-FEC直方图估算的有效BER | 估算值 | 300s |

#### 3.2.4 FEC直方图（AI场景独特能力）

| 参数名称 | 说明 | 采集频率 |
|----------|------|---------|
| **hist[0-15]** | FEC块中RS-FEC符号错误数量分布直方图（16个桶） | 低频hist[0-15]：300s |
| **hist[0-4]** | 高频FEC直方图（5个桶） | 高频：30s |

> **AI场景价值**：FEC直方图可以揭示错误分布模式——均匀分布表示随机噪声，集中在高桶表示突发错误（可能是线缆/连接器问题）。

#### 3.2.5 链路状态与CDR锁定

| 参数名称 | 说明 | 采集频率 |
|----------|------|---------|
| **tx_cdr_lol** | 发射侧CDR失锁标志（逐Lane位图） | 300s |
| **rx_cdr_lol** | 接收侧CDR失锁标志（逐Lane位图） | 300s |
| **tx_los** | 发射侧信号丢失标志（逐Lane位图） | 300s |
| **rx_los** | 接收侧信号丢失标志（逐Lane位图） | 300s |
| **Link_Down** | 链路Down次数 | 30s（高频） |
| **Link_Down_IB** | 训练状态机失败导致的链路Down次数 | 300s |
| **LinkErrorRecoveryCounter** | 链路错误恢复成功次数 | 30s（高频） |
| **fast_link_up_status** | 是否执行了快速链路建立 | 300s |
| **time_to_link_up_ext_msec** | 从禁用到物理层Up的时间（ms） | 300s |

#### 3.2.6 BER告警计数

| 参数名称 | 说明 | 采集频率 |
|----------|------|---------|
| **num_of_raw_ber_alarms** | 原始BER越限告警窗口数 | 300s |
| **num_of_eff_ber_alarms** | 有效BER越限告警窗口数 | 300s |
| **num_of_symbol_ber_alarms** | 符号BER越限告警窗口数 | 300s |

### 3.3 NVIDIA AI Fabric 网络层遥测参数（与光模块健康强相关）

#### 3.3.1 PLR（Packet Level Retransmission）重传参数

| 参数名称 | 说明 | AI场景意义 |
|----------|------|-----------|
| **PlrRcvCodes** | 接收的PLR码字数 | 链路质量基线 |
| **PlrRcvCodeErr** | 被拒绝的码字数 | 链路错误严重度 |
| **PlrRcvUncorrectableCode** | 不可纠正码字数 | 严重链路问题指示 |
| **PlrXmitCodes** | 发送的PLR码字数 | 链路质量基线 |
| **PlrXmitRetryCodes** | 重传码字数 | 重传开销 |
| **PlrXmitRetryEvents** | 重传事件数 | 重传频率 |
| **PlrSyncEvents** | 同步事件数 | 链路稳定性 |
| **HiRetransmissionRate** | 因重传导致的带宽损失 | 直接影响AI训练效率 |
| **PlrXmitRetryCodesWithinTSecMax** | T秒窗口内最大重传事件数 | 突发重传检测 |

#### 3.3.2 RoCE/RDMA 相关参数（SuperNIC/DTS侧）

| 参数名称 | 说明 | AI场景意义 |
|----------|------|-----------|
| **roce_adp_retrans** | RoCE自适应路由重传计数 | GPU通信效率直接指标 |
| **PortXmitWait** | 出口端口因缺少信用/仲裁等待时间 | 拥塞指示 |
| **PortXmitDiscards** | 出口丢包数（端口Down或拥塞） | 丢包检测 |
| **PortRcvErrors** | 接收错误包数 | 链路质量 |
| **SymbolErrorCounter** | 符号错误计数 | 物理层质量 |

#### 3.3.3 链路Down原因分析

| 参数名称 | 说明 | AI场景意义 |
|----------|------|-----------|
| **down_blame** | 哪一侧接收器导致了最近一次链路Down | 故障定责 |
| **local_reason_opcode** | 本地链路Down原因码 | 根因分析 |
| **remote_reason_opcode** | 远端链路Down原因码 | 根因分析 |
| **e2e_reason_opcode** | 端到端链路Down原因码 | 综合判断 |
| **Advanced_Status_Opcode** | PHY固件状态指示码 | 固件级诊断 |
| **Status_Message** | ASCII状态消息 | 人可读诊断信息 |

#### 3.3.4 线缆/模块资产信息

| 参数名称 | 说明 | AI场景意义 |
|----------|------|-----------|
| **Cable_PN** | 厂商料号 | 批次追踪 |
| **Cable_SN** | 序列号 | 单体追踪 |
| **cable_technology** | 线缆技术类型 | 兼容性管理 |
| **cable_type** | 线缆/模块类型 | 分类管理 |
| **cable_vendor** | 厂商 | 供应商管理 |
| **cable_length** | 线缆长度 | 链路规划 |
| **cable_fw_version** | 线缆/模块固件版本 | 固件管理 |
| **vendor_rev** | 厂商硬件版本 | 版本追踪 |

### 3.4 NVIDIA Spectrum-X AI Factory 遥测特色能力

| 能力 | 说明 | 传统DC对比 |
|------|------|-----------|
| **高频采样（30s）** | 关键计数器每30秒采集一次 | 传统DC通常5-15分钟 |
| **120+ 唯一计数器** | 每端口采集超过120种指标 | 传统DC通常20-30种 |
| **FEC直方图** | 16桶错误分布分析 | 传统DC仅有BER数值 |
| **PLR重传监测** | 物理层重传机制全面可视 | 传统DC无此概念 |
| **链路Down根因** | 自动判定故障侧和原因码 | 传统DC需人工排查 |
| **SNR逐Lane（8Lane）** | 支持800G/8×100G逐Lane SNR | 传统DC多为模块级 |
| **BER三层分离** | Raw/Effective/Symbol三层BER | 传统DC仅Pre/Post-FEC |
| **AI工作负载关联** | 网络遥测与GPU/NCCL性能关联 | 传统DC无此能力 |
| **OpenTelemetry + gNMI** | 开放标准接口 | 传统DC多为私有协议 |

---

## 四、传统DC vs AIDC 参数体系对比总览

### 4.1 参数覆盖度对比

| 参数类别 | 传统DC（CloudVision） | AIDC（NVIDIA UFM/Spectrum-X） | AmpCon建议 |
|----------|---------------------|-------------------------------|-----------|
| **基础DDM（温度/电压/光功率）** | ✅ 完整支持 | ✅ 完整支持 | P0 必须覆盖 |
| **TX Bias Current** | ✅ 逐Lane | ✅ 逐Lane | P0 |
| **Pre-FEC BER** | ✅ avg/min/max | ✅ 实时+窗口统计 | P0 |
| **Post-FEC BER** | ✅ avg/min/max | ✅ Effective BER + Symbol BER | P0 |
| **SNR（信噪比）** | ✅ 逐Lane | ✅ 逐Lane（媒体侧+主机侧分离） | P0 |
| **PAM4 Level Transitions** | ✅ 支持 | — （通过SNR覆盖） | P1 |
| **Residual ISI** | ✅ 支持 | — | P2 |
| **TEC Current Error** | ✅ 支持 | — | P2 |
| **Frequency Error** | ✅ 支持 | — | P1 |
| **相干光参数（CD/DGD/PDL/OSNR）** | ✅ 完整支持 | — （AIDC多用短距） | P1（DCI场景） |
| **FEC直方图** | ❌ 不支持 | ✅ 16桶分布 | P1（AI场景差异化） |
| **逐Lane错误计数** | ❌ 仅BER | ✅ Raw_Errors_Lane_[0-3] | P1 |
| **PLR重传参数** | ❌ 不适用 | ✅ 完整PLR体系 | P1（AI场景） |
| **CDR LOL / LOS标志** | ❌ 不直接暴露 | ✅ 逐Lane位图 | P1 |
| **链路Down根因分析** | ❌ 需人工 | ✅ down_blame + reason_opcode | P0 |
| **BER告警计数** | ✅ exceeded count | ✅ 三层BER告警计数 | P0 |
| **RoCE/RDMA重传** | ❌ 不适用 | ✅ roce_adp_retrans | P0（AI场景） |
| **拥塞指标（XmitWait）** | ❌ 不关注 | ✅ PortXmitWait | P0（AI场景） |
| **线缆资产信息** | 部分支持 | ✅ 完整（PN/SN/FW/Vendor） | P0 |
| **AI工作负载关联** | ❌ | ✅ NCCL/GPU性能关联 | P2（长期） |

### 4.2 采集机制对比

| 维度 | Arista CloudVision | NVIDIA UFM/Spectrum-X | AmpCon建议 |
|------|-------------------|----------------------|-----------|
| **高频采集周期** | 6秒（设备侧） | 30秒（高频计数器） | 30秒 |
| **低频采集周期** | 15分钟（PM统计） | 300秒（低频计数器） | 5分钟 |
| **统计方式** | avg/min/max per period | 实时值 + 窗口min/max | 两者结合 |
| **历史保留** | 当前+上一周期 | 时序数据库长期存储 | 时序数据库 |
| **上报协议** | gNMI（State Streaming） | OTLP / gNMI / gRPC | gNMI + REST |
| **告警机制** | 四级阈值（HA/HW/LW/LA） | BER窗口告警 + 事件 | 四级阈值 + 趋势 |

### 4.3 参数分层架构建议

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    AmpCon 光模块参数分层架构                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Layer 4: AI工作负载层（长期目标）                                         │
│  ├─ GPU训练效率关联                                                       │
│  ├─ NCCL AllReduce 性能关联                                              │
│  └─ Job Completion Time 影响分析                                         │
│                                                                          │
│  Layer 3: 网络传输层（AI场景P0）                                          │
│  ├─ RoCE重传计数 (roce_adp_retrans)                                      │
│  ├─ 拥塞指标 (PortXmitWait, PFC/ECN计数)                                │
│  ├─ PLR重传 (PlrXmitRetryCodes, HiRetransmissionRate)                   │
│  └─ 丢包/错误 (PortXmitDiscards, PortRcvErrors)                         │
│                                                                          │
│  Layer 2: 物理信号层（传统DC + AI共用P0）                                 │
│  ├─ BER三层 (Raw/Effective/Symbol)                                       │
│  ├─ FEC直方图 (hist[0-15])                                               │
│  ├─ SNR逐Lane (media + host)                                            │
│  ├─ CDR LOL / LOS 标志                                                   │
│  ├─ 链路Down根因 (down_blame, reason_opcode)                             │
│  └─ 相干光参数 (CD/DGD/PDL/OSNR) — DCI场景                              │
│                                                                          │
│  Layer 1: 基础环境层（所有场景P0）                                        │
│  ├─ DDM五参数 (Temp/Voltage/TxPower/RxPower/BiasCurrent)                 │
│  ├─ 四级阈值告警 (HA/HW/LW/LA)                                          │
│  ├─ 线缆资产 (PN/SN/Vendor/FW/Length/Type)                              │
│  └─ 链路状态 (Up/Down, Link Speed, FEC Mode)                            │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 五、AmpCon 参数选型建议

### 5.1 第一阶段：基础能力（传统DC对标 CloudVision）

**目标**：覆盖传统DC场景的核心监测需求

| # | 参数 | 优先级 | 采集频率 | 说明 |
|---|------|--------|---------|------|
| 1 | Temperature | P0 | 5min | 模块温度 |
| 2 | Voltage | P0 | 5min | 供电电压 |
| 3 | TX Power (逐Lane) | P0 | 5min | 发射光功率 |
| 4 | RX Power (逐Lane) | P0 | 5min | 接收光功率 |
| 5 | TX Bias Current (逐Lane) | P0 | 5min | 偏置电流 |
| 6 | Pre-FEC BER | P0 | 1min | FEC前误码率 |
| 7 | Post-FEC BER | P0 | 1min | FEC后误码率 |
| 8 | 四级阈值告警 | P0 | 实时 | HA/HW/LW/LA |
| 9 | 链路状态 (Up/Down) | P0 | 实时 | 链路可用性 |
| 10 | 线缆资产信息 | P0 | 按需 | PN/SN/Vendor/Type |

### 5.2 第二阶段：信号质量深度（对标 CloudVision 高级能力）

**目标**：覆盖高速率（100G/400G/800G）场景的信号质量监测

| # | 参数 | 优先级 | 采集频率 | 说明 |
|---|------|--------|---------|------|
| 11 | SNR (逐Lane) | P0 | 5min | PAM4信号质量核心 |
| 12 | Frequency Error | P1 | 5min | 激光频率偏差 |
| 13 | CDR LOL (逐Lane) | P1 | 实时 | 时钟恢复失锁 |
| 14 | LOS (逐Lane) | P1 | 实时 | 信号丢失 |
| 15 | BER avg/min/max统计 | P1 | 15min周期 | 周期性统计 |
| 16 | 阈值越限计数 | P1 | 15min周期 | 告警频率分析 |
| 17 | 相干光参数（CD/OSNR/PDL） | P1 | 5min | DCI场景 |
| 18 | Link Down次数 | P0 | 实时 | 链路稳定性 |

### 5.3 第三阶段：AI场景增强（对标 NVIDIA UFM/Spectrum-X）

**目标**：覆盖AIDC场景的独特监测需求，形成差异化

| # | 参数 | 优先级 | 采集频率 | 说明 |
|---|------|--------|---------|------|
| 19 | FEC直方图 (hist[0-15]) | P0 | 30s | 错误分布模式分析 |
| 20 | Symbol BER（三层BER） | P0 | 30s | 全纠错后残余错误 |
| 21 | 逐Lane错误计数 | P0 | 30s | 定位问题Lane |
| 22 | PLR重传计数 | P1 | 30s | 物理层重传开销 |
| 23 | HiRetransmissionRate | P0 | 30s | 带宽损失直接指标 |
| 24 | RoCE重传 (roce_adp_retrans) | P0 | 30s | RDMA效率 |
| 25 | PortXmitWait | P0 | 30s | 拥塞等待时间 |
| 26 | down_blame | P1 | 事件触发 | 故障定责 |
| 27 | reason_opcode | P1 | 事件触发 | 根因分析 |
| 28 | SNR media + host 分离 | P1 | 5min | 定位问题在光纤侧还是主机侧 |
| 29 | time_to_link_up | P2 | 事件触发 | 链路恢复速度 |
| 30 | BER告警窗口计数 | P1 | 5min | 告警频率趋势 |

---

## 六、关键差异化洞察

### 6.1 NVIDIA 在 AI 场景的独特设计理念

| 设计理念 | 具体体现 | 对AmpCon的启示 |
|----------|---------|---------------|
| **三层BER分离** | Raw → Effective → Symbol，逐层剥离纠错效果 | 不能只看Pre/Post-FEC，需要看全纠错后的残余错误 |
| **FEC直方图** | 不只看BER数值，看错误分布模式 | 均匀分布=随机噪声，集中=突发问题，可辅助根因判断 |
| **PLR可视化** | 物理层重传是AI Fabric的"隐形开销" | 重传率直接影响有效带宽，是AI训练效率的隐藏杀手 |
| **故障定责自动化** | down_blame + reason_opcode 自动判定 | 减少人工排障时间，对大规模集群至关重要 |
| **高频采样** | 30秒级关键计数器采集 | AI工作负载对瞬态问题敏感，低频采样会漏掉关键事件 |
| **网络-计算关联** | 网络遥测与GPU/NCCL性能数据关联分析 | 最终目标是证明"网络问题导致了训练变慢" |

### 6.2 CloudVision 在传统DC的成熟设计

| 设计理念 | 具体体现 | 对AmpCon的启示 |
|----------|---------|---------------|
| **四级阈值体系** | High Alarm/Warn + Low Alarm/Warn | 标准化告警分级，用户可自定义阈值 |
| **周期性统计** | 每个PM周期内的avg/min/max | 趋势分析的基础数据结构 |
| **相干光全参数** | CD/DGD/PDL/OSNR/ESNR/CFO/SOP | DCI场景不可或缺 |
| **State Streaming** | 设备状态变化即时推送 | 比轮询更高效，延迟更低 |
| **AQL查询语言** | 结构化遥测数据查询 | 为高级用户提供灵活分析能力 |

---

## 七、总结与建议

### 7.1 一句话总结

> **传统DC关注"链路能不能用"，AI DC关注"链路用得好不好"。**

- 传统DC参数体系围绕**可用性**设计：链路是否Up、光功率是否正常、BER是否越限
- AIDC参数体系围绕**效率**设计：重传开销多大、拥塞等待多久、哪个Lane在拖后腿

### 7.2 AmpCon 策略建议

| 策略 | 说明 |
|------|------|
| **传统DC参数全覆盖** | 对标CloudVision，这是基本功，不能有短板 |
| **AI参数重点突破** | FEC直方图 + 三层BER + PLR重传 + 拥塞指标，形成AIDC差异化 |
| **采集频率分级** | 基础参数5min，关键BER/拥塞30s，状态变化实时推送 |
| **故障定责自动化** | 借鉴NVIDIA的down_blame机制，减少人工排障 |
| **参数-业务关联** | 长期目标：将光模块健康与AI训练效率关联，证明因果关系 |

---

## 八、参考资料

- [Arista EOS Transceiver Performance Monitoring](https://www.arista.com/en/um-eos/eos-transceiver-performance-monitoring)
- [Arista CloudVision Telemetry & Analytics](https://www.arista.com/en/solutions/telemetry-analytics)
- [Arista EOS FEC Traffic Analyzer](https://www.arista.com/en/support/toi/tag/forward-error-correction)
- [NVIDIA UFM Enterprise Telemetry - Low-Frequency Fields](https://docs.nvidia.com/networking/display/ufmenterpriseumv6241/Low-Frequency-(Secondary)-Telemetry-Fields)
- [NVIDIA UFM Enterprise Telemetry - High-Frequency Fields](https://docs.nvidia.com/networking/display/ufmenterpriseumv62320/high-frequency-(primary)-telemetry-fields)
- [NVIDIA Spectrum-X AI Factory Telemetry Blog](https://developer.nvidia.com/blog/next-generation-ai-factory-telemetry-with-nvidia-spectrum-x-ethernet/)
- [NVIDIA UFM Telemetry for InfiniBand Cluster Bring-up](https://docs.nvidia.com/networking/display/infinibandclusterbringupprocedure/UFM-Telemetry)
- [NVIDIA mlxlink Utility](https://docs.nvidia.com/networking/display/MFTv4280/mlxlink+Utility)
- [NVIDIA OpenTelemetry Best Practices](https://docs.nvidia.com/networking-ethernet-software/knowledge-base/Configuration-and-Usage/Monitoring/OpenTelemetry-Best-Practices/)

> Content was rephrased for compliance with licensing restrictions. Information synthesized from multiple official documentation sources.

---

## 九、变更记录

| 版本 | 日期 | 变更内容 | 作者 |
|------|------|----------|------|
| v1.0 | 2026-05-19 | 初始版本 | AmpCon Product Team |
