$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$env:Path = "$env:USERPROFILE\.cargo\bin;" + $env:Path

# Free vite port if occupied
$conn = Get-NetTCPConnection -LocalPort 1420 -ErrorAction SilentlyContinue
if ($conn) {
  $conn | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
  Start-Sleep -Seconds 1
}

$npm = (Get-Command npm.cmd).Source
$vite = Start-Process -FilePath $npm -ArgumentList "run", "dev" -WorkingDirectory $root -PassThru -WindowStyle Hidden

Set-Location "$root\src-tauri"
cargo build
Set-Location $root

try {
  & "$PSScriptRoot\sign-and-run.ps1" (Resolve-Path "$root\src-tauri\target\debug\core-learn.exe")
} finally {
  if ($vite -and -not $vite.HasExited) {
    Stop-Process -Id $vite.Id -Force -ErrorAction SilentlyContinue
  }
}
