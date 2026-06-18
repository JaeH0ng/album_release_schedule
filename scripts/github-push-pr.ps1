param(
  [ValidateSet("ExistingBranch", "NewBranch", "PullRequest")]
  [string]$Mode = "ExistingBranch",
  [string]$RemoteName = "origin",
  [string]$Repo = "JaeH0ng/album_release_schedule",
  [string]$BaseBranch = "main",
  [string]$BranchName = "",
  [string]$BranchPrefix = "codex/work",
  [string]$CommitMessage = "",
  [switch]$Draft,
  [switch]$SkipChecks
)

$ErrorActionPreference = "Stop"

function Invoke-Checked {
  param([string]$Command, [string[]]$Arguments)

  & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
}

function Invoke-CaptureChecked {
  param([string]$Command, [string[]]$Arguments)

  $output = & $Command @Arguments
  if ($LASTEXITCODE -ne 0) {
    throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
  }
  return $output
}

function Assert-CommandExists {
  param([string]$Command)

  if (-not (Get-Command $Command -ErrorAction SilentlyContinue)) {
    throw "Required command '$Command' was not found."
  }
}

function Get-CurrentBranch {
  $branch = (Invoke-CaptureChecked "git" @("branch", "--show-current") | Select-Object -First 1).Trim()
  if ([string]::IsNullOrWhiteSpace($branch)) {
    throw "Detached HEAD is not supported."
  }
  return $branch
}

function Test-LocalBranch {
  param([string]$Name)

  & git show-ref --verify --quiet "refs/heads/$Name"
  return $LASTEXITCODE -eq 0
}

function Test-RemoteBranch {
  param([string]$Name)

  & git ls-remote --exit-code --heads $RemoteName $Name | Out-Null
  if ($LASTEXITCODE -eq 0) { return $true }
  if ($LASTEXITCODE -eq 2) { return $false }
  throw "Could not check remote branch '$Name'."
}

function Resolve-CommitMessage {
  if (-not [string]::IsNullOrWhiteSpace($CommitMessage)) {
    return $CommitMessage
  }
  return "chore: update album release workspace"
}

function Invoke-Checks {
  if ($SkipChecks -or -not (Test-Path "package.json")) {
    return
  }

  $packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
  if ($packageJson.scripts.PSObject.Properties.Name -contains "typecheck") {
    Assert-CommandExists "npm"
    Invoke-Checked "npm" @("run", "typecheck")
  }
}

function Commit-LocalChanges {
  param([string]$Message)

  $status = Invoke-CaptureChecked "git" @("status", "--porcelain")
  if (-not $status) {
    Write-Host "No changes to commit."
    return
  }

  Invoke-Checked "git" @("add", "-A")
  & git diff --cached --quiet
  if ($LASTEXITCODE -eq 0) {
    Write-Host "No staged changes to commit."
    return
  }
  if ($LASTEXITCODE -ne 1) {
    throw "git diff --cached --quiet failed with exit code $LASTEXITCODE"
  }

  Invoke-Checked "git" @("commit", "-m", $Message)
}

function Push-CurrentHead {
  param([string]$Name)
  Invoke-Checked "git" @("push", "-u", $RemoteName, "HEAD:$Name")
}

Assert-CommandExists "git"

$repoRoot = (Invoke-CaptureChecked "git" @("rev-parse", "--show-toplevel") | Select-Object -First 1).Trim()
Set-Location $repoRoot

$environmentFiles = Get-ChildItem -Recurse -Force -File |
  Where-Object { $_.Name -eq ".env" -or ($_.Name -like ".env.*" -and $_.Name -ne ".env.example") }
if ($environmentFiles) {
  throw "Refusing to continue because environment files are present."
}

$remoteNames = Invoke-CaptureChecked "git" @("remote")
if ($remoteNames -notcontains $RemoteName) {
  throw "Remote '$RemoteName' does not exist."
}

$remoteUrl = (Invoke-CaptureChecked "git" @("remote", "get-url", $RemoteName) | Select-Object -First 1).Trim()
if ($remoteUrl -notmatch [regex]::Escape($Repo)) {
  throw "Remote '$RemoteName' points to '$remoteUrl', not '$Repo'."
}

Invoke-Checks
$message = Resolve-CommitMessage

switch ($Mode) {
  "ExistingBranch" {
    if ([string]::IsNullOrWhiteSpace($BranchName)) {
      $BranchName = Get-CurrentBranch
    } elseif ((Get-CurrentBranch) -ne $BranchName) {
      throw "Switch to existing branch '$BranchName' before running this mode."
    }

    Commit-LocalChanges $message
    Push-CurrentHead $BranchName
    Write-Host "Pushed to existing branch '$BranchName'."
  }

  "NewBranch" {
    if ([string]::IsNullOrWhiteSpace($BranchName)) {
      $timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
      $BranchName = "$BranchPrefix-$timestamp"
    }

    if ((Test-LocalBranch $BranchName) -or (Test-RemoteBranch $BranchName)) {
      throw "Branch '$BranchName' already exists."
    }

    Invoke-Checked "git" @("switch", "-c", $BranchName)
    Commit-LocalChanges $message
    Push-CurrentHead $BranchName
    Write-Host "Pushed to new branch '$BranchName'."
  }

  "PullRequest" {
    Assert-CommandExists "gh"
    if ([string]::IsNullOrWhiteSpace($BranchName)) {
      $BranchName = Get-CurrentBranch
    }
    if ($BranchName -eq $BaseBranch) {
      throw "PullRequest mode requires a head branch different from '$BaseBranch'."
    }

    Commit-LocalChanges $message
    Push-CurrentHead $BranchName

    $arguments = @(
      "pr", "create", "--repo", $Repo, "--base", $BaseBranch,
      "--head", $BranchName, "--title", $message,
      "--body", "Created from scripts/github-push-pr.ps1."
    )
    if ($Draft) { $arguments += "--draft" }
    Invoke-Checked "gh" $arguments
  }
}
