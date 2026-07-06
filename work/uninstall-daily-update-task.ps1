$ErrorActionPreference = "Stop"
$taskName = "BaobaoLaopoPhDJobAssistantDailyUpdate"
Unregister-ScheduledTask -TaskName $taskName -Confirm:$false
Write-Host "Removed daily update task: $taskName"
