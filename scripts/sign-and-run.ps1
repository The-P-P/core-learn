param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [string[]]$Command
)

$ErrorActionPreference = "Stop"
$exe = $Command[0]
$argsRest = @()
if ($Command.Length -gt 1) {
  $argsRest = $Command[1..($Command.Length - 1)]
}

$cert = Get-ChildItem Cert:\CurrentUser\My -CodeSigningCert -ErrorAction SilentlyContinue |
  Where-Object { $_.Subject -eq "CN=Core Learn Dev" } |
  Select-Object -First 1

if (-not $cert) {
  $cert = New-SelfSignedCertificate `
    -Type CodeSigningCert `
    -Subject "CN=Core Learn Dev" `
    -CertStoreLocation Cert:\CurrentUser\My `
    -KeyExportPolicy Exportable `
    -NotAfter (Get-Date).AddYears(5)
}

$targets = @($exe)
$dll = Join-Path (Split-Path $exe -Parent) "core_learn_lib.dll"
if (Test-Path $dll) { $targets += $dll }

foreach ($file in $targets) {
  try {
    Set-AuthenticodeSignature -FilePath $file -Certificate $cert | Out-Null
  } catch {
    Write-Warning "Could not sign $file : $_"
  }
}

& $exe @argsRest
exit $LASTEXITCODE
