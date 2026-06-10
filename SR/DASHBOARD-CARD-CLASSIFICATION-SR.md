# 竞品 Dashboard 数据卡片分类与核心指标分析

| 项目 | 内容 |
|------|------|
| 文档编号 | SR-AMPCON-COMPETITOR-DASH-001 |
| 版本 | v1.1 |
| 日期 | 2026-05-20 |
| 分析对象 | NVIDIA UFM, Arista CloudVision (CVP/CV-CUE), Juniper Apstra |
| 重点场景 | 云数据中心(Cloud DC) + AI数据中心(AIDC) |

图例说明:
- [Y] = 支持/能力较强
- [YY] = 核心能力/深度支持
- [N] = 不支持/无此能力

---

## 1. NVIDIA UFM -- Fabric Dashboard

> 来源: UFM Enterprise User Manual v6.19.4+
> 定位: InfiniBand / RoCE 高性能网络 Fabric 管理平台, 专注 AI/HPC 数据中心

### 1.1 Dashboard 分类体系

UFM 将 Dashboard 面板分为 3 大类共 12+ 面板, 按数据域组织:

**分类一: Health(健康)**

| 面板名称 | 可视化形式 | 核心内容 | 交互能力 |
|----------|-----------|----------|----------|
| Inventory Summary | 柱状图 | 按 severity 或 firmware 版本分类展示 HCA/Switch/Gateway/Router/Cable 数量 | 点击柱状图跳转到对应设备表 |
| Fabric Utilization (Fabric Health) | 饼图 | 按告警严重度(Critical/Minor/Warning/Normal)分类的设备数量分布 | 点击饼图切片筛选对应 severity 的设备列表 |

**分类二: Monitoring(监控)**

| 面板名称 | 可视化形式 | 核心内容 | 交互能力 |
|----------|-----------|----------|----------|
| Top N Servers by Rx/Tx BW | 列表+柱状图双视图 | 按 Rx 或 Tx 带宽(MB/s)排名的服务器 | 切换 List/Bar 视图; 切换 Tx/Rx; N=5/10/15/20; 右键跳转设备详情 |
| Top N Switches by Rx/Tx BW | 列表+柱状图双视图 | 按 Rx 或 Tx 带宽(MB/s)排名的交换机 | 同上; 支持按端口/设备维度切换 |
| Top N Congested Servers | 列表+柱状图双视图 | 按拥塞带宽百分比(CBW%)排名的服务器 | 切换 RCBW/TCBW; N=5/10/15/20 |
| Top N Congested Switches | 列表+柱状图双视图 | 按拥塞带宽百分比(CBW%)排名的交换机 | 同上 |
| Top N Utilized PKeys | 列表+柱状图双视图 | 按成员数排名的 Partition Key | N=5/10/15/20 |
| Network Traffic Map | 分层双柱状图 | 按 4 个 Tier 展示 BW(绿) vs CBW(红), 每个 bar 含 min/avg/max | 点击 info 图标查看 Tier 拓扑说明 |
| Levels Traffic Map | 分层流量图 | 按设备 Level(Server/Leaf/Spine/Core)展示流量分布 | Level 名称可配置 |

**分类三: Events & Alarms(事件与告警)**

| 面板名称 | 可视化形式 | 核心内容 | 交互能力 |
|----------|-----------|----------|----------|
| Top N Alarmed Servers | 列表+柱状图双视图 | 按告警数量排名的服务器, 按 severity 排序 | N=5/10/15/20; 支持筛选 |
| Top N Alarmed Switches | 列表+柱状图双视图 | 按告警数量排名的交换机 | 同上 |
| Recent Activities | 事件流列表 | 实时事件列表, 显示时间/severity/描述 | 下拉筛选: All/All Issues/Info/Minor/Warning/Critical |
| Events History | 计数表格 | 拓扑变更事件(Device/Link Status)的计数统计 | 支持时间区间筛选; 点击计数跳转事件详情 |

### 1.2 Dashboard 交互与管理特性

| 特性 | 详细说明 |
|------|----------|
| 多 View 管理 | 支持创建多个 Dashboard View, 每个 View 可包含不同面板组合; 可设置默认 View |
| Add Panel | 点击 Add Panel 按钮弹出面板选择弹窗, 勾选需要的面板添加到当前 View |
| 面板布局 | 面板支持拖拽排列和边框拖拽调整大小 |
| 时间线快照 | 登录后每 30 秒自动记录 Dashboard 数据快照, 用户可通过时间线滑块回放历史状态 |
| Top N 切换 | 所有 Top N 面板支持下拉选择 N=5/10/15/20, 默认 10 |
| 双视图切换 | 每个 Top N 面板支持 List View(表格行) 和 Bar View(柱状图) 切换 |
| 端口/设备切换 | 带宽类面板支持 View by Port 和 View by Element 切换 |
| 右键菜单 | 右键设备可执行操作(与设备表相同); 右键端口可跳转端口详情 |
| 筛选 | 支持文本筛选 toggle, 快速过滤面板内容 |


### 1.3 核心遥测指标详细清单

#### 1.3.1 高频遥测(Primary Telemetry, 默认 30s 采集)

> 约 30 个关键性能 Counter, 用于实时监控、Dashboard 图表、端口阈值事件检测

**带宽指标:**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| PortXmitDataExtended | 字节数/周期 | 出端口在采样周期内发送的字节数 | Top N by Tx BW |
| PortRcvDataExtended | 字节数/周期 | 入端口在采样周期内接收的字节数 | Top N by Rx BW |
| PortXmitPktsExtended | 包数 | 出端口发送的总包数 | 流量分析 |
| PortRcvPktsExtended | 包数 | 入端口接收的总包数 | 流量分析 |
| Normalized_XmitData | 百分比 | 归一化发送数据(相对线速) | Traffic Map |

**拥塞指标(AIDC 核心):**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| PortXmitWaitExtended | 时间 ticks | 出端口因缺少 credit 或仲裁而等待发送的时间 | Top N Congested; 拥塞趋势 |
| infiniband_CBW | 字节数/秒 | 拥塞带宽绝对值 | Traffic Map CBW bar |
| Normalized_CBW | 百分比 | 归一化拥塞带宽(相对线速百分比) | Top N Congested by CBW% |
| NormalizedXW | 百分比 | 归一化 XmitWait | 拥塞严重度评估 |

