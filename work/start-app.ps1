$ErrorActionPreference = "Stop"
$node = "C:\Users\Administrator\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root
& $node "work\serve-outputs.mjs"
