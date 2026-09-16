param([switch]$ValidateOnly)
$ErrorActionPreference='Stop'
$root=Split-Path -Parent $MyInvocation.MyCommand.Path
$revalidate=Join-Path $root 'revalidate-current-visual-diag-matrix.ps1'
if (-not (Test-Path $revalidate)) { throw "缺少主矩阵重校验脚本：$revalidate" }
if ($ValidateOnly) {
    & $revalidate
} else {
    & $revalidate -Apply
}