**错误指标:**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| SymbolErrorCounterExtended | 计数 | 物理层未被纠正的错误 bit 数 | 链路质量监控 |
| PortRcvErrorsExtended | 计数 | 接收到的包含错误的包总数 | 接口错误排名 |
| PortRcvRemotePhysicalErrorsExtended | 计数 | 接收到的 EBP 标记包数 | 远端物理错误 |
| PortRcvSwitchRelayErrorsExtended | 计数 | 因无法转发而丢弃的接收包数 | 交换转发问题 |
| PortXmitDiscardsExtended | 计数 | 因端口 Down 或拥塞而丢弃的出包数 | 丢包监控(AIDC 关键) |
| PortXmitConstraintErrorsExtended | 计数 | 因约束未发送的包数 | 策略问题 |
| PortRcvConstraintErrorsExtended | 计数 | 因约束丢弃的接收包数 | 策略问题 |
| LocalLinkIntegrityErrorsExtended | 计数 | 本地物理错误超阈值次数 | 链路完整性 |

**Buffer 指标:**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| ExcessiveBufferOverrunErrorsExtended | 计数 | 连续流控周期内 Buffer 溢出错误次数 | Buffer 健康监控 |
| VL15DroppedExtended | 计数 | VL15 因资源不足(如 Buffer 不够)丢弃的包数 | 管理通道健康 |

**链路指标:**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| LinkErrorRecoveryCounterExtended | 计数 | 链路错误恢复成功次数 | 链路稳定性 |
| LinkDownedCounterExtended | 计数 | 链路 Down 次数 | 链路抖动监控 |

**FEC 指标:**

| Counter | 类型 | 说明 | Dashboard 用途 |
|---------|------|------|---------------|
| hist[0-4] | 直方图 | RS-FEC 符号错误分布(5级), hist[i]表示有 i 个符号错误的 FEC block 数 | FEC 健康评估 |

#### 1.3.2 低频遥测(Secondary Telemetry, 默认 300s 采集)

> 约 90+ 个 Counter, 涵盖温度、光模块、BER、PLR、线缆信息等

**温度指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| Chip_Temp | 摄氏度 | 交换芯片温度 | > 105C Critical |
| Temperature | 摄氏度 | 线缆温度 | > 70C Warning |
| Module_Temperature | 摄氏度 | 光模块温度 | > 70C Warning |

**光模块指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| rx_power_lane_[0-7] | dBm | 各 lane 接收光功率(最多 8 lane) | < -10dBm Warning |
| tx_power_lane_[0-7] | dBm | 各 lane 发送光功率 | 偏离标称值 > 3dB |
| Module_Voltage | V | 模块内部供电电压 | 偏离 3.3V +/- 5% |
| snr_media_lane_[0-7] | 1/256 dB | 介质侧各 lane 信噪比 | < 阈值预警 |
| snr_host_lane_[0-7] | 1/256 dB | 主机侧各 lane 信噪比 | < 阈值预警 |
| tx_cdr_lol | Bitmask | 各 lane Tx CDR 失锁标志 | 任意 bit=1 告警 |
| rx_cdr_lol | Bitmask | 各 lane Rx CDR 失锁标志 | 任意 bit=1 告警 |
| tx_los | Bitmask | 各 lane Tx 信号丢失标志 | 任意 bit=1 告警 |
| rx_los | Bitmask | 各 lane Rx 信号丢失标志 | 任意 bit=1 告警 |
| Temp_flags | Bitmask | 模块温度告警标志(锁存) | 非零告警 |
| Vcc_flags | Bitmask | 模块电压告警标志(锁存) | 非零告警 |

**BER(误码率)指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| Total_Raw_BER | 比率 | Pre-FEC 原始误码率 | > 1e-6 Warning |
| Effective_BER | 比率 | Post-FEC 有效误码率(FEC 纠错后残余) | > 1e-12 Critical |
| Symbol_BER | 比率 | 物理层所有纠错机制后的符号误码率 | > 1e-15 Critical |
| last_raw_ber | 比率 | 最近一次采样的原始 BER | -- |
| max_raw_ber | 比率 | 观测窗口内最大原始 BER | 趋势恶化预警 |
| min_raw_ber | 比率 | 观测窗口内最小原始 BER | -- |
| last_eff_ber | 比率 | 最近一次有效 BER | -- |
| max_eff_ber | 比率 | 观测窗口内最大有效 BER | -- |
| min_eff_ber | 比率 | 观测窗口内最小有效 BER | -- |
| num_of_raw_ber_alarms | 计数 | 原始 BER 越限告警窗口数 | > 0 关注 |
| num_of_eff_ber_alarms | 计数 | 有效 BER 越限告警窗口数 | > 0 关注 |
| num_of_symbol_ber_alarms | 计数 | 符号 BER 越限告警窗口数 | > 0 关注 |
| EEBER | 比率 | 从 RS-FEC 直方图估算的有效 BER | -- |
| hist[0-15] | 直方图 | 16 级 RS-FEC 符号错误分布(比高频的 5 级更精细) | 分布偏移预警 |

**PLR(Packet Level Retransmission)指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| PlrRcvCodes | 计数 | 接收的 PLR 码字总数 | -- |
| PlrRcvCodeErr | 计数 | 接收的错误 PLR 码字数 | > 0 关注 |
| PlrRcvUncorrectableCode | 计数 | 接收的不可纠正码字数 | > 0 Critical |
| PlrXmitCodes | 计数 | 发送的 PLR 码字总数 | -- |
| PlrXmitRetryCodes | 计数 | 重传的码字数 | 持续增长告警 |
| PlrXmitRetryEvents | 计数 | 重传事件数 | 持续增长告警 |
| PlrSyncEvents | 计数 | 同步事件数 | -- |
| HiRetransmissionRate | 百分比 | 因码字重传导致的接收带宽损失 | > 1% Warning |
| PlrXmitRetryCodesWithinTSecMax | 计数 | T 秒窗口内最大重传事件数 | 突发重传检测 |

