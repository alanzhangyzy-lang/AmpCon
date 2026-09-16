param([switch]$Apply)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$csv = Join-Path $root 'DC-VISUALIZATION-DIAGNOSTICS-COMPETITIVE-MATRIX-WITH-DESCRIPTIONS.csv'
$xlsx = Join-Path $root 'DC-VISUALIZATION-DIAGNOSTICS-COMPETITIVE-MATRIX-WITH-DESCRIPTIONS.xlsx'
$lock = Join-Path $root '~$DC-VISUALIZATION-DIAGNOSTICS-COMPETITIVE-MATRIX-WITH-DESCRIPTIONS.xlsx'
$tempCsv = $csv + '.revalidate.tmp'
$backupCsv = $csv + '.revalidate.bak'
$backupXlsx = $xlsx + '.revalidate.bak'

function New-IdSet([string]$spec) {
    $set = New-Object 'System.Collections.Generic.HashSet[int]'
    foreach ($part in ($spec -split ',')) {
        $part = $part.Trim(); if (-not $part) { continue }
        if ($part -match '^(\d+)-(\d+)$') { for ($i=[int]$matches[1]; $i -le [int]$matches[2]; $i++) { [void]$set.Add($i) } }
        elseif ($part -match '^\d+$') { [void]$set.Add([int]$part) }
        else { throw "非法行号范围：$part" }
    }
    return $set
}
function Get-State([int]$id, $supported, $unsupported) {
    if ($supported.Contains($id)) { return '支持' }
    if ($unsupported.Contains($id)) { return '不支持/未发现原生支持' }
    return '部分支持'
}
function Get-Key($row) { return (@($row.'1级分类',$row.'2级分类',$row.'3级分类',$row.'4级分类',$row.'5级分类') -join '|') }
function Release-Com($value) { if ($null -ne $value) { [Runtime.InteropServices.Marshal]::ReleaseComObject($value) | Out-Null } }
function Set-XlsxFreezePane([string]$path) {
    Add-Type -AssemblyName System.IO.Compression
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $archive=[IO.Compression.ZipFile]::Open($path,[IO.Compression.ZipArchiveMode]::Update)
    try {
        $entry=$archive.GetEntry('xl/worksheets/sheet1.xml')
        if (-not $entry) { throw 'XLSX 缺少 xl/worksheets/sheet1.xml。' }
        $reader=New-Object IO.StreamReader($entry.Open(),[Text.Encoding]::UTF8)
        try { [xml]$document=$reader.ReadToEnd() } finally { $reader.Dispose() }
        $namespace='http://schemas.openxmlformats.org/spreadsheetml/2006/main'
        $manager=New-Object Xml.XmlNamespaceManager($document.NameTable); $manager.AddNamespace('x',$namespace)
        $sheetView=$document.SelectSingleNode('/x:worksheet/x:sheetViews/x:sheetView',$manager)
        if (-not $sheetView) { throw 'XLSX 缺少 worksheet/sheetViews/sheetView。' }
        $pane=$sheetView.SelectSingleNode('x:pane',$manager)
        if (-not $pane) { $pane=$document.CreateElement('pane',$namespace); [void]$sheetView.PrependChild($pane) }
        $pane.SetAttribute('xSplit','13'); $pane.SetAttribute('ySplit','2'); $pane.SetAttribute('topLeftCell','N3')
        $pane.SetAttribute('activePane','bottomRight'); $pane.SetAttribute('state','frozen')
        foreach ($selection in @($sheetView.SelectNodes('x:selection',$manager))) { [void]$sheetView.RemoveChild($selection) }
        $selection=$document.CreateElement('selection',$namespace); $selection.SetAttribute('pane','bottomRight')
        $selection.SetAttribute('activeCell','N3'); $selection.SetAttribute('sqref','N3'); [void]$sheetView.AppendChild($selection)
        $entry.Delete(); $entry=$archive.CreateEntry('xl/worksheets/sheet1.xml',[IO.Compression.CompressionLevel]::Optimal)
        $settings=New-Object Xml.XmlWriterSettings; $settings.Encoding=New-Object Text.UTF8Encoding($false); $settings.Indent=$false
        $writer=[Xml.XmlWriter]::Create($entry.Open(),$settings)
        try { $document.Save($writer) } finally { $writer.Dispose() }
    } finally { $archive.Dispose() }
}

