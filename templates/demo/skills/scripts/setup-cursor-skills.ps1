# Setup Agent Skills
# Links igrp-design-system into every agent's skill discovery folder.
# Run from repo root: .\templates\demo\skills\scripts\setup-cursor-skills.ps1

$ErrorActionPreference = "Stop"

$RepoRoot    = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$SkillSource = Join-Path $RepoRoot ".\skills\igrp-design-system"

$TargetDirs = @(
    # Cursor
    (Join-Path $RepoRoot ".\.cursor\skills\igrp-design-system"),
    # Claude Code
    (Join-Path $RepoRoot ".\.claude\skills\igrp-design-system"),
    # Trae / OpenHands / generic agents
    (Join-Path $RepoRoot ".\.agents\skills\igrp-design-system")
)

Write-Host "Setting up IGRP Design System skill..." -ForegroundColor Cyan
Write-Host "  Source: $SkillSource"
Write-Host ""

if (-not (Test-Path $SkillSource)) {
    Write-Host "Error: Skill source not found at $SkillSource" -ForegroundColor Red
    exit 1
}

foreach ($target in $TargetDirs) {
    $parentDir = Split-Path $target -Parent
    New-Item -ItemType Directory -Path $parentDir -Force | Out-Null

    if (Test-Path $target) {
        Remove-Item $target -Force -Recurse -ErrorAction SilentlyContinue
    }

    try {
        New-Item -ItemType Junction -Path $target -Target $SkillSource -Force | Out-Null
        Write-Host "  Linked: $target" -ForegroundColor Green
    } catch {
        Copy-Item -Path $SkillSource -Destination $target -Recurse -Force
        Write-Host "  Copied: $target (junction not available)" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done. igrp-design-system skill is available to:" -ForegroundColor Cyan
Write-Host "  Cursor       -> ./.cursor/skills/igrp-design-system/" -ForegroundColor Gray
Write-Host "  Claude Code  -> ./.claude/skills/igrp-design-system/" -ForegroundColor Gray
Write-Host "  Trae/Agents  -> ./.agents/skills/igrp-design-system/" -ForegroundColor Gray
