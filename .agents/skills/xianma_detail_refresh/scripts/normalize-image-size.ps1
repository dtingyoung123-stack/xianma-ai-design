param(
  [Parameter(Mandatory = $true)][string]$GeneratedPath,
  [Parameter(Mandatory = $true)][string]$SourcePath,
  [Parameter(Mandatory = $true)][string]$OutputPath,
  [double]$AspectRatioTolerance = 0.01
)

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$generated = [System.Drawing.Image]::FromFile((Resolve-Path $GeneratedPath))
$source = [System.Drawing.Image]::FromFile((Resolve-Path $SourcePath))

try {
  $generatedRatio = $generated.Width / $generated.Height
  $sourceRatio = $source.Width / $source.Height
  $ratioDelta = [Math]::Abs($generatedRatio - $sourceRatio)

  if ($ratioDelta -gt $AspectRatioTolerance) {
    throw "Aspect ratio mismatch ($ratioDelta) exceeds tolerance ($AspectRatioTolerance). Recompose instead of stretching."
  }

  $outputDirectory = Split-Path -Parent $OutputPath
  if ($outputDirectory) {
    New-Item -ItemType Directory -Force $outputDirectory | Out-Null
  }

  $bitmap = New-Object System.Drawing.Bitmap($source.Width, $source.Height)
  try {
    $bitmap.SetResolution($source.HorizontalResolution, $source.VerticalResolution)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.DrawImage($generated, 0, 0, $source.Width, $source.Height)
    } finally {
      $graphics.Dispose()
    }
    $bitmap.Save($OutputPath, [System.Drawing.Imaging.ImageFormat]::Png)
  } finally {
    $bitmap.Dispose()
  }
} finally {
  $generated.Dispose()
  $source.Dispose()
}

Write-Output $OutputPath
