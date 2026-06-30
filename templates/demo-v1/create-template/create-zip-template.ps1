# create-template/create-zip-template.ps1

# === CONFIG ===
$zipName = "igrp-next-template.zip"
$excludeFolders = @(".next", "node_modules", ".git", "create-template", ".env", ".env.docker", "CHANGELOG.md", "superpowers", "CLAUDE.md")
# The template ships its migration state as a single flat file at the root,
# .igrp-migrations-lock.json. It is a normal tracked file and is not excluded,
# so it lands in the zip automatically and consumers immediately see all
# migrations as applied. The full migration tree (guides + payloads) lives only
# in the source repo / @igrp/template-migrator and never ships in the template.
$excludeTemp = "_excluded"

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

# === BUILD WORKSPACE VERSION MAP ===
# Scan <monorepo-root>/packages/**/package.json (2 levels up from template dir)
# and build a name->version table so workspace:* deps can be resolved to exact versions.
$monorepoRoot = Resolve-Path (Join-Path $PSScriptRoot "../../..")
$workspaceVersions = @{}

Get-ChildItem -Path (Join-Path $monorepoRoot "packages") -Recurse -Filter "package.json" |
  Where-Object { $_.FullName -notmatch "[\\/]node_modules[\\/]" } |
  ForEach-Object {
    try {
      $pkg = Get-Content $_.FullName -Raw | ConvertFrom-Json
      if ($pkg.name -and $pkg.version) {
        $workspaceVersions[$pkg.name] = $pkg.version
      }
    } catch {
      Write-Host "Warning: could not parse $($_.FullName)"
    }
  }

Write-Host "Resolved $($workspaceVersions.Count) workspace package(s):"
foreach ($kv in $workspaceVersions.GetEnumerator() | Sort-Object Key) {
  Write-Host "  $($kv.Key) -> $($kv.Value)"
}

# === RESOLVE workspace:* IN TEMPLATE package.json ===
function Resolve-WorkspaceDeps {
  param($depsObject, [hashtable]$versionMap)
  if (-not $depsObject) { return }
  foreach ($prop in @($depsObject.PSObject.Properties)) {
    if ($prop.Value -eq "workspace:*") {
      if ($versionMap.ContainsKey($prop.Name)) {
        $resolved = $versionMap[$prop.Name]
        $prop.Value = $resolved
        Write-Host "  Resolved: $($prop.Name)  workspace:*  ->  $resolved"
      } else {
        Write-Host "  Warning: $($prop.Name) uses workspace:* but was not found in packages/ - left as-is"
      }
    }
  }
}

Write-Host "Resolving workspace:* dependencies..."
Resolve-WorkspaceDeps -depsObject $packageJson.dependencies    -versionMap $workspaceVersions
Resolve-WorkspaceDeps -depsObject $packageJson.devDependencies -versionMap $workspaceVersions

# === REMOVE publish:template SCRIPT BEFORE ZIPPING ===
if ($packageJson.scripts -and $packageJson.scripts.PSObject.Properties.Name -contains "publish:template") {
  $packageJson.scripts.PSObject.Properties.Remove("publish:template")
}

