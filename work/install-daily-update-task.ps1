$ErrorActionPreference = "Stop"

$taskName = "BaobaoLaopoPhDJobAssistantDailyUpdate"
$root = Split-Path -Parent $PSScriptRoot
$script = Join-Path $root "work\crawler\run-crawler.ps1"

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`""

$trigger = New-ScheduledTaskTrigger -Daily -At 8:00AM
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable

Register-ScheduledTask `
  -TaskName $taskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "每天早上自动更新宝宝老婆博士求职助手岗位数据" `
  -Force

Write-Host "Installed daily update task: $taskName"
Write-Host "It will run every day at 08:00."
