# Shared context fields for the 229-item visualization and diagnostics matrix.
# These fields describe product requirements, not evidence that any vendor supports them.
$VisualDiagPlanningIds = New-Object 'System.Collections.Generic.HashSet[int]'
foreach ($id in @(103,193,211,213,214,215,216,217,218,219,220,221)) { [void]$VisualDiagPlanningIds.Add($id) }

$VisualDiagTechnology = @{
    '全局态势'='多站点数据汇聚、统一对象模型、健康与事件聚合、Dashboard'
    '拓扑可视化'='LLDP/BGP-LS/EVPN 邻接、图模型、物理与逻辑拓扑、历史状态'
    '设备监控'='Inventory、SNMP/gNMI/Streaming Telemetry、硬件与系统指标'
    '接口与链路监控'='接口计数器、链路状态、光模块 DOM、错误与质量指标'
    '协议监控'='BGP/IGP/BFD/LACP/MLAG/EVPN 邻接与协议状态遥测'
    'Overlay监控'='EVPN/VXLAN、VTEP、隧道、路由、端点与租户对象模型'
    '流量监控'='sFlow/NetFlow/IPFIX、流记录、Top-N、通信矩阵与大象流'
    'AIDC监控'='PFC/ECN/CNP、队列与 Buffer、RoCE/DCQCN、NIC/GPU Telemetry'
    '告警与事件'='事件标准化、去重聚合、生命周期、通知与工单集成'
    '配置与软件监控'='期望/运行配置、合规差异、版本基线与升级状态'
    '遥测管理'='gNMI/Telemetry 订阅、采集管道、质量监测、保留与降采样'
    '报表管理'='指标聚合、SLA/健康/资产/容量报表、调度与导出'
    '健康分析'='多维健康模型、加权评分、阈值与趋势、对象下钻'
    '异常检测'='静态阈值、动态基线、时序异常、多指标与拓扑关联'
    '根因分析'='拓扑依赖图、事件与变更关联、因果排序、影响范围分析'
    '物理层诊断'='接口错误、光功率/温度、FEC/BER、线缆与链路抖动分析'
    '路径诊断'='Underlay/Overlay 路径计算、转发表验证、探测与历史回放'
    '路由协议诊断'='BGP/OSPF/IS-IS/BFD 状态、路由策略、收敛与 ECMP 分析'
    'EVPN/VXLAN诊断'='EVPN 路由、VTEP/VNI、隧道、端点学习与数据平面验证'
    '流量分析'='流量分类、会话与应用识别、Top-N、时序和瓶颈分析'
    '拥塞诊断'='微突发、队列水位、Buffer、丢包、PFC/ECN 关联分析'
    'AIDC诊断'='RoCE 无损链路、PFC/ECN/DCQCN、NIC/交换机与作业关联'
    '配置诊断'='配置解析、意图/实际差异、来源追踪、冲突与合规规则'
    '变更分析'='变更时间线、前后状态对比、影响分析、失败定位与回滚证据'
    '容量分析'='端口/链路/Fabric/Overlay/ASIC/GPU Pod 利用率与容量模型'
    '仿真与预测'='数字孪生、What-if、配置预验证、故障注入与趋势预测'
    '智能辅助'='规则与知识库、推荐引擎、自然语言检索、证据可追溯性'
    '诊断工具'='Ping/Traceroute、远程命令、抓包、日志检索与自动巡检'
    '诊断报告'='诊断证据编排、根因/性能/变更复盘、模板与导出'
}
$VisualDiagScenario = @{
    '全局态势'='NOC 多站点值守、跨 Fabric 健康巡检与运营态势汇报'
    '拓扑可视化'='上线验收、连接关系核对、故障影响定位与拓扑回放'
    '设备监控'='资产盘点、设备巡检、硬件故障发现与资源异常定位'
    '接口与链路监控'='链路质量巡检、光模块劣化定位、丢包与带宽排障'
    '协议监控'='邻居异常、协议震荡、收敛问题与多归属状态排查'
    'Overlay监控'='EVPN/VXLAN 租户连通性、隧道与端点状态巡检'
    '流量监控'='热点发现、Top Talker 定位、东西向流量与大象流观察'
    'AIDC监控'='RoCE 网络值守、无损指标巡检、GPU 集群网络质量观察'
    '告警与事件'='告警收敛、值班处置、通知升级与 ITSM 工单联动'
    '配置与软件监控'='配置漂移检查、版本基线治理、升级过程监控'
    '遥测管理'='采集覆盖核查、数据断流排查、容量与保留策略治理'
    '报表管理'='周月报、SLA 汇报、资产审计、容量与管理层报告'
    '健康分析'='日常健康巡检、风险排序、站点/Fabric/设备下钻'
    '异常检测'='性能劣化预警、突发异常发现、基线偏离排查'
    '根因分析'='多告警故障定位、变更关联、影响面评估与缩短 MTTR'
    '物理层诊断'='光链路劣化、误码、模块温度与间歇性链路故障排查'
    '路径诊断'='端到端不通、绕路、黑洞、租户与服务链路径核验'
    '路由协议诊断'='邻居中断、路由缺失、收敛慢与 ECMP 异常排查'
    'EVPN/VXLAN诊断'='MAC/IP 学习异常、VNI 不通、隧道与控制平面排障'
    '流量分析'='带宽瓶颈、异常通信、应用性能与流量结构分析'
    '拥塞诊断'='微突发、队列拥塞、Buffer 耗尽及无损网络丢包定位'
    'AIDC诊断'='训练性能下降、PFC 风暴、ECN/DCQCN 与负载不均排障'
    '配置诊断'='配置冲突、合规偏差、来源追踪与错误配置定位'
    '变更分析'='变更前评审、失败复盘、影响确认与回滚决策'
    '容量分析'='扩容规划、资源瓶颈识别、Fabric 与 GPU Pod 容量评估'
    '仿真与预测'='重大变更预演、故障影响推演、扩容 What-if 评估'
    '智能辅助'='运维建议、知识检索、自然语言辅助诊断与决策支持'
    '诊断工具'='现场排障、远程取证、主动探测、抓包和一键巡检'
    '诊断报告'='故障复盘、性能分析、变更审计与客户交付报告'
}

