$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$revalidate = Join-Path $root 'revalidate-current-visual-diag-matrix.ps1'

# Keep the legacy entry point, but use the canonical, validated FS/Pica8 product-evidence pipeline.
& $revalidate -Apply
if (-not $?) { throw 'AmpCon-DC matrix update failed.' }