**链路详情指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| Link_Down | 计数 | 链路 Down 次数(性能计数器) | > 0 告警 |
| Link_Down_IB | 计数 | 链路训练失败导致的 Down 次数 | > 0 告警 |
| fast_link_up_status | 0/1 | 是否执行了快速链路恢复 | -- |
| time_to_link_up_ext_msec | 毫秒 | 从 disable 到 phy up 的恢复时间 | > 1000ms Warning |
| down_blame | 标识 | 导致最近一次链路 Down 的接收端 | 定位故障侧 |
| local_reason_opcode | 操作码 | 本地链路 Down 原因码 | 故障分类 |
| remote_reason_opcode | 操作码 | 远端链路 Down 原因码 | 故障分类 |
| e2e_reason_opcode | 操作码 | 端到端链路 Down 原因码 | 故障分类 |
| Link_speed_active | 速率 | 当前活跃链路速率 | 低于预期告警 |
| Link_width_active | 宽度 | 当前活跃链路宽度 | 低于预期告警 |
| Active_FEC | 类型 | 当前活跃 FEC 类型 | -- |

**线缆/模块信息:**

| Counter | 类型 | 说明 | 用途 |
|---------|------|------|------|
| Cable_PN | 文本 | 线缆/模块型号 | 资产管理 |
| Cable_SN | 文本 | 线缆/模块序列号 | 资产追踪 |
| cable_technology | 文本 | 线缆技术(光纤/铜缆/AOC) | 分类统计 |
| cable_type | 文本 | 线缆/模块类型 | 分类统计 |
| cable_length | 数值 | 线缆长度 | 布线管理 |
| cable_vendor | 文本 | 线缆厂商 | 供应商管理 |
| cable_fw_version | 文本 | 线缆固件版本 | 固件管理 |
| FW_Version | 文本 | 设备固件版本 | 版本分布统计 |
| sw_serial_number | 文本 | 交换机序列号 | 资产追踪 |

**自适应路由(AR)指标:**

| Counter | 类型 | 说明 | 告警阈值参考 |
|---------|------|------|-------------|
| port_rcv_rn_pkt | 计数 | 接收的 AR 控制包数 | -- |
| port_xmit_rn_pkt | 计数 | 发送的 AR 控制包数 | -- |
| port_rcv_rn_error | 计数 | AR 包接收错误数 | > 0 关注 |
| port_rcv_switch_relay_rn_error | 计数 | AR 通知经交换内部 Fabric 转发失败数 | > 0 关注 |
| port_ar_trials | 计数 | 交换机尝试路由包的次数 | 高频率=拥塞 |
| pfrn_received_packet | 计数 | 接收的 PFRN 包数 | -- |
| pfrn_received_error | 计数 | 接收的 PFRN 错误包数 | > 0 关注 |
| pfrn_xmit_packet | 计数 | 发送的 PFRN 包数 | -- |
| pfrn_start_packet | 计数 | 触发 PFRN 的包数 | -- |


---

## 2. Arista CloudVision (CVP) -- Dashboard

> 来源: CloudVision Configuration Guide + CV-CUE User Guide + CloudVision Help Center
> 定位: 数据中心+园区网络统一管理平台, 基于 NetDB 状态流数据库和 Streaming Telemetry

### 2.1 Dashboard Widget 分类体系(CVP)

Arista CVP 采用按可视化类型分类的 Widget 库模式, 用户从右侧面板拖拽 Widget 到画布:

**分类一: Inputs(输入控件)**

| Widget 类型 | 说明 | 使用场景 |
|-------------|------|----------|
| Device Input | 设备选择器, 动态切换 Dashboard 数据源设备 | 一个 Dashboard 适配多台设备 |
| Interface Input | 接口选择器, 选择要监控的接口 | 接口级指标展示 |
| Time Range Input | 时间范围选择器 | 历史数据回溯 |
| Custom Input | 自定义变量输入框 | 参数化 Dashboard |

**分类二: Layouts(布局组件)**

| Widget 类型 | 说明 | 使用场景 |
|-------------|------|----------|
| Container | 容器/分组框 | 将相关 Widget 组织在一起 |
| Tabs | 标签页切换容器 | 多视图切换 |
| Section Header | 分区标题 | 视觉分隔不同区域 |

**分类三: Metrics(指标可视化)**

| Widget 类型 | 说明 | 使用场景 | 数据绑定 |
|-------------|------|----------|----------|
| Horizon Graph | 多层叠加时序面积图, 颜色深浅表示数值大小 | 接口带宽趋势、CPU/内存趋势、温度趋势 | Streaming Telemetry 时序数据 |
| Table | 表格, 支持排序和筛选 | 路由表、MAC 表、设备列表、接口列表 | 任意数据集 |
| Aggregate | 聚合柱状图, 对多设备/接口数据做聚合统计 | 设备类型统计、接口速率分布 | 聚合查询 |
| SQL (AQL Query) | 使用 Arista Query Language 自定义查询 | 高级自定义指标、复杂条件筛选 | AQL 语句 |
| Top K | Top N 排名展示 | 带宽 Top K、错误 Top K、利用率 Top K | 排序查询 |

**分类四: Summaries(汇总卡片)**

| Widget 类型 | 说明 | 使用场景 |
|-------------|------|----------|
| Single Stat | 单值大数字展示 | KPI 概览(设备总数、告警数) |
| Status Indicator | 状态指示灯/图标 | 设备状态、接口状态 |
| Event Count | 事件计数卡片 | 告警统计、事件统计 |

### 2.2 CV-CUE Dashboard 分类(园区/无线场景)

CV-CUE 按业务域分为 5 个独立 Dashboard:

**Dashboard 1: SLA Dashboard**

| Widget | 可视化形式 | 核心指标 | 交互 |
|--------|-----------|----------|------|
| SLA 百分比网格 | 表格(Green/Orange/Red 颜色编码) | 各位置的 Connectivity%/Performance%/Application%/Infrastructure%/WIPS | 点击位置下钻 |
| Set Thresholds | 配置面板 | 各 KPI 的 Green/Orange/Red 阈值配置 | 全局阈值设置 |

**Dashboard 2: Connectivity Dashboard**

| Widget | 可视化形式 | 核心指标 | 交互 |
|--------|-----------|----------|------|
| Client Journey | 漏斗图/流程图 | Total Clients - Association - Authentication - Network - Online(每阶段成功/失败数) | 点击各阶段下钻详情; 支持搜索客户端 |
| Clients by Most Failed Connections | 表格 | 客户端名/失败次数(降序) | 点击客户端跳转连接日志 |
| Top Locations Affected by Failures | 水平柱状图 | Top 5 位置的连接失败百分比 | 下拉选择失败类型(Association/Authentication/Network) |
| Baseline - Clients Affected | 趋势线 | 连接失败客户端百分比基线 | 时间范围选择 |

**Dashboard 3: Performance Dashboard**