function Get-KeyTechnology($row, [int]$id) {
    $level2 = [string]$row.'2级分类'; $detail = [string]$row.'5级分类'
    $base = [string]$VisualDiagTechnology[$level2]
    if ([string]::IsNullOrWhiteSpace($base)) { $base = '统一对象模型、状态与指标采集、关联分析和可视化' }
    return "$base；具体范围：$detail"
}
function Get-TypicalScenario($row, [int]$id) {
    $level2 = [string]$row.'2级分类'; $detail = [string]$row.'5级分类'
    $base = [string]$VisualDiagScenario[$level2]
    if ([string]::IsNullOrWhiteSpace($base)) { $base = '数据中心网络日常运维、监控与故障排查' }
    return "$base；关注：$detail"
}
function Get-Priority($row, [int]$id) {
    $level2 = [string]$row.'2级分类'
    $text = @($row.'3级分类', $row.'4级分类', $row.'5级分类') -join '|'
    if ($VisualDiagPlanningIds.Contains($id) -or $level2 -in @('仿真与预测','智能辅助') -or $text -match 'GPU作业|训练作业|数字孪生|What-if|预测|智能建议|智能推荐|自然语言|扩容建议') { return 'P2（演进）' }
    if ($level2 -in @('拓扑可视化','设备监控','接口与链路监控','协议监控','Overlay监控','AIDC监控','告警与事件','配置与软件监控','物理层诊断','路径诊断','路由协议诊断','EVPN/VXLAN诊断','拥塞诊断','AIDC诊断','配置诊断')) { return 'P0（核心）' }
    return 'P1（重要）'
}