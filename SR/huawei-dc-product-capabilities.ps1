# Huawei data-center product-suite evidence rules.
# Scope: iMaster NCE-Fabric (management/controller) + iMaster NCE-FabricInsight (analyzer).
# Evidence reviewed 2026-09-09:
# https://e.huawei.com/ph/products/network-analysis/FabricInsight
# https://support.huawei.com/enterprise/en/doc/EDOC1100182047/f3bb92b3/collected-telemetry-data
# https://support.huawei.com/enterprise/en/doc/EDOC1100025111
# https://support.huawei.com/enterprise/en/doc/EDOC1100148424
# https://support.huawei.com/enterprise/en/doc/EDOC1100025106
function New-HuaweiIdSet([string]$Spec) {
    $set = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($part in ($Spec -split ',')) {
        $part = $part.Trim(); if (-not $part) { continue }
        if ($part -match '^(\d+)-(\d+)$') { for ($id=[int]$matches[1]; $id -le [int]$matches[2]; $id++) { [void]$set.Add($id) } }
        elseif ($part -match '^\d+$') { [void]$set.Add([int]$part) }
        else { throw "非法华为能力行号范围：$part" }
    }
    return $set
}
$HuaweiSupportIds = New-HuaweiIdSet '1-2,4,6-10,12,14-25,33-36,40-59,62-83,104-105,108-109,112-115,117'
$HuaweiNoEvidenceIds = New-HuaweiIdSet '103,154,193,211,213-215,217-221'
$HuaweiFabricInsightRelatedIds = New-HuaweiIdSet '5,60-61,84-102,106-107,110,118-141,142-145,148-153,155-191,206-210,216,224,227-228'
function Get-HuaweiState([int]$Id) {
    if ($HuaweiSupportIds.Contains($Id)) { return '支持' }
    if ($HuaweiNoEvidenceIds.Contains($Id)) { return '未发现公开证据' }
    return '部分支持/依组件、版本或硬件'
}
function Get-HuaweiNote([string]$State, [string]$Name, [string]$Detail, [int]$Id) {
    if ($State -eq '支持') { return "$Name：属于 iMaster NCE-Fabric 的基础管控、拓扑、设备/协议状态或配置生命周期能力；覆盖 $Detail，仍需按目标版本、License 与 CloudEngine 型号核对。" }
    if ($State -eq '未发现公开证据') { return "$Name：已同时核对 iMaster NCE-Fabric 与 iMaster NCE-FabricInsight，当前公开资料未证明组合方案提供覆盖 $Detail 的完整产品化能力；该结论表示未发现证据，并非断言绝对不支持。" }
    if ($HuaweiFabricInsightRelatedIds.Contains($Id)) { return "$Name：需结合 iMaster NCE-FabricInsight 分析器评估。官方资料确认其采集应用流、网络与 Telemetry 数据，支持关键应用质量检测、一键路径诊断、故障定位、网络质量劣化及亚健康光模块/链路分析；但未核验完整覆盖 $Detail，且依版本、Foundation Package、Telemetry/IOAM 与硬件。" }
    return "$Name：iMaster NCE-Fabric 可提供部分管理或状态数据，但覆盖 $Detail 的完整字段、工作流或分析器未核验；需按目标版本、License、CloudEngine 型号及是否部署 FabricInsight 确认。"
}
