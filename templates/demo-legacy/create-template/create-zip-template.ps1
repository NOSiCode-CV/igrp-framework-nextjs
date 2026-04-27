# create-template/create-zip-template.ps1

# === CONFIG ===
$zipName = "igrp-next-template.zip"
$excludeFolders = @(".next", "node_modules", ".git", "create-template", ".env", ".env.docker")
# The full .igrpmigrations/ tree (guides + payloads) is managed by the source
# repo and bundled into @igrp/template-migrator — it must NOT go into the zip.
# We move it out and replace it with a slim folder containing only lock.json,
# so consumers of the template immediately see all migrations as applied.
$excludeTemp = "_excluded"
$migrationsDir = ".igrpmigrations"
$migrationsLock = ".igrpmigrations/lock.json"

# === READ VERSION FROM package.json ===
$packageJsonPath = "./package.json"
$packageJsonRaw = $null
$packageJson = $null
$version = $null
$packageJsonSanitized = $false

try {
  $packageJsonRaw = Get-Content $packageJsonPath -Raw
  $packageJson = $packageJsonRaw | ConvertFrom-Json
  $version = $packageJson.version
} catch {
  Write-Host "Failed to read version from package.json. Ensure it's valid JSON."
  exit 1
}

# === REMOVE publish:template SCRIPT BEFORE ZIPPING ===
if ($packageJson.scripts -and $packageJson.scripts.PSObject.Properties.Name -contains "publish:template") {
  $packageJson.scripts.PSObject.Properties.Remove("publish:template")
  try {
    $packageJson | ConvertTo-Json -Depth 32 | Set-Content -Path $packageJsonPath -Encoding UTF8
    $packageJsonSanitized = $true
  } catch {
    Write-Host "Failed to sanitize package.json."
    if ($packageJsonRaw) {
      Set-Content -Path $packageJsonPath -Value $packageJsonRaw -Encoding UTF8
    }
    exit 1
  }
}

# === FINAL NEXUS TARGET ===
$nexusRepo = "igrp-templates"
$nexusBaseUrl = "https://sonatype.nosi.cv/repository"
$groupPath = "@igrp/framework-next/$version"
$nexusUploadUrl = "$nexusBaseUrl/$nexusRepo/$groupPath/$zipName"

# === LOAD CREDENTIALS FROM FILE (BEFORE MOVING FOLDERS) ===
$authFile = "create-template/nexus-auth.txt"
if (-not (Test-Path $authFile)) {
  Write-Host "Auth file '$authFile' not found."
  exit 1
}

$authLines = Get-Content $authFile | Where-Object { $_ -match '=' }
$authMap = @{}
foreach ($line in $authLines) {
  $parts = $line -split '=', 2
  if ($parts.Count -eq 2) {
    $key = $parts[0].Trim()
    $val = $parts[1].Trim()
    $authMap[$key] = $val
  }
}

$username = $authMap["username"]
$password = $authMap["password"]

if (-not $username -or -not $password) {
  Write-Host "username or password missing in nexus-auth.txt"
  exit 1
}

try {
  Write-Host "Zipping project for version: $version"
  Write-Host "Upload target: $nexusUploadUrl"

  # === ZIPPING ===
  if (-not (Test-Path $excludeTemp)) {
    New-Item -ItemType Directory -Path $excludeTemp | Out-Null
  }

  foreach ($folder in $excludeFolders) {
    if (Test-Path $folder) {
      Move-Item -Path $folder -Destination $excludeTemp -Force
    }
  }

  # Also move this script itself out of zip
  $scriptPath = "create-template/create-zip-template.ps1"
  if (Test-Path $scriptPath) {
    Move-Item -Path $scriptPath -Destination $excludeTemp -Force
  }

  # === SLIM .igrpmigrations/ ===
  # Move the full folder (guides + payloads) to _excluded, then create a
  # minimal replacement containing only lock.json so the zip ships a clean
  # template that is already fully up-to-date per the migrator.
  if (Test-Path $migrationsDir) {
    Move-Item -Path $migrationsDir -Destination $excludeTemp -Force
  }
  New-Item -ItemType Directory -Path $migrationsDir | Out-Null
  $lockSource = "$excludeTemp/$migrationsDir/lock.json"
  if (Test-Path $lockSource) {
    Copy-Item -Path $lockSource -Destination $migrationsLock -Force
    Write-Host "Included slim .igrpmigrations/lock.json in zip"
  } else {
    Write-Host "Warning: lock.json not found at $lockSource — .igrpmigrations/ will be empty in zip"
  }

  # Remove existing zip if it exists
  if (Test-Path $zipName) {
    Remove-Item $zipName -Force
  }

  # Collect all items except _excluded
  $itemsToZip = Get-ChildItem -Force | Where-Object { $_.Name -ne $excludeTemp }
  Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipName -Force

  Write-Host "Created ZIP: $zipName"

  # === UPLOAD ZIP TO NEXUS ===
  Write-Host "Uploading to Nexus..."
  $logPath = "$env:TEMP\nexus-upload.log"
  $curlCmd = "curl.exe -v -u ${username}:`"${password}`" --upload-file `"$zipName`" `"$nexusUploadUrl`" > `"$logPath`" 2>&1"
  Invoke-Expression $curlCmd

  # === PARSE RESPONSE ===
  $logContent = Get-Content $logPath
  $statusLine = $logContent | Where-Object { $_ -match '^< HTTP/' }

  if ($statusLine -match 'HTTP/\d\.\d\s+(?<code>\d{3})') {
    $statusCode = [int]$Matches['code']
    if ($statusCode -ge 200 -and $statusCode -lt 300) {
      Write-Host "Upload successful! HTTP $statusCode"
      Write-Host "File URL: $nexusUploadUrl"
    } else {
      Write-Host "Upload failed. HTTP $statusCode"
      Write-Host "Check log: $logPath"
    }
  } else {
    Write-Host "Could not determine HTTP status code."
    Write-Host "Check log: $logPath"
  }
} finally {
  # Remove the slim .igrpmigrations/ we created for the zip before restoring
  # the full original folder from _excluded.
  if (Test-Path $migrationsDir) {
    Remove-Item $migrationsDir -Recurse -Force
  }

  if (Test-Path $excludeTemp) {
    Get-ChildItem -Path $excludeTemp -Force | ForEach-Object {
      Move-Item -Path $_.FullName -Destination . -Force
    }
    Remove-Item $excludeTemp -Recurse -Force
  }

  if ($packageJsonSanitized -and $packageJsonRaw) {
    Set-Content -Path $packageJsonPath -Value $packageJsonRaw -Encoding UTF8
  }
}