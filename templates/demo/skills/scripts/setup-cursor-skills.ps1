# Setup Agent Skills
# Creates a junction so Cursor can discover the skill via its skills discovery path.
# Claude Code, Trae/OpenHands, and Copilot read skills/ directly via their config files
# (CLAUDE.md, AGENTS.md, .cursor/rules/, .github/copilot-instructions.md) — no junction needed.
#
# Run from anywhere inside the repo:
#   .\templates\demo\skills\scripts\setup-cursor-skills.ps1

$ErrorActionPreference = "Stop"

$RepoRoot    = (Get-Item $PSScriptRoot).Parent.Parent.Parent.Parent.FullName
$SkillSource = Join-Path $RepoRoot "templates\demo\skills\igrp-design-system"

# Cursor discovers skills one level deep from .cursor/skills/ at the repo root.
$CursorTarget = Join-Path $RepoRoot ".cursor\skills\igrp-design-system"

Write-Host "Setting up IGRP Design System skill for Cursor..." -ForegroundColor Cyan
Write-Host "  Source : $SkillSource"
Write-Host "  Target : $CursorTarget"
Write-Host ""

if (-not (Test-Path $SkillSource)) {
    Write-Host "ERROR: Skill source not found: $SkillSource" -ForegroundColor Red
    exit 1
}

$parentDir = Split-Path $CursorTarget -Parent
New-Item -ItemType Directory -Path $parentDir -Force | Out-Null

if (Test-Path $CursorTarget) {
    Remove-Item $CursorTarget -Force -Recurse -ErrorAction SilentlyContinue
}

try {
    New-Item -ItemType Junction -Path $CursorTarget -Target $SkillSource -Force | Out-Null
    Write-Host "  Linked (junction): $CursorTarget" -ForegroundColor Green
} catch {
    Copy-Item -Path $SkillSource -Destination $CursorTarget -Recurse -Force
    Write-Host "  Copied (junction unavailable): $CursorTarget" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done." -ForegroundColor Cyan
Write-Host ""
Write-Host "How each agent reads the skill:" -ForegroundColor White
Write-Host "  Cursor       : .cursor/skills/igrp-design-system/ (junction -> skills/)" -ForegroundColor Gray
Write-Host "  Claude Code  : reads @./skills/igrp-design-system/SKILL.md via CLAUDE.md" -ForegroundColor Gray
Write-Host "  Trae/Agents  : reads ./skills/igrp-design-system/SKILL.md via AGENTS.md" -ForegroundColor Gray
Write-Host "  Copilot      : reads skills/igrp-design-system/SKILL.md via copilot-instructions.md" -ForegroundColor Gray