| Widget | 可视化形式 | 核心指标 | 交互 |
|--------|-----------|----------|------|
| Client Health | 计数卡片 | Total Affected / Low RSSI / Low Data Rate / High Retry% / Sticky Clients 数量 | 点击数值跳转客户端列表 |
| Avg Latencies | 数值卡片 | DHCP / DNS / AAA / Application 平均延迟(ms) | 点击查看基线图 |
| Clients by Avg Data Rate | 柱状图(Red/Yellow/Green) | 各数据速率区间的客户端数量分布 | 阈值线标识 |
| Clients by RSSI | 柱状图(Red/Yellow/Green) | 各 RSSI 区间(-dBm)的客户端数量分布 | 阈值线标识 |
| Clients with Most Traffic | 水平柱状图 | Top 5 流量最大的客户端 | 点击客户端跳转详情 |
| Top Locations by Poor Performance | 水平柱状图 | Top 5 性能差的位置 | 下拉选择因素(Low RSSI/Low Data Rate/High Retry%/Sticky) |
| Network Usage | 组合图(折线+柱状) | 客户端关联数(线) + 流量体积(柱) | 时间范围筛选; 点击数据点下钻 |
| Baseline - Poor Performance | 趋势线 | 性能差客户端百分比基线 | 时间范围选择 |

**Dashboard 4: Applications Dashboard**

| Widget | 可视化形式 | 核心指标 | 交互 |
|--------|-----------|----------|------|
| Application Experience | 卡片组(每应用一张) | 各应用的 Good%(绿) vs Poor%(红) 体验百分比 | 点击应用下钻详情; 支持 Pin 应用到首页 |
| Clients by App Experience | 柱状图 | 各体验百分比区间的客户端数量 | 下拉选择单个应用或全部 |
| Application Traffic | 趋势图 | 应用流量趋势 | -- |
| Monitor Application Experience | 配置面板 | 选择监控的应用(最多 25 个, 含自定义应用) | 添加/删除监控应用 |

**Dashboard 5: Infrastructure Dashboard**

| Widget | 可视化形式 | 核心指标 | 交互 |
|--------|-----------|----------|------|
| Connectivity Counters | 计数卡片组 | Offline AP 数 / Missing VLANs 数 / Tunnel Down 数 / Low Power Supply 数 | 点击计数查看受影响 AP 列表 |
| Performance Counters | 计数卡片组 | High CPU(>80%) 数 / High Memory(>80%) 数 / Crashes(24h) 数 / Reboots(24h) 数 | 点击计数查看受影响 AP 列表 |
| Link Speed | 柱状图 | 各链路速率的 AP 数量分布 | 点击柱状图查看 AP 列表 |
| Power Source | 饼图 | 各电源类型的 AP 数量分布 | -- |
| Noise Floor | 柱状图 | 各底噪区间的 AP 数量分布 | -- |
| Channel Distribution | 柱状图 | 各信道的 AP 数量分布 | -- |
| Channel Utilization | 柱状图 | 各信道利用率区间的 AP 数量分布 | -- |
| CPU vs Memory by AP | 散点图 | X=CPU%, Y=Memory%, 每点=一个 AP | Hover 查看 AP 详情; 点击跳转 AP 详情页 |
| CPU vs Memory by Location | 散点图 | X=平均 CPU%, Y=平均 Memory%, 每点=一个位置 | Hover 查看位置详情; 点击查看 AP 列表 |
| APs by CPU Utilization | 柱状图(含阈值着色) | 各 CPU 利用率区间的 AP 数量(黄=超动态阈值, 红=>80%) | 点击柱状图查看 AP 列表 |
| APs by Memory Utilization | 柱状图(含阈值着色) | 各内存利用率区间的 AP 数量(黄=超动态阈值, 红=>80%) | 点击柱状图查看 AP 列表 |
| Trend - CPU/Memory Utilization | 趋势线(P25/P50/P75) | 所有 AP 的 CPU/Memory 利用率百分位趋势 | 时间范围选择 |

### 2.3 CloudVision 核心 Telemetry 数据源

**接口流量与状态:**

| 指标 | 数据类型 | 采集方式 | 说明 |
|------|----------|----------|------|
| In Octets | 字节数 | gNMI Streaming | 入方向字节数 |
| Out Octets | 字节数 | gNMI Streaming | 出方向字节数 |
| In Unicast Pkts | 包数 | gNMI Streaming | 入方向单播包数 |
| Out Unicast Pkts | 包数 | gNMI Streaming | 出方向单播包数 |
| In Errors | 计数 | gNMI Streaming | 入方向错误包数 |
| Out Errors | 计数 | gNMI Streaming | 出方向错误包数 |
| In Discards | 计数 | gNMI Streaming | 入方向丢弃包数 |
| Out Discards | 计数 | gNMI Streaming | 出方向丢弃包数 |
| CRC Errors | 计数 | gNMI Streaming | CRC 校验错误 |
| Oper Status | Up/Down | gNMI Streaming | 接口操作状态 |
| Speed | Mbps | gNMI Streaming | 接口速率 |

**设备资源:**

| 指标 | 数据类型 | 采集方式 | 说明 |
|------|----------|----------|------|
| CPU Utilization | 百分比 | gNMI Streaming | 设备 CPU 利用率 |
| Memory Used | 字节 | gNMI Streaming | 已用内存 |
| Memory Free | 字节 | gNMI Streaming | 可用内存 |
| Temperature | 摄氏度 | gNMI Streaming | 设备温度(多传感器) |
| Fan Speed | RPM | gNMI Streaming | 风扇转速 |
| PSU Status | 状态 | gNMI Streaming | 电源状态 |
| PSU Power Draw | 瓦特 | gNMI Streaming | 电源功耗 |

**路由与协议:**

| 指标 | 数据类型 | 采集方式 | 说明 |
|------|----------|----------|------|
| BGP Neighbor State | 状态枚举 | gNMI Streaming | Established/Idle/Active/Connect 等 |
| BGP Prefixes Received | 计数 | gNMI Streaming | 从邻居接收的前缀数 |
| Route Table Entries | 计数 | gNMI Streaming | IPv4/IPv6 路由表条目数 |
| EVPN Routes | 计数 | gNMI Streaming | EVPN 路由数 |
| VTEP Status | Up/Down | gNMI Streaming | VXLAN 隧道端点状态 |
| VNI Count | 计数 | gNMI Streaming | 活跃 VNI 数量 |

**光模块:**

