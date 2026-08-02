# ============================================================
# 幼小衔接工作台 · 一键发布更新到 GitHub Pages
# 用法：右键 → 使用 PowerShell 运行（或在项目目录执行 .\update-gh.ps1）
# ============================================================
$ErrorActionPreference = 'Stop'
Set-Location $PSScriptRoot

# 找 GitHub Desktop 自带的 git
$git = "$env:LOCALAPPDATA\GitHubDesktop\app-3.5.12\resources\app\git\cmd\git.exe"
if (!(Test-Path $git)) {
  $found = Get-ChildItem "$env:LOCALAPPDATA\GitHubDesktop" -Recurse -Filter "git.exe" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -like "*cmd*" } | Select-Object -First 1
  if ($found) { $git = $found.FullName } else { Write-Host "❌ 找不到 git，请确认安装了 GitHub Desktop"; exit 1 }
}

Write-Host "📤 提交并推送更新到 GitHub..."
& $git add -A
& $git commit -m "更新 $(Get-Date -Format 'yyyy-MM-dd HH:mm')" 2>$null
if ($LASTEXITCODE -ne 0) { Write-Host "（没有新改动，直接推送）" }
& $git push origin main
if ($LASTEXITCODE -eq 0) {
  Write-Host ""
  Write-Host "✅ 已发布！约 1 分钟后生效："
  Write-Host "   https://yby432.github.io/youxiao-workbench/"
} else {
  Write-Host "❌ 推送失败，请检查网络或登录状态"
}
