# AmpCon-DC（FS / Pica8）229 项矩阵的产品证据规则。
# 证据复核日期：2026-09-09
# https://www.fs.com/uk/blog/boost-your-data-center-networks-observability-with-ampcondc-28118.html
# https://www.fs.com/ca/blog/ampcondc-v220-released-accelerated-network-deployment-and-management-28160.html
# 产品支持判定明确排除本地 UI 原型和 Mock 数据。
function New-AmpConDcIdSet([string]$Spec) {
    $set = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($part in ($Spec -split ',')) {
        $part = $part.Trim()
        if (-not $part) { continue }
        if ($part -match '^(\d+)-(\d+)$') {
            for ($id = [int]$matches[1]; $id -le [int]$matches[2]; $id++) { [void]$set.Add($id) }
        } elseif ($part -match '^\d+$') { [void]$set.Add([int]$part) }
        else { throw "非法 AmpCon-DC 行号范围：$part" }
    }
    return $set
}

# “支持”仅用于官方资料直接覆盖该原子能力的项目；相关但字段/边界未完全核验时标为部分支持。
$AmpConDcStatusSupported = '支持'
$AmpConDcStatusPartial = '部分支持/依设备或版本'
$AmpConDcStatusUnsupported = '不支持/未发现原生支持'
$AmpConDcSupportIds = New-AmpConDcIdSet '14,17,19,38,53,66,104,108'
$AmpConDcPartialIds = New-AmpConDcIdSet '4,6-9,12,15-16,20-25,32,35,40-42,46,48-49,54-59,61-64,67-69,74-78,80-81,91-99,102,105-107,109-110,112-116,119,123,130,132-134,137,139,141-143,155-156,158,162-167,174-175,177,184-185,187-188,194-195,199,203-205,212'

function Get-AmpConDcState([int]$Id) {
    if ($AmpConDcSupportIds.Contains($Id)) { return $AmpConDcStatusSupported }
    if ($AmpConDcPartialIds.Contains($Id)) { return $AmpConDcStatusPartial }
    return $AmpConDcStatusUnsupported
}
function Test-AmpConDcIdIn([int]$Id, [string]$Spec) {
    return (New-AmpConDcIdSet $Spec).Contains($Id)
}
function Get-AmpConDcNote([string]$State, [string]$Name, [string]$Detail, [int]$Id) {
    $scope = 'AmpCon-DC（FS / Pica8）面向 PicOS 数据中心交换机；能力范围需按目标版本、License 与兼容硬件确认。'
    if ($State -eq $AmpConDcStatusSupported) {
        if (Test-AmpConDcIdIn $Id '14,17,19,38') { return "$Name：FS 官方资料明确提供交换机/链路拓扑自动发现、实时状态与链路健康、多级下钻及历史拓扑回放；覆盖 $Detail。$scope" }
        if (Test-AmpConDcIdIn $Id '53,66') { return "$Name：AmpCon-DC 内置 Telemetry，v2.2.0 官方发布说明明确覆盖端口状态及 BGP 邻居状态；覆盖 $Detail。$scope" }
        return "$Name：官方资料明确提供多级故障告警，并可在拓扑中实时标示设备或链路异常；覆盖 $Detail。$scope"
    }
    if ($State -eq $AmpConDcStatusPartial) {
        if (Test-AmpConDcIdIn $Id '4,6-42') { return "$Name：拓扑自动发现、实时设备/链路状态、交换机与端口下钻、Linux Host 可见性和历史回放可覆盖部分场景；未核验完整覆盖 $Detail。$scope" }
        if (Test-AmpConDcIdIn $Id '40-90,116-123') { return "$Name：内置 Telemetry 已公开覆盖端口、带宽、设备资源、BGP/OSPF 邻居、MAC/ARP/路由表及历史查询；具体字段未核验完整覆盖 $Detail。$scope" }
        if (Test-AmpConDcIdIn $Id '91-103,178-193') { return "$Name：v2.2.0 已公开端到端 RoCE 部署、预检/批量下发/部署后校验、交换机与 NIC 流量监控及 Broadcom/NVIDIA NIC 管理；未证明完整覆盖 $Detail。$scope" }
        if (Test-AmpConDcIdIn $Id '104-111,130-145,170-177') { return "$Name：实时 Telemetry 异常检测、分级告警、拓扑告警、邮件规则/抑制期及历史数据可提供部分证据；未核验完整分析或闭环覆盖 $Detail。$scope" }
        if (Test-AmpConDcIdIn $Id '112-115,194-205,212') { return "$Name：Day 0–Day 2+ 生命周期、Underlay 模板化自动化、批量部署和部署前后校验可覆盖部分流程；未核验完整覆盖 $Detail。$scope" }
        return "$Name：公开的邻居状态、转发表、VXLAN 自动化和历史 Telemetry 可辅助该项，但未发现完整专用分析器覆盖 $Detail。$scope"
    }
    return "$Name：截至已核对的 FS AmpCon-DC 官方可观测性资料与 v2.2.0 发布说明，未发现产品原生完整覆盖 $Detail；未把 PicOS 单机 CLI、第三方系统或本地 UI 原型计入。$scope"
}