| 指标 | 数据类型 | 采集方式 | 说明 |
|------|----------|----------|------|
| Tx Power | dBm | gNMI Streaming | 发送光功率 |
| Rx Power | dBm | gNMI Streaming | 接收光功率 |
| Optics Temperature | 摄氏度 | gNMI Streaming | 光模块温度 |
| Optics Voltage | V | gNMI Streaming | 光模块电压 |
| Bias Current | mA | gNMI Streaming | 偏置电流 |

### 2.4 Arista 关键设计理念

| 设计点 | 详细说明 |
|--------|----------|
| NetDB 状态流 | 所有设备通过 TerminAttr Agent 持续将状态流入 NetDB 数据库, 支持任意时间点的状态回溯和对比 |
| AQL 查询语言 | Arista Query Language, 类 SQL 语法, 可查询 NetDB 中的任意 Telemetry 数据 |
| 自由画布 | Dashboard 无固定网格约束, Widget 可自由拖拽定位、调整大小 |
| Dashboard Inputs | 通过 Input Widget 实现参数化, 一个 Dashboard 模板可适配不同设备/接口/时间范围 |
| 事件驱动告警 | 基于 Telemetry 数据自定义事件阈值, 触发时通知到邮件/Webhook/PagerDuty 等平台 |
| 配置即代码 | Dashboard 配置可通过 REST API 以 JSON 格式导入/导出/版本管理 |
| 全状态对比 | 支持任意两个时间点的设备状态对比(Config/Route/MAC/ARP 等) |


---

## 3. Juniper Apstra -- Blueprint Analytics Dashboard

> 来源: Apstra 6.1 User Guide - Blueprint Analytics
> 定位: 意图驱动(Intent-Based)数据中心自动化与分析平台, 专注 DC Fabric 生命周期管理

### 3.1 Dashboard 分类体系

Apstra 采用 Probe 驱动的 Dashboard 模式。Dashboard 由 Widget 组成, 每个 Widget 绑定一个 Probe 的输出。Probe 按监控对象分为 5 类:

**分类一: 设备健康(Device Health)**

| Probe 名称 | 监控对象 | 核心指标 | 异常触发条件 |
|------------|----------|----------|-------------|
| Device System Health | 交换机系统资源 | CPU% / Memory% / Temperature / Fan Status / PSU Status | CPU>阈值 或 Memory>阈值 或 温度>阈值 或 风扇/电源异常 |
| Device Telemetry Health | 遥测采集器 | 采集服务执行统计、采集延迟、数据完整性 | 采集降级或中断时产生 Anomaly |

**分类二: 接口监控(Interface Monitoring)**

| Probe 名称 | 监控对象 | 核心指标 | 异常触发条件 |
|------------|----------|----------|-------------|
| Interface Flapping (All) | 所有接口 | 接口状态翻转次数 | 设备级 Flap 百分比超阈值 |
| Interface Flapping (Specific) | 指定接口(按 Tag 选择) | 指定接口的 Flap 次数 | 指定接口 Flap 超阈值 |
| Interface Bandwidth | 接口带宽 | Tx/Rx 带宽利用率% | 利用率超配置阈值 |
| Interface Counters | 接口计数器 | Errors / Discards / CRC 增量 | 错误计数持续增长 |

**分类三: 路由协议(Routing Protocol)**

| Probe 名称 | 监控对象 | 核心指标 | 异常触发条件 |
|------------|----------|----------|-------------|
| BGP Monitoring | BGP 会话 | Session State / Flap Count / Prefixes Received | Session Down 或 Flapping 或 Missing |
| ECMP Imbalance | 等价多路径 | 各 ECMP 路径的流量分布 / 路径间偏差比 | 偏差超配置阈值 |
| Route Count | 路由表 | IPv4/IPv6 路由条目数 | 路由数异常增减 |

**分类四: Fabric 健康(Fabric Health)**

| Probe 名称 | 监控对象 | 核心指标 | 异常触发条件 |
|------------|----------|----------|-------------|
| Fabric Link Health | Leaf-Spine 链路 | 链路状态 (Up/Down/Degraded) | 链路 Down 或 Degraded |
| Spine/Leaf Utilization | Spine/Leaf 层利用率 | 各层聚合带宽利用率% | 层间利用率不均衡 |
| Drain Traffic | 流量排空 | 维护设备的残余流量 | 排空后仍有流量通过 |

**分类五: 合规检查(Compliance)**

| Probe 名称 | 监控对象 | 核心指标 | 异常触发条件 |
|------------|----------|----------|-------------|
| Compliance Check | 配置合规性 | 实际配置 vs Blueprint 设计意图的差异 | 任何偏离即产生 Anomaly |
| Blueprint Anomalies | 蓝图异常汇总 | 所有 Probe 产生的 Anomaly 总数 | 任何 Probe 产生异常 |

### 3.2 Apstra Dashboard 管理特性

| 特性 | 详细说明 |
|------|----------|
| 自动创建 | 部署 Blueprint 后, 系统根据蓝图状态自动创建并启用相关 Dashboard |
| Predefined + Custom | 预定义 Probe 开箱即用; 用户可创建自定义 Probe 扩展监控范围 |
| 三种展示模式 | Summary(仅名称+Anomaly 数) / Preview(Widget 缩略图) / Expanded(完整详情) |
| 蓝图 Dashboard 集成 | 可将 Analytics Dashboard 显示在 Blueprint 主 Dashboard 上(toggle 开关) |
| 导出/导入 | Dashboard 可从一个 Blueprint 导出并导入到其他 Blueprint 复用 |
| System vs User 标签 | 系统自动生成的标记 System, 用户修改后标记用户名 |
| Anomaly 驱动 | 不仅展示数据, Probe 检测到偏离意图时自动产生 Anomaly 告警 |
| Probe 复用 | 已创建且未修改的 Probe 会被复用, 避免重复创建 |

### 3.3 Apstra 核心 Telemetry 指标

**设备资源指标:**

| 指标 | 数据类型 | 说明 | 典型阈值 |
|------|----------|------|----------|
| CPU Utilization | 百分比 | 设备 CPU 利用率 | > 80% Warning, > 95% Critical |
| Memory Utilization | 百分比 | 设备内存利用率 | > 85% Warning, > 95% Critical |
| Temperature | 摄氏度 | 设备温度(多传感器) | > 65C Warning, > 85C Critical |
| Fan Status | 状态枚举 | 风扇运行状态 | 非 OK 即告警 |
| Fan Speed | RPM | 风扇转速 | 低于最低转速告警 |
| Power Supply Status | 状态枚举 | 电源运行状态 | 非 OK 即告警 |

