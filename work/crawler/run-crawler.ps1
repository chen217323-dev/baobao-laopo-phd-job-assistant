$ErrorActionPreference = "Stop"
$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $root
& $node "work\crawler\crawl-jobs.mjs"
Write-Host "Done. Open outputs\baobao-laopo-mobile-detailed.html to view the refreshed jobs."