$apSupport = New-IdSet '1,4,6,9,12,14-25,33-36,38,40-59,62-83,104,108-109,112-115,117,119,130,132,134-135,139,194-195,197,199,203-205,212,223,225'
$apNo = New-IdSet '5,13,26,28,39,103,121,124-129,131,146-147,150,152,154,187,189,193,206-208,211,213-221,224,226'
$cvSupport = New-IdSet '1-2,4,6,9-10,12,14-15,17,19,21-25,33-36,38,40-59,62-83,104-105,108-109,112-115,117,119,130,132,135,194,196-197,199,204-205,225'
$cvNo = New-IdSet '5,13,26,28-32,39,103,121,124-129,131,133,136-141,146-147,150,152,154,187,189,192-193,206-208,211,213-221,224,226'
. ([scriptblock]::Create([IO.File]::ReadAllText((Join-Path $root 'visual-diag-feature-context.ps1'),[Text.Encoding]::UTF8)))
. ([scriptblock]::Create([IO.File]::ReadAllText((Join-Path $root 'huawei-dc-product-capabilities.ps1'),[Text.Encoding]::UTF8)))
. ([scriptblock]::Create([IO.File]::ReadAllText((Join-Path $root 'ampcon-dc-product-capabilities.ps1'),[Text.Encoding]::UTF8)))
function Get-Note($vendor,$state,$row,[int]$id) {
    $name=[string]$row.'4级分类'; $detail=[string]$row.'5级分类'
    if ($vendor -eq 'Apstra') {
        if ($state -eq '支持') {
            if ($id -ge 130) { return "$name：Apstra 6.1 通过 Blueprint 意图图、Anomaly/RCI、IBA、Revision 或 Time Voyager 原生覆盖该项；范围为 $detail。" }
            return "$name：Apstra 6.1 通过 Blueprint、Managed Devices、意图/实际状态和 Streaming Telemetry 原生覆盖；范围为 $detail。"
        }
        if ($state -like '不支持*') { return "$name：截至 Apstra 6.1 官方资料，未发现基础产品提供该项完整原生分析器或产品化闭环；未将 Juniper DCA/Mist、外部系统或 NOS 单点能力计入。" }
        if (($id -ge 84 -and $id -le 103) -or ($id -ge 170 -and $id -le 193)) { return "$name：可借助 NOS 计数器、Streaming Telemetry、定制 IBA Probe、Configlet 或外部 Flow/GPU 系统覆盖部分指标，不等同 Apstra 原生完整分析器。" }
        if (($id -ge 136 -and $id -le 169) -or ($id -ge 200 -and $id -le 212)) { return "$name：Blueprint 图、Anomaly/RCI、IBA、Revision 可提供部分证据，但未核验覆盖 $detail 的通用专用分析器。" }
        return "$name：Apstra 可覆盖部分对象或状态；完整字段、工作流或展示需定制 IBA、API、NOS Telemetry 或外部集成。"
    }
    if ($vendor -eq 'CloudVision') {
        if ($state -eq '支持') {
            if ($id -ge 130) { return "$name：CloudVision 原生状态流、Events、Designed/Running Compliance、Workspace/Change Control 或历史状态可核验覆盖该项；范围为 $detail。" }
            return "$name：CloudVision Inventory、Topology、NetDB/Telemetry、Events 或 Compliance 原生覆盖，主要面向受管 EOS 设备；范围为 $detail。"
        }
        if ($state -like '不支持*') { return "$name：截至当前 CloudVision 官方资料，未发现基础 CloudVision 原生提供该项完整能力；未把 AVA、CV UNO、CV-CUE、DMF 或 EOS CLI/ASIC 单点能力直接计入。" }
        if (($id -ge 84 -and $id -le 90) -or ($id -ge 170 -and $id -le 177)) { return "$name：CloudVision Flow Visibility 可覆盖部分场景，但依赖 EOS Flow Collector、流记录和平台配置，不能等同通用原生流量分析器。" }
        if (($id -ge 91 -and $id -le 102) -or ($id -ge 178 -and $id -le 191)) { return "$name：数据可来自 EOS/特定 ASIC、LANZ、队列或 PFC/ECN 计数器；CloudVision 展示和分析范围依硬件、EOS 版本与订阅，故仅部分支持。" }
        if ($id -eq 212) { return "$name：Workspace Build 可做输入、依赖与配置校验，但不等同数字孪生连通性仿真。" }
        return "$name：CloudVision 可提供部分遥测、事件或配置证据；覆盖 $detail 的完整产品化分析器、字段或闭环未核验。"
    }
    if ($vendor -eq 'Huawei') { return Get-HuaweiNote $state $name $detail $id }
    if ($vendor -eq 'AmpCon-DC') { return Get-AmpConDcNote $state $name $detail $id }
    throw "未知厂商：$vendor"
}

