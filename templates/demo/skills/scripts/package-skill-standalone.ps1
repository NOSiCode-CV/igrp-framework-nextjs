# Standalone skill packager - creates .skill files (zip) without skill-creator dependency.
# Use when package_skill.py has encoding issues (e.g. Windows) or PyYAML is not available.
# Run from repo root: .\templates\demo\skills\scripts\package-skill-standalone.ps1

$ErrorActionPreference = "Stop"
$RepoRoot = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$SkillsSource = Join-Path $RepoRoot "templates\demo\skills"
$OutputDir = Join-Path $SkillsSource "dist"

$SkillFolders = @(
    "igrp-form", "igrp-inputs", "igrp-datatable", "igrp-button", "igrp-card",
    "igrp-charts", "igrp-modal", "igrp-calendar-datepicker", "igrp-layout",
    "igrp-navigation", "igrp-feedback", "igrp-custom", "igrp-primitives"
)

$ExcludeDirs = @("evals", "__pycache__", "node_modules")
$ExcludeFiles = @(".DS_Store")

function Get-SkillFiles {
    param($SourcePath)
    Get-ChildItem $SourcePath -Recurse -File | Where-Object {
        $rel = $_.FullName.Substring($SourcePath.Length).TrimStart("\")
        $parts = ($rel -split "[\\/]")[0]
        $_.Name -notin $ExcludeFiles -and $parts -notin $ExcludeDirs
    }
}

New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

Write-Host "Packaging IGRP skills (standalone)..." -ForegroundColor Cyan
Write-Host "  Output: $OutputDir"
Write-Host ""

foreach ($skill in $SkillFolders) {
    $skillPath = Join-Path $SkillsSource $skill
    if (-not (Test-Path $skillPath)) {
        Write-Host "  Skip $skill (not found)" -ForegroundColor Yellow
        continue
    }
    if (-not (Test-Path (Join-Path $skillPath "SKILL.md"))) {
        Write-Host "  Skip $skill (no SKILL.md)" -ForegroundColor Yellow
        continue
    }

    $zipPath = Join-Path $OutputDir "$skill.skill"
    $zipTemp = Join-Path $OutputDir "$skill.zip"
    if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
    if (Test-Path $zipTemp) { Remove-Item $zipTemp -Force }

    $tempDir = Join-Path $env:TEMP "igrp-skill-$skill"
    if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
    $destDir = Join-Path $tempDir $skill
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null

    try {
        Get-SkillFiles $skillPath | ForEach-Object {
            $rel = $_.FullName.Substring($skillPath.Length).TrimStart("\")
            $dest = Join-Path $destDir $rel
            $destParent = Split-Path $dest -Parent
            if (-not (Test-Path $destParent)) { New-Item -ItemType Directory -Path $destParent -Force | Out-Null }
            Copy-Item $_.FullName $dest -Force
        }
        Compress-Archive -Path $tempDir -DestinationPath $zipTemp -Force
        Move-Item $zipTemp $zipPath -Force
        Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "  OK: $skill.skill" -ForegroundColor Green
    } catch {
        if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force -ErrorAction SilentlyContinue }
        Write-Host "  Failed: $skill - $_" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Done. Output: $OutputDir" -ForegroundColor Cyan
Get-ChildItem $OutputDir -Filter "*.skill" -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "  - $($_.Name)" }
