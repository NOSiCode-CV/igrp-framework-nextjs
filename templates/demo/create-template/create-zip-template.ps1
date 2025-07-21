# create-template/create-zip-template.ps1

# === CONFIG ===
$zipName = "igrp-next-template.zip"
$excludeFolders = @(".next", "node_modules", ".git", "create-template")
$excludeTemp = "_excluded"

# === READ VERSION FROM package.json ===
try {
  $packageJson = Get-Content "./package.json" -Raw | ConvertFrom-Json
  $version = $packageJson.version
} catch {
  Write-Host "Failed to read version from package.json. Ensure it's valid JSON."
  exit 1
}

# === FINAL NEXUS TARGET ===
$nexusRepo = "igrp-templates"
$nexusBaseUrl = "https://sonatype.nosi.cv/repository"
$groupPath = "com/igrp/igrp-next-template/$version"
$nexusUploadUrl = "$nexusBaseUrl/$nexusRepo/$groupPath/$zipName"

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

# Remove existing zip if it exists
if (Test-Path $zipName) {
  Remove-Item $zipName -Force
}

# Collect all items except _excluded
$itemsToZip = Get-ChildItem -Force | Where-Object { $_.Name -ne $excludeTemp }
Compress-Archive -Path $itemsToZip.FullName -DestinationPath $zipName -Force

# Restore excluded items
Move-Item "$excludeTemp\*" . -Force
Remove-Item $excludeTemp -Recurse -Force

Write-Host "Created ZIP: $zipName"

# === LOAD CREDENTIALS FROM FILE ===
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