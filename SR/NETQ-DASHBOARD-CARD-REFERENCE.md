# NVIDIA NetQ Workbench Card 详细分类参考

> 来源: NetQ 5.0 UI Card Reference
> https://docs.nvidia.com/networking-ethernet-software/cumulus-netq-50/More-Documents/NetQ-UI-Card-Reference/
>
> 说明: NetQ 的 Dashboard 叫 Workbench, 由 Card(卡片) 组成, 每个 Card 有 S/M/L/Full 四种尺寸。
> 预置两个 Workbench:
> - NetQ Workbench(默认): Device Inventory + Switch Inventory + Validation Summary + WJH + Host/DPU Inventory + System Events
> - Fabric Dashboard: Link Status + Link Events + Sensor Health + Queue Lengths + WJH + System Events + BGP/EVPN Sessions + Device Inventory

| 一级分类(Card) | 二级分类 | 三级指标/内容 | 说明 | 交互能力 |
|----------------|----------|--------------|------|----------|
| Events Card | 事件总览 | Event Count by Category | 监控全网事件。按 Application/Device/Port/Protocol 四类统计事件数量, 显示告警趋势(上升/下降/平稳)和告警评级(Low/Med/High) | S: 趋势箭头+数量+评级; M: 按类型分布图+总数; L: 分类分布图+列表(按最近/按设备排序); Full: 全量事件表+时间/设备/severity 筛选+导出 |
| Events Card | 事件分类 | NetQ Agent / BTRFS / Config Diff / Link / LLDP / MTU / Node / Port / Resource / Sensor / Services / SSD / TCA | 大卡展示各类事件的分布图, 按事件数量降序排列, 并提供最近事件或设备事件数量两种排序视图 | L: 点击 View All 打开全屏; Full: 筛选+导出+暂停/恢复自动刷新 |
| Network Health Card | System Health | NetQ Agent Health + Sensor Health | 网络健康度卡片。综合评估 System/Network Services/Interface 三个维度, 计算为通过验证的设备百分比。System Health 含 Agent 和传感器两项验证 | S: 健康评分数字+趋势+评级(Low/Med/High); M: 三维度分别评分+趋势; L: 三个 Tab 分别展示详情 |
| Network Health Card | Network Services Health | BGP + CLAG + EVPN + NTP + OSPF + VXLAN Health | 网络服务健康度。计算各协议通过验证的设备百分比, 展示验证通过率趋势图 | L: 各协议验证通过率分布图+失败设备列表(按最多失败/最近失败排序); Full: 所有协议验证结果的全量表格 |
| Network Health Card | Interface Health | Interfaces + VLAN + MTU Health | 接口健康度。计算接口/VLAN/MTU 验证通过的端口百分比 | L: 各验证项通过率分布图+失败设备列表; Full: 同上 |
| Inventory/Devices Card | 设备清单 | Switch Count + Host Count | 设备清单卡片。展示全网交换机和主机总数, 以及操作系统分布 | S: 交换机数+主机数; M: 加 OS 分布饼图; L: 交换机组件分布(ASIC/OS/Agent/Platform)+唯一版本数; Full: 全量设备表(Agent State/ASIC/CPU/Disk/Memory/OS/Platform 详情) |
| Inventory/Switch Card | 交换机清单 | Total Switches (Fresh/Rotten) | 交换机清单卡片。展示健康(Fresh)和异常(Rotten)交换机数量分布, 以及各硬件/软件组件分布 | S: 总数+健康/异常饼图; M: 各组件(Disk/OS/ASIC/Agent/CPU/Platform/Memory)版本分布+唯一数; L: 四个Tab(Summary/ASIC/Platform/Software)各含详细分布图; Full: 全量按组件分Tab的表格 |
| All BGP Sessions Card | BGP 服务 | Nodes Running / Alarms / Unestablished Sessions | 全网 BGP 服务概览。展示运行 BGP 的节点数、BGP 告警数、未建立会话数的趋势 | S: 节点数+告警数; M: 三个趋势图(节点/告警/未建立); L: Sessions Summary Tab(按会话数/未建立数排名的设备表) + Alarms Tab(告警设备排名); Full: All Switches/All Sessions/All Alarms 三个表 |
| BGP Session Card | 单个 BGP 会话 | Session State / Peer ASN / Peer Router ID / Config Evolution | 单个 BGP 会话详情。显示会话状态、对端信息, 以及状态变化的热力图 | S: 主机-对端+状态; M: 状态热力图+对端信息; L: Summary(告警/事件分布+连接断开次数+RX/TX Families) + Config Evolution(配置文件变更对比); Full: 所有会话+所有事件表 |
| All EVPN Sessions Card | EVPN 服务 | Nodes Running / Alarms / Sessions / VNIs | 全网 EVPN 服务概览。展示运行节点数、告警数、会话数趋势 | S: 节点数+告警数; M: 三个趋势图; L: Summary(节点/会话/L3 VNI 趋势+按会话数/L2 EVPN/L3 EVPN排名的设备表) + Alarms; Full: All Switches/Sessions/Alarms |
| EVPN Session Card | 单个 EVPN 会话 | VTEP Count / VNI Name / Type (L2/L3) | 单个 EVPN 会话详情。展示 VTEP 数量趋势、VNI 名称、L2/L3 类型 | S: VNI名+VTEP数; M: VTEP趋势图+类型; L: Summary(VTEP/告警/事件分布+VRF或VLAN表) + Config Evolution; Full: 所有会话+事件 |
| All LLDP Sessions Card | LLDP 服务 | Nodes Running / Alarms / Sessions / Sessions with No Neighbor | 全网 LLDP 邻居发现服务概览 | S: 节点数+告警数; M: 三个趋势图; L: Summary(节点/会话/无邻居会话趋势+设备排名表) + Alarms; Full: All Switches/Sessions/Alarms |
| LLDP Session Card | 单个 LLDP 会话 | Peer Status (has peer/no peer) / Host Interface / Peer Interface | 单个 LLDP 会话。展示邻居可达性的热力图 | S: 主机-对端+状态; M: 邻居状态热力图+接口信息; L: Summary(告警/事件分布) + Config Evolution; Full: 所有会话+事件 |
| All MLAG Sessions Card | MLAG 服务 | Nodes Running / Alarms / Inactive Backup IP / Single Bonds | 全网 MLAG 服务概览。除节点和告警外, 还关注 Backup IP 是否激活和 Single Bond 数量 | S: 节点数+告警数; M: 三个趋势图+Inactive Backup IP+Single Bonds 指标; L: Summary + Alarms; Full: All Switches/Sessions/Alarms |
| MLAG Session Card | 单个 MLAG 会话 | Peer Status / Role / CLAG SysMAC / Bonds (Dual/Single/Conflicted/Proto Down) | 单个 MLAG 会话详情。展示对端可用性热力图、角色(Primary/Secondary)、各类 Bond 数量 | S: 主机-对端+角色; M: Peer 状态热力图+角色/SysMAC/Peer State; L: Summary(告警/事件+Bond统计) + Config Evolution; Full: 所有会话+事件 |
| All OSPF Sessions Card | OSPF 服务 | Nodes Running / Alarms / Sessions / Unestablished Sessions | 全网 OSPF 服务概览 | S: 节点数+告警数; M: 三个趋势图; L: Summary + Alarms; Full: All Switches/Sessions/Alarms |
| OSPF Session Card | 单个 OSPF 会话 | State / Area / Ifname / Peer Address / Peer ID / Cost / Dead Time / MTU / Network Type | 单个 OSPF 会话详情。含大量 OSPF 协议参数 | S: 主机-对端+状态; M: 状态热力图+接口/对端信息; L: Summary(状态/协议参数全览) + Config Evolution; Full: 所有会话+事件 |
| Switch Card | 设备详情 - Attributes | Hostname / Mgmt IP / MAC / Agent State / Platform / ASIC / OS / Interfaces | 单设备属性概览。展示设备基本信息和接口总数(Up/Down) | S: 主机名+告警趋势+评级; M: 告警分类分布; L: Attributes Tab 显示全部属性 |
| Switch Card | 设备详情 - Utilization | CPU% / Memory% / Disk% 趋势图 | 单设备资源利用率。展示 CPU、内存、磁盘使用趋势 | L: Utilization Tab 展示三个趋势图 |
| Switch Card | 设备详情 - Interfaces | Tx/Rx Bytes/Packets/Drops/Errors/Multicast/Broadcast/Utilization | 单设备接口统计。每个接口的收发流量、错误、丢包、利用率趋势图 | L: Interfaces Tab, 左侧接口列表(按名称/Rx Util/Tx Util排序), 右侧选中接口的统计图 |
| Switch Card | 设备详情 - Digital Optics | Laser Rx Power / Tx Power / Bias Current / Module Temperature / Module Voltage | 单设备光模块监控。展示各端口光模块的五项关键指标 | L: Digital Optics Tab, 左侧接口列表, 右侧下拉选择指标类型展示趋势图 |
| Switch Card | 设备详情 - Full Screen | Alarms / All Interfaces / MAC Addresses / VLANs / IP Routes / IP Neighbors / IP Addresses / BTRFS / Packages / SSD / Forwarding Resources / ACL Resources / WJH / Sensors / Digital Optics | 单设备全屏视图。展示该设备所有维度数据, 按 Tab 分类 | Full: 多 Tab 全量表格, 每个 Tab 可筛选/排序/导出。WJH Tab 展示该设备的丢包事件; Sensors Tab 按 Fan/Temperature/PSU 分类; Forwarding Resources 展示路由/MAC/ECMP 资源利用率 |
| Trace Request Card | 路径发现 | Source / Destination / VRF / VLAN / Schedule | 创建路径追踪请求。支持 L2(MAC+VLAN) 和 L3(IP+VRF) 两种模式, 可设为定时任务 | S: 选择已有请求+Go; M: 输入源/目的+Run Now; L: 完整配置(源/目的/VRF/VLAN/Schedule)+保存/更新; Full: 所有已计划的请求列表 |
| On-demand Trace Result Card | 路径追踪结果 | Total Paths / MTU Overall / Min Hops / Max Hops / Per-path Warnings and Errors | 按需路径追踪结果。展示发现的路径数、MTU、跳数分布、每条路径的警告和错误 | S: 源-目的+成功/失败; M: 路径数/MTU/跳数统计; L: Results Tab(跳数分布图+MTU分布图+路径表) + Settings Tab; Full: 全量结果表 |
| Scheduled Trace Result Card | 定时追踪结果 | Run Count / Warnings / Errors / Heat Map / Bad Nodes | 定时路径追踪结果。展示多次执行的结果热力图和异常节点分布 | S: 运行次数+警告数+错误数; M: 结果热力图+Bad Nodes 分布; L: Results(热力图+关联小图+路径/告警/警告 Tab) + Config(配置详情); Full: 全量时序结果表 |
| Validation Request Card | 验证请求 | Protocols Selection / Schedule | 创建网络验证请求。支持选择协议(BGP/EVPN/Interfaces/MTU/NTP/OSPF/Sensors/VLAN/VXLAN等)和定时计划 | S: 选择已有请求+Go; M: 协议列表; L: 完整配置(协议选择+频率+时间); Full: 所有已计划验证的列表 |
| On-demand Validation Result Card | 按需验证结果 | Devices Tested (Pass/Warn/Fail) / Sessions Tested (Pass/Warn/Fail) | 按需验证结果。展示设备通过率和会话通过率, 列出失败设备 | S: 协议名+状态; M: 设备/会话通过率饼图; L: Summary(饼图+失败设备列表按最多失败/最近失败排序) + Config; Full: 全量结果表(Job ID/各节点计数/会话计数) |
| Scheduled Validation Result Card | 定时验证结果 | Run Results Heat Map / Pass-Warn-Fail Distribution | 定时验证结果。展示多次验证执行的热力图, 按时间段着色(绿=通过, 黄=警告, 红=失败) | S: 运行次数+警告数+错误数+状态; M: 结果热力图; L: Summary(热力图+失败设备列表) + Config(验证名称/协议/计划); Full: 全量时序结果表 |


