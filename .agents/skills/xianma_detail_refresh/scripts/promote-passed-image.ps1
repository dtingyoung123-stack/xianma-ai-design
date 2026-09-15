param(
  [Parameter(Mandatory = $true)][string]$GeneratedPath,
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [Parameter(Mandatory = $true)][string]$QualityRecordPath,
  [Parameter(Mandatory = $true)][string]$OutputPath
)

$ErrorActionPreference = 'Stop'
$record = Get-Content -Raw $QualityRecordPath | ConvertFrom-Json
$requiredChecks = @('product', 'physical_fit', 'copy', 'role', 'group_consistency')

foreach ($check in $requiredChecks) {
  if ($record.quality.$check -ne 'pass') {
    throw "Quality gate '$check' is not pass. Result promotion blocked."
  }
}

$normalizer = Join-Path $PSScriptRoot 'normalize-image-size.ps1'
& $normalizer -GeneratedPath $GeneratedPath -SourcePath $SourcePath -OutputPath $OutputPath
