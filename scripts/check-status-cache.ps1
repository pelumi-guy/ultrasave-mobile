param([string]$Serial = 'emulator-5554')
$ErrorActionPreference = 'Stop'
$adbPath = Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'
if (!(Test-Path -LiteralPath $adbPath)) { throw 'Android SDK platform-tools not found. Install Android Studio SDK tools first.' }
& $adbPath -s $Serial shell ls -ald /storage/emulated/0/Android/media/com.whatsapp/WhatsApp/Media/.Statuses
Write-Output 'This checks directory existence only. No status content was opened or modified.'
Write-Output 'If it exists but is absent in the file manager, enable Show hidden files. Grant UltraSave the Media parent folder.'
