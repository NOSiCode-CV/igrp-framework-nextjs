# Setup Cursor Skills
# Creates links in .cursor/skills/ so Cursor discovers the IGRP design system skills.
# Run from repo root: .\templates\demo\skills\scripts\setup-cursor-skills.ps1

$ErrorActionPreference = "Stop"
# PSScriptRoot = .../templates/demo/skills/scripts; go up 4 levels to repo root
$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$SkillsSource = Join-Path $RepoRoot "templates\demo\skills"
$CursorSkillsDir = Join-Path $RepoRoot ".cursor\skills"

$SkillFolders = @(
    "igrp-form", "igrp-inputs", "igrp-datatable", "igrp-button", "igrp-card",
    "igrp-charts", "igrp-modal", "igrp-calendar-datepicker", "igrp-layout",
    "igrp-navigation", "igrp-feedback", "igrp-custom", "igrp-primitives"
)

Write-Host "Setting up Cursor skills..." -ForegroundColor Cyan
Write-Host "  Source: $SkillsSource"
Write-Host "  Target: $CursorSkillsDir"
Write-Host ""

if (-not (Test-Path $SkillsSource)) {
    Write-Host "Error: Skills source not found at $SkillsSource" -ForegroundColor Red
    exit 1
}

New-Item -ItemType Directory -Path $CursorSkillsDir -Force | Out-Null

foreach ($skill in $SkillFolders) {
    $sourcePath = Join-Path $SkillsSource $skill
    $targetPath = Join-Path $CursorSkillsDir $skill

    if (-not (Test-Path $sourcePath)) {
        Write-Host "  Skip $skill (not found)" -ForegroundColor Yellow
        continue
    }

    if (Test-Path $targetPath) {
        Remove-Item $targetPath -Force -Recurse -ErrorAction SilentlyContinue
    }

    try {
        # Use New-Item -ItemType Junction (works without admin on Windows)
        New-Item -ItemType Junction -Path $targetPath -Target $sourcePath -Force | Out-Null
        Write-Host "  Linked: $skill" -ForegroundColor Green
    } catch {
        # Fallback: copy if junction fails (e.g. some Windows configs)
        Copy-Item -Path $sourcePath -Destination $targetPath -Recurse -Force
        Write-Host "  Copied: $skill (junction not available)" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Done. Cursor will discover skills from .cursor/skills/" -ForegroundColor Cyan