$legacyHeaders=@('1级分类','1级功能描述','2级分类','2级功能描述','3级分类','3级功能描述','4级分类','4级功能描述','5级分类','5级功能描述','Apstra支持状态','Apstra支持说明','CloudVision支持状态','CloudVision支持说明','iMaster NCE-Fabric + FabricInsight支持状态','iMaster NCE-Fabric + FabricInsight支持说明','AmpCon-DC（FS/Pica8）支持状态','AmpCon-DC（FS/Pica8）支持说明')
$expectedHeaders=@('1级分类','1级功能描述','2级分类','2级功能描述','3级分类','3级功能描述','4级分类','4级功能描述','5级分类','5级功能描述','关键技术点','典型场景','优先级','Apstra支持状态','Apstra支持说明','CloudVision支持状态','CloudVision支持说明','iMaster NCE-Fabric + FabricInsight支持状态','iMaster NCE-Fabric + FabricInsight支持说明','AmpCon-DC（FS/Pica8）支持状态','AmpCon-DC（FS/Pica8）支持说明')
$sourceRows=@(Import-Csv $csv -Encoding UTF8)
if ($sourceRows.Count -ne 229) { throw "CSV 应有 229 项，实际为 $($sourceRows.Count)" }
$actualHeaders=@($sourceRows[0].PSObject.Properties.Name)
$isLegacy=(($actualHeaders -join '|') -eq ($legacyHeaders -join '|'))
$isCurrent=(($actualHeaders -join '|') -eq ($expectedHeaders -join '|'))
if (-not $isLegacy -and -not $isCurrent) { throw 'CSV 表头或顺序异常；仅接受旧 18 列或当前 21 列结构。' }
$rows=@()
for ($i=0; $i -lt $sourceRows.Count; $i++) {
    $id=$i+1; $source=$sourceRows[$i]
    $ap=Get-State $id $apSupport $apNo; $cv=Get-State $id $cvSupport $cvNo
    $nce=Get-HuaweiState $id; $amp=Get-AmpConDcState $id
    $o=[ordered]@{}
    foreach ($name in $expectedHeaders) { $o[$name]=[string]$source.$name }
    if ($isLegacy -or [string]::IsNullOrWhiteSpace($o['关键技术点'])) { $o['关键技术点']=Get-KeyTechnology $source $id }
    if ($isLegacy -or [string]::IsNullOrWhiteSpace($o['典型场景'])) { $o['典型场景']=Get-TypicalScenario $source $id }
    if ($isLegacy -or [string]::IsNullOrWhiteSpace($o['优先级'])) { $o['优先级']=Get-Priority $source $id }
    $o['Apstra支持状态']=$ap; $o['Apstra支持说明']=Get-Note 'Apstra' $ap $source $id
    $o['CloudVision支持状态']=$cv; $o['CloudVision支持说明']=Get-Note 'CloudVision' $cv $source $id
    $o['iMaster NCE-Fabric + FabricInsight支持状态']=$nce; $o['iMaster NCE-Fabric + FabricInsight支持说明']=Get-Note 'Huawei' $nce $source $id
    $o['AmpCon-DC（FS/Pica8）支持状态']=$amp; $o['AmpCon-DC（FS/Pica8）支持说明']=Get-Note 'AmpCon-DC' $amp $source $id
    $rows += [pscustomobject]$o
}
$contextColumns=@('关键技术点','典型场景','优先级')
foreach ($column in $contextColumns) {
    $empty=@($rows|Where-Object{[string]::IsNullOrWhiteSpace($_.$column)}).Count
    if ($empty) { throw "$column 有 $empty 个空值" }
}
$invalidPriority=@($rows|Where-Object{$_.'优先级' -notin @('P0（核心）','P1（重要）','P2（演进）')})
if ($invalidPriority.Count) { throw "优先级存在 $($invalidPriority.Count) 个非法值。" }
$vendorColumns=@('Apstra支持状态','CloudVision支持状态','iMaster NCE-Fabric + FabricInsight支持状态','AmpCon-DC（FS/Pica8）支持状态')
foreach ($column in $vendorColumns) {
    $empty=@($rows|Where-Object{[string]::IsNullOrWhiteSpace($_.$column)}).Count
    if ($empty) { throw "$column 有 $empty 个空值" }
    Write-Output "[$column]"
    $rows|Group-Object $column|Sort-Object Name|ForEach-Object{Write-Output ("  {0}={1}" -f $_.Name,$_.Count)}
}
$ampSupportCount=@($rows|Where-Object{$_.'AmpCon-DC（FS/Pica8）支持状态' -eq '支持'}).Count
$ampPartialCount=@($rows|Where-Object{$_.'AmpCon-DC（FS/Pica8）支持状态' -eq '部分支持/依设备或版本'}).Count
$ampNoCount=@($rows|Where-Object{$_.'AmpCon-DC（FS/Pica8）支持状态' -eq '不支持/未发现原生支持'}).Count
if ($ampSupportCount -ne $AmpConDcSupportIds.Count -or $ampPartialCount -ne $AmpConDcPartialIds.Count -or ($ampSupportCount+$ampPartialCount+$ampNoCount) -ne 229) { throw 'AmpCon-DC 三态统计异常。' }
Write-Output '[优先级]'
$rows|Group-Object '优先级'|Sort-Object Name|ForEach-Object{Write-Output ("  {0}={1}" -f $_.Name,$_.Count)}
if (-not $Apply) { Write-Output "check=passed; schema=$(if($isLegacy){'legacy-18'}else{'current-21'}); rows=229; targetColumns=21; apply=false"; exit 0 }
if (Test-Path $lock) { throw '主 XLSX 正被 Excel/WPS 占用；未修改 CSV/XLSX。' }