**接口指标:**

| 指标 | 数据类型 | 说明 | 典型阈值 |
|------|----------|------|----------|
| Interface Oper Status | Up/Down | 接口操作状态 | Down 即告警(Fabric 链路) |
| Interface Speed | Gbps | 接口协商速率 | 低于预期速率告警 |
| Tx Bytes | 字节数/秒 | 发送字节速率 | -- |
| Rx Bytes | 字节数/秒 | 接收字节速率 | -- |
| Tx Utilization | 百分比 | 发送方向利用率 | > 80% Warning |
| Rx Utilization | 百分比 | 接收方向利用率 | > 80% Warning |
| Tx Errors | 计数/秒 | 发送错误速率 | > 0 关注 |
| Rx Errors | 计数/秒 | 接收错误速率 | > 0 关注 |
| Tx Discards | 计数/秒 | 发送丢弃速率 | > 0 关注 |
| Rx Discards | 计数/秒 | 接收丢弃速率 | > 0 关注 |
| Interface Flap Count | 计数 | 接口状态翻转累计次数 | 短时间内多次 Flap 告警 |

**BGP 指标:**

| 指标 | 数据类型 | 说明 | 典型阈值 |
|------|----------|------|----------|
| BGP Session State | 状态枚举 | Established/Idle/Active/Connect 等 | 非 Established 即告警 |
| BGP Prefixes Received | 计数 | 从邻居接收的前缀数 | 突变告警 |
| BGP Prefixes Sent | 计数 | 向邻居发送的前缀数 | 突变告警 |
| BGP Flap Count | 计数 | BGP 会话抖动次数 | > 0 在短时间窗口内告警 |

**ECMP 指标:**

| 指标 | 数据类型 | 说明 | 典型阈值 |
|------|----------|------|----------|
| Per-path Traffic Volume | 字节数/秒 | 各等价路径的流量 | -- |
| Imbalance Ratio | 百分比 | 路径间流量最大偏差比 | > 30% Warning |
| Path Count | 计数 | 活跃等价路径数 | 低于预期告警 |

**Fabric 指标:**

| 指标 | 数据类型 | 说明 | 典型阈值 |
|------|----------|------|----------|
| Leaf-Spine Link Status | Up/Down | Fabric 链路状态 | Down 即告警 |
| Fabric Utilization | 百分比 | Fabric 整体带宽利用率 | > 70% Warning |
| Drain Status | 状态 | 设备流量排空状态 | 排空后仍有流量=异常 |

### 3.4 Apstra 关键设计理念

| 设计点 | 详细说明 |
|--------|----------|
| Intent-Based Analytics | 所有分析基于 Blueprint 设计意图, 实际状态偏离意图即为异常, 无需人工设定阈值 |
| Graph Model | 使用图数据库存储网络意图(设备角色、连接关系、策略), Probe 可引用图谱中的关系 |
| Processor Pipeline | Probe 内部由多个 Processor 串联组成处理链(采集-过滤-聚合-比较-告警) |
| 自动 Dashboard | 部署蓝图后自动启用相关 Dashboard, 无需手动配置 |
| Anomaly 分级 | Anomaly 按影响范围和严重度分级, 支持聚合展示 |
| 跨蓝图复用 | Dashboard 和 Probe 配置可导出为 JSON, 导入到其他 Blueprint |


---

## 4. 竞品 Dashboard 能力对比总结

### 4.1 分类方式对比

| 维度 | NVIDIA UFM | Arista CloudVision | Juniper Apstra |
|------|-----------|-------------------|----------------|
| 分类维度 | 按数据域(3类) | 按 Widget 可视化类型(4类) | 按 Probe/监控对象类型(5类) |
| 分类名称 | Health / Monitoring / Events & Alarms | Inputs / Layouts / Metrics / Summaries | Device Health / Interface / Routing / Fabric / Compliance |
| 组织逻辑 | "数据是什么"(数据域驱动) | "数据怎么展示"(可视化驱动) | "数据意味着什么"(意图驱动) |
| 目标用户 | 运维工程师(看指标排名) | 高级用户/SRE(自由组合查询) | 网络架构师(验证设计意图) |
| 面板数量 | 12 个固定面板 | 无限制(自由组合 Widget) | 按 Probe 数量动态生成 |

### 4.2 Dashboard 交互能力对比

| 能力 | NVIDIA UFM | Arista CloudVision | Juniper Apstra |
|------|-----------|-------------------|----------------|
| 自定义 Dashboard | [Y] 多 View + Add Panel | [Y] 自由画布 + Widget 库 | [Y] Probe 组合 + 导入导出 |
| 时间回溯 | [Y] 30s 快照时间线 | [Y] NetDB 全状态回溯 | [Y] 时序数据持久化 |
| 自定义查询语言 | [N] | [Y] AQL | [Y] Custom Probe Pipeline |
| 异常自动检测 | [N] 基于端口阈值告警 | [N] 基于自定义事件阈值 | [Y] Intent-Based Anomaly(自动) |
| Top N 灵活度 | [Y] 5/10/15/20 下拉切换 | [Y] 自定义 K 值 | [N] Probe 配置决定 |
| 导出/导入 | [N] 有限 | [Y] REST API JSON | [Y] 跨 Blueprint JSON |
| 参数化 Dashboard | [N] | [Y] Dashboard Inputs | [N] |
| 面板拖拽/调整大小 | [Y] | [Y] | [N] 有限 |
| 双视图切换 | [Y] List/Bar | [N] Widget 类型固定 | [Y] Summary/Preview/Expanded |
| 右键操作/下钻 | [Y] 跳转设备/端口详情 | [Y] 点击下钻设备详情 | [Y] 点击查看 Probe Stage |

### 4.3 核心指标覆盖对比(Cloud DC + AIDC 场景)

