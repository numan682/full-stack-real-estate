Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

$projectPath = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$normalizedProjectPath = $projectPath.Replace("/", "\")

function Stop-ProjectProcess {
    param(
        [Parameter(Mandatory = $true)]
        [string] $NamePattern,
        [Parameter(Mandatory = $true)]
        [string] $CommandPattern
    )

    $processes = Get-CimInstance Win32_Process |
        Where-Object {
            $_.Name -like $NamePattern -and
            $_.CommandLine -and
            $_.CommandLine -like $CommandPattern
        }

    foreach ($process in $processes) {
        Stop-Process -Id $process.ProcessId -Force
    }
}

# Kill any stale Next.js process (dev or start) for this project.
$nextBinPattern = "*" + $normalizedProjectPath + "\frontend\node_modules\*next\dist\bin\next*"
Stop-ProjectProcess -NamePattern "node.exe" -CommandPattern $nextBinPattern

# Kill stale php artisan serve/queue workers for this project.
$phpProcesses = Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -like "php.exe" -and
        $_.CommandLine -and
        $_.CommandLine -like ("*" + $normalizedProjectPath + "*") -and (
            $_.CommandLine -like "*artisan serve*" -or
            $_.CommandLine -like "*artisan queue:work*" -or
            $_.CommandLine -like "* -S 127.0.0.1:8000*" -or
            $_.CommandLine -like "*server.php*"
        )
    }

foreach ($process in $phpProcesses) {
    Stop-Process -Id $process.ProcessId -Force
}

# Kill cmd wrappers created by detached production runner for this project.
$cmdProcesses = Get-CimInstance Win32_Process |
    Where-Object {
        $_.Name -like "cmd.exe" -and
        $_.CommandLine -and
        $_.CommandLine -like ("*" + $normalizedProjectPath + "*") -and (
            $_.CommandLine -like "*npm run start*" -or
            $_.CommandLine -like "*next start*" -or
            $_.CommandLine -like "*artisan serve*" -or
            $_.CommandLine -like "*artisan queue:work*"
        )
    }

foreach ($process in $cmdProcesses) {
    Stop-Process -Id $process.ProcessId -Force
}

$lockPath = Join-Path $normalizedProjectPath "frontend\.next\dev\lock"
if (Test-Path $lockPath) {
    Remove-Item $lockPath -Force
}