$csvLines=@($rows|ConvertTo-Csv -NoTypeInformation)
[IO.File]::WriteAllLines($tempCsv,$csvLines,(New-Object Text.UTF8Encoding($true)))
$checkRows=@(Import-Csv $tempCsv -Encoding UTF8)
if ($checkRows.Count -ne 229 -or @($checkRows[0].PSObject.Properties).Count -ne 21) { throw '临时 CSV 229×21 尺寸校验失败。' }
Copy-Item $csv $backupCsv -Force
Copy-Item $xlsx $backupXlsx -Force
$excel=$null; $wb=$null; $ws=$null; $range=$null; $mutating=$false; $success=$false
$yellow=255+(242*256)+(204*65536); $red=244+(204*256)+(204*65536)
try {
    $excel=New-Object -ComObject Excel.Application
    $excel.Visible=$false; $excel.DisplayAlerts=$false
    $wb=$excel.Workbooks.Open($xlsx,0,$false)
    if ($wb.ReadOnly) { throw '主 XLSX 当前为只读或仍被占用。' }
    $ws=$wb.Worksheets.Item(1)
    $sheetRows=$ws.UsedRange.Rows.Count; $sheetColumns=$ws.UsedRange.Columns.Count
    if ($sheetRows -ne 231 -or $sheetColumns -notin @(18,21)) { throw "XLSX 尺寸异常：${sheetRows}x${sheetColumns}" }
    for ($r=0; $r -lt $rows.Count; $r++) {
        $sheetKey=@($ws.Cells.Item($r+3,1).Value2,$ws.Cells.Item($r+3,3).Value2,$ws.Cells.Item($r+3,5).Value2,$ws.Cells.Item($r+3,7).Value2,$ws.Cells.Item($r+3,9).Value2) -join '|'
        if ($sheetKey -ne (Get-Key $rows[$r])) { throw "XLSX/CSV 第 $($r+1) 项功能键不一致。" }
    }
    $mutating=$true
    $ws.UsedRange.UnMerge()
    $ws.Range('A1:U231').Clear()|Out-Null
    $matrix=[Array]::CreateInstance([object],[int[]]@(231,21))
    $h1=@('1级分类','','2级分类','','3级分类','','4级分类','','5级分类','','关键技术点','典型场景','优先级','Apstra','','CloudVision','','iMaster NCE-Fabric + FabricInsight','','AmpCon-DC（FS / Pica8）','')
    $h2=@('功能点','功能描述','功能点','功能描述','功能点','功能描述','功能点','功能描述','功能点','功能描述','','','','支持状态','支持说明','支持状态','支持说明','支持状态','支持说明','支持状态','支持说明')
    for ($c=0; $c -lt 21; $c++) { $matrix[0,$c]=$h1[$c]; $matrix[1,$c]=$h2[$c] }
    for ($r=0; $r -lt 229; $r++) { for ($c=0; $c -lt 21; $c++) { $matrix[($r+2),$c]=[string]$rows[$r].$($expectedHeaders[$c]) } }
    $range=$ws.Range($ws.Cells.Item(1,1),$ws.Cells.Item(231,21))
    $range.NumberFormat='@'; $range.Value2=$matrix; $range.Font.Name='Microsoft YaHei'; $range.Font.Size=9
    $range.WrapText=$true; $range.VerticalAlignment=-4160; $range.Borders.LineStyle=1; $range.Borders.Color=0xD9D9D9
    foreach ($pair in @('A1:B1','C1:D1','E1:F1','G1:H1','I1:J1','K1:K2','L1:L2','M1:M2','N1:O1','P1:Q1','R1:S1','T1:U1')) { $ws.Range($pair).Merge() }
    $ws.Range('A1:M2').Interior.Color=0xCCFFFF; $ws.Range('N1:O2').Interior.Color=0xD9EAD3
    $ws.Range('P1:Q2').Interior.Color=0xFFF2CC; $ws.Range('R1:S2').Interior.Color=0xDDEBF7; $ws.Range('T1:U2').Interior.Color=0xEADCF8
    $ws.Range('A1:U2').Font.Bold=$true; $ws.Range('A1:U2').HorizontalAlignment=-4108
    foreach ($c in @(1,3,5,7,9)) { $ws.Columns.Item($c).ColumnWidth=22 }
    foreach ($c in @(2,4,6,8,10)) { $ws.Columns.Item($c).ColumnWidth=42 }
    $ws.Columns.Item(11).ColumnWidth=42; $ws.Columns.Item(12).ColumnWidth=42; $ws.Columns.Item(13).ColumnWidth=12
    foreach ($c in @(14,16,18,20)) { $ws.Columns.Item($c).ColumnWidth=22 }
    foreach ($c in @(15,17,19,21)) { $ws.Columns.Item($c).ColumnWidth=46 }
    $ws.Rows.Item(1).RowHeight=24; $ws.Rows.Item(2).RowHeight=22
    $ws.Range('N3:U231').Interior.Pattern=-4142
    for ($r=0; $r -lt 229; $r++) {
        for ($v=0; $v -lt 4; $v++) {
            $status=[string]$rows[$r].$($vendorColumns[$v]); $pair=$ws.Range($ws.Cells.Item($r+3,14+$v*2),$ws.Cells.Item($r+3,15+$v*2))
            if ($status -like '部分支持*') { $pair.Interior.Color=$yellow }
            elseif ($status -like '不支持*' -or $status -eq '未发现公开证据') { $pair.Interior.Color=$red }
            Release-Com $pair
        }
    }
    $ws.Activate()|Out-Null; $window=$wb.Windows.Item(1); $window.FreezePanes=$false; $window.SplitRow=0; $window.SplitColumn=0; $excel.Goto($ws.Range('N3'),$true); $window.SplitRow=2; $window.SplitColumn=13; $window.FreezePanes=$true; $window.Zoom=85
    $wb.Save(); $wb.Close($true); Release-Com $range; $range=$null; Release-Com $ws; $ws=$null; Release-Com $wb; $wb=$null
    Set-XlsxFreezePane $xlsx
    Move-Item $tempCsv $csv -Force

    $wb=$excel.Workbooks.Open($xlsx,0,$true); $ws=$wb.Worksheets.Item(1)
    if ($ws.UsedRange.Rows.Count -ne 231 -or $ws.UsedRange.Columns.Count -ne 21) { throw "更新后 XLSX 尺寸异常：$($ws.UsedRange.Rows.Count)x$($ws.UsedRange.Columns.Count)" }
    $diffs=0; $yellowCells=0; $redCells=0
    for ($r=0; $r -lt 229; $r++) {
        for ($c=0; $c -lt 21; $c++) { if ([string]$ws.Cells.Item($r+3,$c+1).Value2 -ne [string]$rows[$r].$($expectedHeaders[$c])) { $diffs++ } }
        for ($v=0; $v -lt 4; $v++) {
            $color=[int]$ws.Cells.Item($r+3,14+$v*2).Interior.Color
            if ($color -eq $yellow) { $yellowCells+=2 } elseif ($color -eq $red) { $redCells+=2 }
        }
    }
    if ($diffs) { throw "XLSX/CSV 全量比对发现 $diffs 处差异。" }
    $expectedYellow=2*@($rows|ForEach-Object{@($_.'Apstra支持状态',$_.'CloudVision支持状态',$_.'iMaster NCE-Fabric + FabricInsight支持状态',$_.'AmpCon-DC（FS/Pica8）支持状态')}|Where-Object{$_ -like '部分支持*'}).Count
    $expectedRed=2*@($rows|ForEach-Object{@($_.'Apstra支持状态',$_.'CloudVision支持状态',$_.'iMaster NCE-Fabric + FabricInsight支持状态',$_.'AmpCon-DC（FS/Pica8）支持状态')}|Where-Object{$_ -like '不支持*' -or $_ -eq '未发现公开证据'}).Count
    if ($yellowCells -ne $expectedYellow -or $redCells -ne $expectedRed) { throw "填充色校验失败：yellow=$yellowCells/$expectedYellow red=$redCells/$expectedRed" }
    $ws.Activate()|Out-Null; $window=$wb.Windows.Item(1)
    if (-not $window.FreezePanes -or $window.SplitRow -ne 2 -or $window.SplitColumn -ne 13) { throw "冻结窗格校验失败：freeze=$($window.FreezePanes) splitRow=$($window.SplitRow) splitColumn=$($window.SplitColumn)" }
    $checkRows=@(Import-Csv $csv -Encoding UTF8)
    if ($checkRows.Count -ne 229 -or @($checkRows[0].PSObject.Properties).Count -ne 21) { throw '主 CSV 更新后尺寸校验失败。' }
    $success=$true
    Write-Output "updated=$xlsx"; Write-Output 'rows=229; columns=21; diffs=0'; Write-Output "yellowCells=$yellowCells; redCells=$redCells"
} catch {
    if ($mutating) {
        if ($wb) { try{$wb.Close($false)}catch{}; Release-Com $wb; $wb=$null }
        if ($ws) { Release-Com $ws; $ws=$null }
        if (Test-Path $backupCsv) { Copy-Item $backupCsv $csv -Force }
        if (Test-Path $backupXlsx) { Copy-Item $backupXlsx $xlsx -Force }
    }
    throw
} finally {
    if ($range) { Release-Com $range }
    if ($ws) { Release-Com $ws }
    if ($wb) { try{$wb.Close($false)}catch{}; Release-Com $wb }
    if ($excel) { try{$excel.Quit()}catch{}; Release-Com $excel }
    [GC]::Collect(); [GC]::WaitForPendingFinalizers()
    foreach ($path in @($tempCsv,$backupCsv,$backupXlsx)) { if (Test-Path $path) { Remove-Item $path -Force } }
}
if (-not $success) { throw '更新未完成。' }