| 指标域 | NVIDIA UFM | Arista CloudVision | Juniper Apstra |
|--------|-----------|-------------------|----------------|
| 带宽(Tx/Rx BW) | [Y] 高频 30s | [Y] gNMI Streaming | [Y] Agent 采集 |
| 拥塞带宽(CBW) | [YY] 核心能力 | [N] 无专项 | [N] |
| 发送等待(XmitWait) | [YY] 核心能力 | [N] | [N] |
| ECN 标记 | [Y] Counter 间接推算 | [N] 需 AQL 自定义 | [N] |
| PFC 暂停帧 | [Y] Counter 间接 | [N] 需 AQL 自定义 | [N] |
| Buffer 溢出 | [Y] BufferOverrun | [N] 基础 Discard | [N] |
| FEC/BER 误码率 | [YY] 16级直方图+6维BER | [N] | [N] |
| 光模块功率/SNR | [Y] 每lane Tx/Rx+SNR(8lane) | [Y] Tx/Rx Power+Temp | [N] 有限 |
| PLR 重传 | [Y] 完整 PLR(7个Counter) | [N] | [N] |
| 自适应路由(AR) | [Y] AR/PFRN(9个Counter) | [N] | [N] |
| 温度 | [Y] Chip+Cable+Module 三级 | [Y] Device+多传感器 | [Y] Device 级 |
| CPU/Memory | [N] UFM不管理交换机OS | [Y] 完整 | [Y] 完整 |
| 接口 Flap | [Y] LinkDowned Counter | [Y] Interface Status 事件 | [Y] Interface Flapping Probe |
| BGP 状态 | [N] IB 无 BGP | [Y] 完整 | [Y] BGP Monitoring Probe |
| ECMP 均衡 | [N] | [N] 需 AQL 自定义 | [Y] ECMP Imbalance Probe |
| VXLAN 隧道 | [N] IB 无 VXLAN | [Y] VTEP/VNI 状态 | [Y] Fabric Link Health |
| 配置合规 | [N] | [Y] Designed vs Running | [Y] Intent vs Actual(自动) |
| 线缆信息 | [Y] PN/SN/Type/Length/FW | [Y] 基础信息 | [N] 有限 |
| Traffic Map(分层流量) | [Y] 按 Tier 分层 BW/CBW | [N] 需自建 | [N] |
| 链路恢复时间 | [Y] time_to_link_up_msec | [N] | [N] |
| 链路 Down 原因 | [Y] reason_opcode+blame | [N] | [N] |

---

## 5. 云数据中心(Cloud DC)关键 Dashboard 数据

> 场景特征: TCP/IP + VXLAN EVPN + Spine-Leaf 架构 + 多租户

### 5.1 必备指标(三家竞品均覆盖)

| 指标 | 说明 | 典型阈值 | 可视化形式 |
|------|------|----------|-----------|
| 设备在线率 | 在线设备数/总设备数 | < 99% 告警 | Ring/Gauge + KPI 数字 |
| 接口带宽利用率 | (Tx+Rx)/Line Rate | > 80% Warning | Horizon Graph 趋势 + Top K 排名 |
| 接口错误计数 | CRC/Errors/Discards 增量 | > 0 关注 | Top K 排名表 |
| CPU 利用率 | 交换机 CPU% | > 80% Warning | Top K + 趋势图 |
| 内存利用率 | 交换机 Memory% | > 85% Warning | Top K + 趋势图 |
| 温度 | 设备温度 | > 65C Warning | Top K + 趋势图 |
| BGP 邻居状态 | Established/Down | Down 即告警 | 状态表 |
| 告警统计 | Critical/Major/Minor/Warning 数量 | Critical > 0 即关注 | 2x2 网格卡片 |
| 事件流 | 实时事件列表 | -- | 事件列表(支持筛选) |
| 接口状态 | Up/Down 统计 | Down 即关注 | 状态汇总 |

### 5.2 差异化指标(部分竞品覆盖)

| 指标 | UFM | Arista | Apstra | 说明 | 价值 |
|------|-----|--------|--------|------|------|
| ECMP 负载均衡度 | [N] | [N] | [Y] | 各等价路径流量偏差 | 发现流量不均导致的局部拥塞 |
| VXLAN 隧道状态 | [N] | [Y] | [Y] | VTEP Up/Down/VNI 数量 | Overlay 网络健康 |
| 配置合规率 | [N] | [Y] | [Y] | 实际配置 vs 期望配置偏差 | 防止配置漂移 |
| 路由表变更 | [N] | [Y] | [Y] | 路由条目增减趋势 | 发现路由泄漏/黑洞 |
| 光模块健康 | [Y] | [Y] | [N] | Tx/Rx Power 偏移趋势 | 预测光模块故障 |
| 固件版本分布 | [Y] | [Y] | [N] | 各版本设备数量 | 版本一致性管理 |
| Traffic Map | [Y] | [N] | [N] | 按 Tier 分层流量分布 | 发现流量瓶颈层级 |
| MAC/ARP 表规模 | [N] | [Y] | [N] | 表条目数趋势 | 容量规划 |
| 电源功耗 | [N] | [Y] | [N] | PSU 功耗瓦特数 | 能耗管理 |

---

## 6. AI 数据中心(AIDC)关键 Dashboard 数据

> 场景特征: RoCE v2 无损以太网 + GPU 集群 + All-to-All 东西向流量 + 零丢包要求
>
> UFM 是该场景唯一深度覆盖的竞品, Arista/Apstra 在此场景能力有限

### 6.1 AIDC 独有核心指标(UFM 深度覆盖)

| 指标 | UFM Counter | 说明 | 为什么对 AIDC 重要 |
|------|-------------|------|-------------------|
| 拥塞带宽(CBW) | infiniband_CBW / Normalized_CBW | 端口拥塞带宽占线速百分比 | 直接反映 RoCE 网络拥塞程度, 拥塞导致 PFC 触发 |
| 发送等待(XmitWait) | PortXmitWaitExtended / NormalizedXW | 出端口因缺少 credit 等待的时间 | PFC 反压的直接体现, 等待时间长=网络拥塞严重 |
| Buffer 溢出 | ExcessiveBufferOverrunErrorsExtended | 连续流控周期内 Buffer 溢出次数 | 无损网络的致命问题, 溢出=丢包=训练中断 |
| 丢包(Discards) | PortXmitDiscardsExtended | 因拥塞或端口 Down 丢弃的出包数 | AIDC 零丢包要求, 任何丢包都可能中断训练 |
| FEC 错误分布 | hist[0-15] | RS-FEC 符号错误 16 级直方图 | 预测线缆/光模块劣化, 提前更换避免训练中断 |
| 误码率(BER) | Raw/Effective/Symbol BER x min/max/last | 多维度误码率(Pre-FEC/Post-FEC/Symbol) | 链路质量核心指标, BER 恶化预示链路即将故障 |
| PLR 重传 | PlrXmitRetryCodes / PlrXmitRetryEvents | 物理层码字重传次数/事件数 | 重传消耗有效带宽, 降低 GPU 通信效率 |
| 重传带宽损失 | HiRetransmissionRate | 因码字重传导致的接收带宽损失百分比 | 直接量化重传对训练吞吐的影响 |
| 光模块 SNR | snr_media_lane_[0-7] / snr_host_lane_[0-7] | 各 lane 信噪比(1/256 dB) | 预测光模块故障, SNR 下降=即将出错 |
| 链路恢复时间 | time_to_link_up_ext_msec | 链路 Down 后恢复到 Phy Up 的耗时(ms) | 影响训练任务中断时长, 毫秒级恢复是 AIDC 要求 |
| 链路 Down 原因 | local/remote/e2e_reason_opcode + down_blame | 链路 Down 的原因码和责任端 | 快速定位故障根因, 缩短 MTTR |
| 自适应路由尝试 | port_ar_trials | 交换机尝试重新路由包的次数 | 高频率=网络拥塞严重, AR 在频繁规避 |