# Write the sanitized + resolved package.json to disk (restored in finally block)
try {
  $packageJson | ConvertTo-Json -Depth 32 | Set-Content -Path $packageJsonPath -Encoding UTF8
  $packageJsonSanitized = $true
} catch {
  Write-Host "Failed to write resolved package.json."
  if ($packageJsonRaw) {
    Set-Content -Path $packageJsonPath -Value $packageJsonRaw -Encoding UTF8
  }
  exit 1
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

# Initialize state used by the finally block before entering try, so it's
# defined even if an exception fires before the skill-injection step.
$skillInjected     = $false
$skillTargetAgents = ".agents/skills/igrp-design-system"
$skillTargetClaude = ".claude/skills/igrp-design-system"

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

  # === INJECT IGRP DESIGN-SYSTEM SKILL ===
  # Bundle the design-system skill so consumers of the template have AI context
  # for every supported tool (Claude Code via .claude/, Cursor / Codex / Trae /
  # Copilot via the static bridge files committed in the template, all reading
  # from the canonical at .agents/skills/igrp-design-system/).
  # Source of truth is the plugin at <monorepo>/plugins/igrp/skills/design-system/.
  # These dirs are tracked via $skillInjected and removed in the finally block
  # so the monorepo working tree is unchanged after the script runs.
  $skillSource         = Join-Path $monorepoRoot "plugins/igrp/skills/design-system"
  $skillTargetAgents   = ".agents/skills/igrp-design-system"
  $skillTargetClaude   = ".claude/skills/igrp-design-system"
  $skillInjected       = $false

  if (Test-Path $skillSource) {
    # Copy canonical content into .agents/skills/igrp-design-system/
    if (Test-Path $skillTargetAgents) { Remove-Item $skillTargetAgents -Recurse -Force }
    New-Item -ItemType Directory -Path $skillTargetAgents -Force | Out-Null
    Copy-Item -Path "$skillSource/*" -Destination $skillTargetAgents -Recurse -Force

    # Patch the copied SKILL.md frontmatter: in the plugin the skill is named
    # `design-system` (invoked as /igrp:design-system); in the standalone
    # template context the folder is `igrp-design-system` so the frontmatter
    # `name` must match.
    $copiedSkillPath = Join-Path $skillTargetAgents "SKILL.md"
    $skillRaw = Get-Content $copiedSkillPath -Raw
    $skillRaw = $skillRaw -replace '(?m)^name:\s*design-system\s*$', 'name: igrp-design-system'
    Set-Content -Path $copiedSkillPath -Value $skillRaw -Encoding UTF8

    # Extract the canonical `description` for the Claude Code thin pointer so
    # triggering parity is preserved without duplicating the body of SKILL.md.
    $descMatch = [regex]::Match($skillRaw, '(?ms)^---\s*\r?\n.*?^description:\s*(.*?)\s*\r?\n(?:[a-zA-Z][a-zA-Z0-9_-]*:|---)')
    $skillDescription = if ($descMatch.Success) {
      $descMatch.Groups[1].Value.Trim()
    } else {
      "IGRP design system usage skill — three-layer picker (Horizon / Primitives / Custom) and source-verified prop shapes for the @igrp/igrp-framework-react-design-system UI kit."
    }

    # Write the Claude Code thin pointer at .claude/skills/igrp-design-system/SKILL.md.
    # It carries the canonical description in its frontmatter (so model-invocation
    # triggers fire) but the body just instructs the model to read the canonical
    # SKILL.md at .agents/skills/igrp-design-system/. Single source of truth.
    if (Test-Path $skillTargetClaude) { Remove-Item $skillTargetClaude -Recurse -Force }
    New-Item -ItemType Directory -Path $skillTargetClaude -Force | Out-Null
    $pointer = @"
---
name: igrp-design-system
description: $skillDescription
---

# IGRP design system (pointer)

The canonical content for this skill lives at ``.agents/skills/igrp-design-system/``. **Read ``.agents/skills/igrp-design-system/SKILL.md`` and follow its instructions** before writing any UI code — it documents the three-layer picker (Horizon / Custom / Primitives), the repo-wide UI hard rules, and source-verified prop shapes for the `@igrp/igrp-framework-react-design-system` package.

Deep references are at ``.agents/skills/igrp-design-system/references/``. Load only the family relevant to your task:

- ``forms.md`` — ``IGRPForm`` + Zod + all ``IGRPInput*``
- ``data-table.md`` — ``IGRPDataTable`` + ``createIGRPColumnHelper`` + the ``actions`` prop
- ``charts.md`` — ``IGRPAreaChart`` / ``IGRPVerticalBarChart`` / ``IGRPLineChart`` etc.
- ``horizon.md`` — shared ``IGRPInputProps``, naming conventions
- ``primitives.md`` — when to drop down, CVA variants
- ``utilities.md`` — ``cn()``, ``IGRPColors``, hooks
- ``custom.md`` — domain pieces
"@
    Set-Content -Path "$skillTargetClaude/SKILL.md" -Value $pointer -Encoding UTF8
    $skillInjected = $true
    Write-Host "Injected IGRP design-system skill into $skillTargetAgents (canonical) + $skillTargetClaude (Claude Code pointer)"
  } else {
    Write-Host "Warning: skill source not found at $skillSource - design-system skill will not be bundled in zip"
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
  # Remove the injected design-system skill content so the monorepo working
  # tree returns to its pre-script state. We touch only what we created;
  # static bridges (.cursor/, AGENTS.md, .trae/, .github/) stay put.
  if ($skillInjected) {
    if (Test-Path $skillTargetAgents) { Remove-Item $skillTargetAgents -Recurse -Force }
    if (Test-Path $skillTargetClaude) { Remove-Item $skillTargetClaude -Recurse -Force }
    foreach ($parentDir in @(".agents/skills", ".agents", ".claude/skills", ".claude")) {
      if ((Test-Path $parentDir) -and -not (Get-ChildItem $parentDir -Force -ErrorAction SilentlyContinue)) {
        Remove-Item $parentDir -Force
      }
    }
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