---

## Cisco NDFC (Nexus Dashboard Fabric Controller) Dashboard 详细分类

> 来源: NDFC Release 12.2.2/12.2.3 - About Fabric Overview for LAN Operational Mode Setups
> https://www.cisco.com/c/en/us/td/docs/dcn/ndfc/1222/articles/ndfc-about-fabric-overview-for-lan-operational-mode-setups/
>
> 定位: Cisco 数据中心 Fabric 自动化与运维平台(管理 Nexus 交换机), 侧重配置管理+部署+验证
>
> 说明: NDFC 不是传统的 Card/Widget Dashboard, 而是 Tab + Table 模式的 Fabric Overview 页面。
> Metrics Tab 是最接近监控 Dashboard 的部分, 需启用 Performance Monitoring 功能。

| 一级分类(Tab) | 二级分类 | 三级指标/内容 | 说明 | 交互能力 |
|---------------|----------|--------------|------|----------|
| Overview | Fabric Information | Fabric Name / Type / Technology / Status | Fabric 基本信息卡片 | 只读展示 |
| Overview | Switch Health | Health Status 饼图(按 severity 着色) | 基于最高未处理告警的 severity 评估交换机健康状态 | 饼图点击筛选 |
| Overview | Switch Configuration | In-Sync / Out-of-Sync 数量 | 交换机配置同步状态统计 | -- |
| Overview | Switch Roles | Spine / Leaf / Border / Super Spine 数量 | 按角色分布的饼图 | -- |
| Overview | Switch Hardware Version | 各硬件版本交换机数量 | 硬件版本分布 | -- |
| Overview | VXLAN - Routing Loopback | Loopback 状态 | 仅 VXLAN Fabric 显示 | -- |
| Overview | VXLAN - VTEP Loopback | VTEP Loopback 状态 | 仅 VXLAN Fabric 显示 | -- |
| Overview | VXLAN - NVE Int Status | NVE 接口状态 | 仅 VXLAN Fabric 显示 | -- |
| Overview | VXLAN - Networks/VRFs Definition | 已定义的 Network 和 VRF 数量 | 仅 VXLAN Fabric 显示 | -- |
| Overview | Event Analytics | 事件概览(告警数量/趋势) | 快速查看事件状态 | 点击跳转 Event Analytics Tab |
| Metrics | CPU Utilization | Low% / Avg% / High% / Range Preview | 各交换机 CPU 利用率统计, 含线性范围预览 | 按 Day/Week/Month/Year 切换; 点击查看趋势图 |
| Metrics | Memory Utilization | Low% / Avg% / High% / Range Preview | 各交换机内存利用率统计 | 同上 |
| Metrics | Traffic | Avg Rx / Peak Rx / Avg Tx / Peak Tx / Avg Rx+Tx / Avg Errors / Peak Errors / Avg Discards / Peak Discards | 各交换机聚合流量统计(含错误和丢弃) | 按 Day/Week/Month/Year 切换 |
| Metrics | Temperature | Module / Low(C) / Avg(C) / High(C) | 各交换机各温度模块的温度统计 | 按 Day/Week/Month/Year 切换 |
| Metrics | Interface | Speed / Status / Rx(Avg/Avg%/Peak/Peak%) / Tx(Avg/Avg%/Peak/Peak%) / Errors(In Avg/Out Avg/In Peak/Out Peak) / Discards(In Avg/Out Avg/In Peak/Out Peak) | 各接口详细性能指标 | 按 Day/Week/Month/Year 切换; Real-time(10s采集); Custom日期范围 |
| Metrics | Links | 与 Interface 相同的指标体系 | 各链路详细性能指标 | 同 Interface |
| Metrics | Power | Power Module / Power Usage% (Avg/Min/Max) / Capacity(AMPs) / Draw AMPs(Avg/Min/Max) / Capacity(WATTs) / Draw WATTs(Avg/Min/Max) | 各交换机电源模块功耗统计 | 按 Day/Week/Month 切换; 点击查看功耗图表 |
| Event Analytics | Alarms | ID / Severity / Source / Name / Category / Creation Time / Policy | 当前活跃告警列表 | 可 Acknowledge/Unacknowledge/Clear/Delete |
| Event Analytics | Cleared Alarms | ID / Severity / Source / Name / Category / Creation Time / Cleared Time | 已清除告警历史 | 可 Delete |
| Event Analytics | Events | Switch / Severity / Facility / Type / Count / First Seen / Last Seen / Description | 事件列表(含 NDFC 内部事件和 Syslog) | 可 Acknowledge/Delete/Add Suppressor/Event Setup |
| Event Analytics | Recent Tasks | Fabric / Task Name / Description / Duration / Progress | 最近操作任务进度 | 只读 |
| Switches | Switch List | Name / IP / Role / Serial / Mode / Config Status / Oper Status / Discovery Status / Model / vPC Role / Software Version / Up Time | 交换机完整列表和状态 | Add/Preview/Deploy/Discovery/Set Role/vPC Pairing/Delete 等操作 |
| Links | Intra-Fabric Links | Name / Policy / Admin State / Oper State | Fabric 内部链路 | Create/Edit/Delete/Import/Export |
| Links | Inter-Fabric Links | Link Type / Sub-Type / Source/Dest Fabric / Source/Dest Device+Interface | 跨 Fabric 链路(VRF-Lite/Multisite) | Create/Edit/Delete |
| Links | Protocol View | Name / Is Present / Link Type / Link State / UpTime | 链路协议视图 | 只读 |
| VRFs | VRF List | VRF Name / VRF Status / VRF ID | VRF 管理(创建/编辑/删除/部署/导入/导出) | Create/Edit/Deploy/Import/Export/Delete |
| VRFs | VRF Attachments | VRF Name / VRF ID / VLAN ID / Switch / Status / Attachment / Switch Role | VRF 与交换机的绑定关系 | Attach/Detach/Deploy/Edit/History |
| Networks | Network List | Network Name / Network ID / VRF / IPv4 GW / IPv6 GW / Status / VLAN ID | Overlay 网络管理 | Create/Edit/Deploy/Import/Export/Delete |
| Networks | Network Attachments | Network Name / Network ID / VLAN / Switch / Ports / Status / Attachment | 网络与交换机/端口的绑定 | Attach/Detach/Deploy/Edit/History |
| Policies | Policy List | Template / Description / Content Type / Switch / Entity / Source / Priority / Editable / Mark Deleted | 策略管理(含 Policy Group) | Add/Edit/Delete/Generated Config/Push Config |
| History | Deployment History | Hostname / Entity Name / Entity Type / Source / Commands / Status / User / Time | 部署历史记录 | 筛选/排序/导出 |
| History | Policy Change History | Policy ID / Template / PTI Operation / Generated Config / Entity / Created On / User / Source | 策略变更历史 | Detailed History 查看配置差异 |
| Resources | Resource Allocation | Scope Type / Scope / Device / Allocated Resource / Resource Type / Is Allocated / Allocated On | 资源池管理(IP/Subnet/VLAN/Loopback/VPC ID) | Allocate/Release |
