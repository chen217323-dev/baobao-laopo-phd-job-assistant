$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$zip = Join-Path $root "baobao-laopo-phd-job-assistant-github-upload.zip"

if (Test-Path $zip) {
  Remove-Item $zip -Force
}

$items = @(
  ".github",
  "api",
  "outputs",
  "work",
  "README.md",
  "DEPLOYMENT.md",
  "package.json",
  "vercel.json",
  ".gitignore"
)

$paths = $items | ForEach-Object { Join-Path $root $_ }
Compress-Archive -Path $paths -DestinationPath $zip
Write-Host "Created: $zip"
