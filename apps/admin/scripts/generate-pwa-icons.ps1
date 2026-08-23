Add-Type -AssemblyName System.Drawing

$srcPath = $args[0]
if (-not $srcPath) {
  Write-Error "Usage: generate-pwa-icons.ps1 <source-png>"
  exit 1
}

$outDir = Join-Path $PSScriptRoot "..\public\icons"
$fileImg = [System.Drawing.Image]::FromFile((Resolve-Path $srcPath))
$src = New-Object System.Drawing.Bitmap $fileImg
$fileImg.Dispose()

function Write-PwaIcon {
  param(
    [int]$Size,
    [string]$FileName,
    [double]$Scale = 1,
    [switch]$KeepRoundedShape
  )

  $format = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb
  $bmp = New-Object System.Drawing.Bitmap $Size, $Size, $format
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.CompositingMode = [System.Drawing.Drawing2D.CompositingMode]::SourceOver
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality

  if ($KeepRoundedShape) {
    $g.Clear([System.Drawing.Color]::Transparent)
  } else {
    $g.Clear([System.Drawing.Color]::White)
  }

  $inner = [int]($Size * $Scale)
  $offset = [int](($Size - $inner) / 2)
  $g.DrawImage($src, $offset, $offset, $inner, $inner)
  $g.Dispose()

  $dest = Join-Path $outDir $FileName
  $bmp.Save($dest, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Output "Wrote $FileName ${Size}x${Size} $(if ($KeepRoundedShape) { 'rounded+alpha' } else { 'maskable' })"
}

# "any" icons keep the squircle (transparent corners)
Write-PwaIcon -Size 192 -FileName "icon-192x192.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 512 -FileName "icon-512x512.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 180 -FileName "apple-touch-icon.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 16 -FileName "icon-16x16.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 32 -FileName "icon-32x32.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 48 -FileName "icon-48x48.png" -Scale 1 -KeepRoundedShape
Write-PwaIcon -Size 256 -FileName "icon-256x256.png" -Scale 1 -KeepRoundedShape

# Maskable icons must fill the square; OS applies its own round mask
Write-PwaIcon -Size 192 -FileName "icon-maskable-192x192.png" -Scale 0.72
Write-PwaIcon -Size 512 -FileName "icon-maskable-512x512.png" -Scale 0.72

$src.Dispose()
