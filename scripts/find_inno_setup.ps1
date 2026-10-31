# Locate Inno Setup's command-line compiler for the Windows release build.
# Supports machine-wide, per-user, PATH and custom registered installations
# of Inno Setup 6 and 7. Print only the full path on success.
$ErrorActionPreference = 'SilentlyContinue'
$candidates = [System.Collections.Generic.List[string]]::new()

function Add-Candidate([string]$path) {
    if (-not [string]::IsNullOrWhiteSpace($path)) {
        $candidates.Add($path)
    }
}

$command = Get-Command ISCC.exe -ErrorAction SilentlyContinue
if ($command) { Add-Candidate $command.Source }

$installRoots = @(
    ${env:ProgramFiles(x86)},
    $env:ProgramFiles,
    (Join-Path $env:LOCALAPPDATA 'Programs'),
    $env:LOCALAPPDATA
)
foreach ($root in $installRoots) {
    if (-not $root) { continue }
    foreach ($major in @(6, 7)) {
        Add-Candidate (Join-Path $root "Inno Setup $major\ISCC.exe")
    }
}

$uninstallKeys = @(
    'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
    'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
)
foreach ($entry in (Get-ItemProperty -Path $uninstallKeys -ErrorAction SilentlyContinue)) {
    if ($entry.DisplayName -notlike 'Inno Setup*') { continue }
    if ($entry.InstallLocation) {
        Add-Candidate (Join-Path $entry.InstallLocation 'ISCC.exe')
    }
    if ($entry.UninstallString) {
        $uninstall = [string]$entry.UninstallString
        $uninstallerPath = if ($uninstall.StartsWith('"')) {
            $uninstall.Split('"')[1]
        } else {
            $uninstall.Split(' ')[0]
        }
        if ($uninstallerPath) {
            Add-Candidate (Join-Path (Split-Path -Parent $uninstallerPath) 'ISCC.exe')
        }
    }
}

foreach ($candidate in $candidates) {
    if (Test-Path -LiteralPath $candidate -PathType Leaf) {
        (Resolve-Path -LiteralPath $candidate).Path
        exit 0
    }
}
exit 1