### 6.2 AIDC 需要但竞品均未直接提供的指标

| 指标 | 说明 | 数据来源 | 为什么重要 |
|------|------|----------|-----------|
| ECN 标记包数 | 交换机对拥塞包标记 ECN CE 的数量 | 交换机 QoS Counter | RoCE 拥塞通知核心机制, ECN 数量反映拥塞频率 |
| PFC 暂停帧数 | 各优先级 PFC Pause 帧发送/接收数 | 交换机 PFC Counter | PFC 是无损保障最后防线, 频繁触发=网络设计有问题 |
| Headroom Buffer 利用率 | 无损队列 Headroom Buffer 占用% | 交换机 Buffer Monitor | Headroom 耗尽=PFC 触发=可能引发 PFC Storm |
| Shared Buffer 利用率 | 共享 Buffer 池占用% | 交换机 Buffer Monitor | Shared Buffer 耗尽=全局丢包 |
| 队列深度 | 各队列当前深度/最大深度/平均深度 | 交换机 Queue Counter | 队列深度是拥塞的直接度量 |
| CNP(拥塞通知包)数 | RoCE 接收端发回的 CNP 包数量 | 网卡 Counter | CNP 触发发送端降速, 影响训练吞吐 |
| GPU 训练任务状态 | 训练任务运行/中断/完成/失败 | 上层调度系统(Slurm/K8s) | 网络问题最终体现为训练任务中断 |
| NCCL 集合通信带宽 | All-Reduce/All-to-All 实际带宽 | GPU 侧 NCCL 日志 | 衡量网络对 GPU 训练的实际支撑效果 |
| 端到端延迟 | GPU 节点间通信延迟(尾延迟 P99) | 应用层探测 | 尾延迟决定训练 step 时间 |

### 6.3 AIDC vs Cloud DC 关键差异总结

| 维度 | Cloud DC(传统数据中心) | AIDC(AI 数据中心) |
|------|------------------------|-------------------|
| 核心网络技术 | TCP/IP, VXLAN EVPN | RoCE v2, 无损以太网 |
| 流控机制 | WRED + ECN(尽力而为, 允许丢包) | ECN + PFC(无损保障, 不允许丢包) |
| 关键性能指标 | 带宽利用率、丢包率、延迟 | ECN 标记率、PFC 帧数、CBW%、XmitWait、Buffer 利用率 |
| 拥塞检测方式 | 接口利用率 > 阈值 | CBW%、XmitWait、ECN 报文数、队列深度 |
| Buffer 关注程度 | 一般不关注(丢了重传) | Headroom/Shared Buffer 是生命线(溢出=训练中断) |
| 故障影响 | 单连接中断, TCP 重传恢复 | GPU 训练任务中断, 代价极高(数万美元/小时) |
| 流量模式 | 南北向为主(Client - Server) | 东西向为主(GPU - GPU All-to-All) |
| 带宽规模 | 10G / 25G / 100G | 100G / 200G / 400G / 800G |
| Top N 关注对象 | 交换机 / 服务器 | 交换机 / 网卡(HCA/NIC/SmartNIC) |
| SLA 定义 | 可用性 99.9% + 延迟 < 阈值 | 零丢包 + 低尾延迟(P99) + 训练任务不中断 |
| 误码关注深度 | Post-FEC BER 即可 | Pre-FEC + Post-FEC + Symbol BER + FEC 直方图 + BER 趋势 |
| 链路恢复要求 | 秒级可接受 | 毫秒级要求(影响训练 checkpoint) |
| 竞品覆盖度 | Arista/Apstra/UFM 均可 | 仅 UFM 深度覆盖 |

---

## 7. 参考来源

| 来源 | URL |
|------|-----|
| UFM Fabric Dashboard | https://docs.nvidia.com/networking/display/ufmenterpriseumv6194/Fabric-Dashboard |
| UFM High-Freq Telemetry | https://docs.nvidia.com/networking/display/ufmenterpriseumv62320/High-Frequency-(Primary)-Telemetry-Fields |
| UFM Low-Freq Telemetry | https://docs.nvidia.com/networking/display/ufmenterpriseumv6241/Low-Frequency-(Secondary)-Telemetry-Fields |
| UFM Telemetry Overview | https://docs.nvidia.com/networking/display/ufmenterpriseumv6242/Telemetry |
| Arista CV-CUE Dashboards | https://www.arista.com/en/ug-cv-cue/cv-cue-dashboards |
| Arista CVP Dashboards | https://www.arista.com/en/cg-cv/cv-accessing-dashboards |
| Arista CloudVision Help | https://www.arista.io/help/articles/overview-cloudvision |
| Arista Telemetry Analytics | https://www.arista.com/en/solutions/telemetry-analytics |
| Juniper Apstra Analytics | https://www.juniper.net/documentation/us/en/software/apstra6.1/apstra-user-guide/topics/concept/analytics.html |
| Juniper Apstra Dashboards | https://www.juniper.net/documentation/us/en/software/apstra6.1/apstra-user-guide/topics/concept/dashboards-analytics.html |
| Juniper Apstra Probes | https://www.juniper.net/documentation/us/en/software/apstra6.0/apstra-user-guide/topics/concept/probes-predefined.html |

---

Content was rephrased for compliance with licensing restrictions. All information sourced from publicly available vendor documentation.
