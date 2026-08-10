$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert -ErrorAction SilentlyContinue |
  Where-Object { $_.Subject -eq "CN=Core Learn Dev" } |
  Select-Object -First 1

if (-not $cert) {
  Write-Warning "No Core Learn Dev cert found; skipping signing."
  exit 0
}

$targets = Get-ChildItem "$root\src-tauri\target\release" -Include "*.exe","*.dll" -File -ErrorAction SilentlyContinue
$bundle = Get-ChildItem "$root\src-tauri\target\release\bundle" -Recurse -Include "*.exe","*.msi" -File -ErrorAction SilentlyContinue
foreach ($file in @($targets) + @($bundle)) {
  try {
    $sig = Set-AuthenticodeSignature -FilePath $file.FullName -Certificate $cert
    Write-Output "$($file.Name)=$($sig.Status)"
  } catch {
    Write-Warning "Failed to sign $($file.FullName): $_"
  }
}
