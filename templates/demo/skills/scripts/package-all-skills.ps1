# Package IGRP skills for Anthropic/skills.sh
# Creates .skill files (zip) for each skill. Uses skill-creator's package_skill.py.
# Run from repo root: .\.\skills\scripts\package-all-skills.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$SkillsSource = Join-Path $RepoRoot ".\skills"
$OutputDir = Join-Path $RepoRoot ".\skills\dist"
$SkillCreatorPaths = @(
    (Join-Path $RepoRoot ".\.claude\skills\skill-creator"),
    (Join-Path $RepoRoot ".\.agents\skills\skill-creator"),
    (Join-Path $RepoRoot ".\.windsurf\skills\skill-creator"),
    (Join-Path $RepoRoot ".\.cortex\skills\skill-creator")
)

$SkillCreatorDir = $null
foreach ($p in $SkillCreatorPaths) {
    if (Test-Path (Join-Path $p "scripts\package_skill.py")) {
        $SkillCreatorDir = $p
        break
    }
}

if (-not $SkillCreatorDir) {
    Write-Host "Error: skill-creator not found. Run: npx skills add https://github.com/anthropics/skills --skill skill-creator" -ForegroundColor Red
    exit 1
}

# package_skill.py requires PyYAML; may fail on Windows (Unicode). Prefer package-skill-standalone.ps1.

$SkillFolders = @(
    "igrp-form", "igrp-inputs", "igrp-datatable", "igrp-button", "igrp-card",
    "igrp-charts", "igrp-modal", "igrp-calendar-datepicker", "igrp-layout",
    "igrp-navigation", "igrp-feedback", "igrp-custom", "igrp-ui"
)

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "Packaging IGRP skills..." -ForegroundColor Cyan
Write-Host "  Skill-creator: $SkillCreatorDir"
Write-Host "  Output: $OutputDir"
Write-Host ""

$failed = @()
foreach ($skill in $SkillFolders) {
    $skillPath = Join-Path $SkillsSource $skill
    if (-not (Test-Path $skillPath)) {
        Write-Host "  Skip $skill (not found)" -ForegroundColor Yellow
        continue
    }

    Write-Host "  Packaging $skill..." -ForegroundColor Gray
    Push-Location $SkillCreatorDir
    try {
        $result = python -m scripts.package_skill $skillPath $OutputDir 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  OK: $skill.skill" -ForegroundColor Green
        } else {
            Write-Host "  Failed: $skill" -ForegroundColor Red
            $failed += $skill
        }
    } finally {
        Pop-Location
    }
}

Write-Host ""
if ($failed.Count -eq 0) {
    Write-Host "All skills packaged to: $OutputDir" -ForegroundColor Cyan
    Get-ChildItem $OutputDir -Filter "*.skill" | ForEach-Object { Write-Host "  - $($_.Name)" }
} else {
    Write-Host "Failed: $($failed -join ', ')" -ForegroundColor Red
    exit 1
}
