<?php

declare(strict_types=1);

function isWindows(): bool
{
    return PHP_OS_FAMILY === 'Windows';
}

function fail(string $message): never
{
    fwrite(STDERR, $message.PHP_EOL);
    exit(1);
}

function mark(string $message, string $logFile): void
{
    @file_put_contents($logFile, '['.date('Y-m-d H:i:s')."] {$message}".PHP_EOL, FILE_APPEND);
}

function ensureDirectory(string $path): void
{
    if (! is_dir($path) && ! mkdir($path, 0775, true) && ! is_dir($path)) {
        fail("Unable to create directory: {$path}");
    }
}

function quoteWindowsArg(string $arg): string
{
    if ($arg === '') {
        return '""';
    }

    if (! preg_match('/[\s"&|<>^]/', $arg)) {
        return $arg;
    }

    return '"'.str_replace('"', '""', $arg).'"';
}

function quotePowerShellArg(string $arg): string
{
    return "'".str_replace("'", "''", $arg)."'";
}

function commandToString(array $command): string
{
    if (! isWindows()) {
        return implode(' ', array_map('escapeshellarg', $command));
    }

    return implode(' ', array_map('quoteWindowsArg', $command));
}

function runProcess(array $command, ?string $cwd = null): array
{
    $descriptors = [
        0 => ['pipe', 'r'],
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];

    $windowsDirectCommands = ['wmic', 'powershell', 'pwsh'];
    $firstCommand = strtolower((string) ($command[0] ?? ''));

    if (isWindows() && ! in_array($firstCommand, $windowsDirectCommands, true)) {
        $process = proc_open(
            'cmd /d /s /c "'.commandToString($command).'"',
            $descriptors,
            $pipes,
            $cwd,
        );
    } else {
        $process = proc_open($command, $descriptors, $pipes, $cwd);
    }

    if (! is_resource($process)) {
        fail('Unable to execute command: '.commandToString($command));
    }

    fclose($pipes[0]);
    $stdout = stream_get_contents($pipes[1]);
    $stderr = stream_get_contents($pipes[2]);
    fclose($pipes[1]);
    fclose($pipes[2]);

    $exitCode = proc_close($process);

    return [$exitCode, trim($stdout), trim($stderr)];
}

function runOrFail(array $command, ?string $cwd = null): void
{
    $originalCwd = getcwd();
    if ($cwd !== null && $cwd !== '') {
        chdir($cwd);
    }

    $shellCommand = isWindows()
        ? 'cmd /d /s /c "'.commandToString($command).'"'
        : commandToString($command);

    passthru($shellCommand, $exitCode);

    if ($originalCwd !== false) {
        chdir($originalCwd);
    }

    if ($exitCode !== 0) {
        fail('Command failed: '.commandToString($command));
    }
}

function parseEnvFile(string $path): array
{
    $values = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if (! is_array($lines)) {
        return $values;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);
        if ($trimmed === '' || str_starts_with($trimmed, '#') || ! str_contains($trimmed, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);
        $value = trim($value, "\"'");
        $values[$key] = $value;
    }

    return $values;
}

function writeFrontendProductionEnv(string $frontendEnvFile, array $env): void
{
    $apiBaseUrl = $env['LARAVEL_API_BASE_URL'] ?? 'http://127.0.0.1:8000';
    $nextPublicApiBaseUrl = $env['NEXT_PUBLIC_LARAVEL_API_BASE_URL'] ?? $apiBaseUrl;
    $nextPublicSiteUrl = $env['NEXT_PUBLIC_SITE_URL'] ?? ($env['APP_URL'] ?? 'http://127.0.0.1:3000');

    $content = implode(PHP_EOL, [
        "LARAVEL_API_BASE_URL={$apiBaseUrl}",
        "NEXT_PUBLIC_LARAVEL_API_BASE_URL={$nextPublicApiBaseUrl}",
        "NEXT_PUBLIC_SITE_URL={$nextPublicSiteUrl}",
        '',
    ]);

    file_put_contents($frontendEnvFile, $content);
}

function toShellCommand(string $binary, array $args): string
{
    $parts = array_merge([$binary], $args);

    if (isWindows()) {
        return implode(' ', array_map('quoteWindowsArg', $parts));
    }

    return implode(' ', array_map('escapeshellarg', $parts));
}

function startDetached(string $binary, array $args, string $cwd, string $stdoutLog, string $stderrLog): int
{
    if (isWindows()) {
        $inlineCommand = 'cd /d '.quoteWindowsArg($cwd)
            .' && '.toShellCommand($binary, $args)
            .' 1>>'.quoteWindowsArg($stdoutLog)
            .' 2>>'.quoteWindowsArg($stderrLog);
        $powershellCommand = '$ErrorActionPreference = "Stop"; '
            .'$proc = Start-Process -FilePath "cmd.exe" '
            .'-ArgumentList @("/d","/s","/c",'.quotePowerShellArg($inlineCommand).') '
            .'-WindowStyle Hidden -PassThru; '
            .'[Console]::Out.Write($proc.Id)';
        [$exitCode, $stdout, $stderr] = runProcess(['powershell', '-NoProfile', '-Command', $powershellCommand]);

        if ($exitCode !== 0) {
            fail("Failed starting process {$binary}: {$stderr}");
        }

        $pid = (int) trim($stdout);
        if ($pid < 1) {
            fail("Failed capturing PID for process {$binary}.");
        }

        return $pid;
    }

    $command = toShellCommand($binary, $args).' >> '.escapeshellarg($stdoutLog).' 2>> '.escapeshellarg($stderrLog).' & echo $!';
    [$exitCode, $stdout, $stderr] = runProcess(['sh', '-lc', $command], $cwd);

    if ($exitCode !== 0) {
        fail("Failed starting process {$binary}: {$stderr}");
    }

    $pid = (int) trim($stdout);
    if ($pid < 1) {
        fail("Failed capturing PID for process {$binary}.");
    }

    return $pid;
}

function stopPid(int $pid): void
{
    if ($pid < 1) {
        return;
    }

    if (isWindows()) {
        runProcess(['taskkill', '/PID', (string) $pid, '/T', '/F']);
        return;
    }

    runProcess(['kill', '-TERM', (string) $pid]);
}

function isPidRunning(int $pid): bool
{
    if ($pid < 1) {
        return false;
    }

    if (isWindows()) {
        [$exitCode, $stdout] = runProcess(['tasklist', '/FI', "PID eq {$pid}"]);

        return $exitCode === 0 && str_contains($stdout, (string) $pid);
    }

    [$exitCode] = runProcess(['sh', '-lc', "kill -0 {$pid} >/dev/null 2>&1"]);

    return $exitCode === 0;
}

$action = $argv[1] ?? '';
$allowedActions = ['up', 'down', 'logs', 'status'];

if (! in_array($action, $allowedActions, true)) {
    fail('Usage: php scripts/prod.php [up|down|logs|status]');
}

$projectRoot = realpath(__DIR__.'/..');
if (! $projectRoot) {
    fail('Unable to resolve project root.');
}

$frontendPath = $projectRoot.'/frontend';
$envFile = $projectRoot.'/.env.production';
$frontendEnvFile = $frontendPath.'/.env.production';

$runDir = $projectRoot.'/storage/run';
$logsDir = $projectRoot.'/storage/logs/production';
$pidFile = $runDir.'/prod-processes.json';
$runnerLogFile = $logsDir.'/prod-runner.log';

ensureDirectory($runDir);
ensureDirectory($logsDir);

if ($action === 'up') {
    if (! file_exists($envFile)) {
        fail('Missing .env.production file. Create it from .env.production.example first.');
    }
}

if ($action === 'down') {
    if (! file_exists($pidFile)) {
        fwrite(STDOUT, "No running production processes found.\n");
        exit(0);
    }

    $processes = json_decode((string) file_get_contents($pidFile), true);
    if (! is_array($processes)) {
        unlink($pidFile);
        fwrite(STDOUT, "Cleared invalid PID file.\n");
        exit(0);
    }

    foreach ($processes as $name => $pid) {
        if (is_int($pid) && $pid > 0) {
            stopPid($pid);
            fwrite(STDOUT, "Stopped {$name} (PID {$pid}).\n");
        }
    }

    unlink($pidFile);
    fwrite(STDOUT, "Production services stopped.\n");
    exit(0);
}

if ($action === 'status') {
    if (! file_exists($pidFile)) {
        fwrite(STDOUT, "No running production processes found.\n");
        exit(0);
    }

    $processes = json_decode((string) file_get_contents($pidFile), true);
    if (! is_array($processes)) {
        fail('Invalid PID state file.');
    }

    foreach ($processes as $name => $pid) {
        $running = is_int($pid) && isPidRunning($pid);
        fwrite(STDOUT, sprintf("%s: %s%s", $name, $running ? 'running' : 'stopped', PHP_EOL));
    }

    exit(0);
}

if ($action === 'logs') {
    $logFiles = [
        $logsDir.'/api.out.log',
        $logsDir.'/api.err.log',
        $logsDir.'/queue.out.log',
        $logsDir.'/queue.err.log',
        $logsDir.'/next.out.log',
        $logsDir.'/next.err.log',
    ];

    foreach ($logFiles as $logFile) {
        if (! file_exists($logFile)) {
            touch($logFile);
        }
    }

    if (isWindows()) {
        $paths = implode(', ', array_map(
            static fn (string $path): string => "'".str_replace("'", "''", $path)."'",
            $logFiles,
        ));
        $script = "Get-Content -Path {$paths} -Wait -Tail 80";
        passthru('powershell -NoProfile -Command "'.$script.'"', $exitCode);
        exit((int) $exitCode);
    }

    $escaped = implode(' ', array_map('escapeshellarg', $logFiles));
    passthru('tail -n 80 -f '.$escaped, $exitCode);
    exit((int) $exitCode);
}

// up action
mark('prod up: start', $runnerLogFile);
$env = parseEnvFile($envFile);
mark('prod up: env parsed', $runnerLogFile);

$appKey = $env['APP_KEY'] ?? '';
if ($appKey === '' || ! str_starts_with($appKey, 'base64:')) {
    fail('APP_KEY is missing or invalid in .env.production.');
}

$dbHost = $env['DB_HOST'] ?? '';
if ($dbHost === 'mysql') {
    fail('DB_HOST=mysql is a Docker value. For non-Docker production set DB_HOST to your real MySQL host (for local MySQL use 127.0.0.1).');
}

$apiPort = (int) ($env['API_PORT'] ?? 8000);
$frontendPort = (int) ($env['APP_PORT'] ?? 3000);

if ($apiPort < 1 || $apiPort > 65535 || $frontendPort < 1 || $frontendPort > 65535) {
    fail('API_PORT/APP_PORT must be valid TCP ports in .env.production.');
}

// Ensure fresh start
if (file_exists($pidFile)) {
    $existing = json_decode((string) file_get_contents($pidFile), true);
    if (is_array($existing)) {
        foreach ($existing as $pid) {
            if (is_int($pid) && $pid > 0) {
                stopPid($pid);
            }
        }
    }

    unlink($pidFile);
}

writeFrontendProductionEnv($frontendEnvFile, $env);
mark('prod up: frontend env synced', $runnerLogFile);

fwrite(STDOUT, "Preparing production artifacts...\n");
mark('prod up: migrate', $runnerLogFile);
runOrFail(['php', 'artisan', 'migrate', '--force', '--env=production'], $projectRoot);
mark('prod up: optimize', $runnerLogFile);
runOrFail(['php', 'artisan', 'optimize', '--env=production'], $projectRoot);
mark('prod up: npm ci', $runnerLogFile);
runOrFail(['npm', '--prefix', 'frontend', 'ci'], $projectRoot);
mark('prod up: npm build', $runnerLogFile);
runOrFail(['npm', '--prefix', 'frontend', 'run', 'build'], $projectRoot);
mark('prod up: artifacts ready', $runnerLogFile);

fwrite(STDOUT, "Starting production services...\n");
mark('prod up: start api', $runnerLogFile);
$processes = [
    'api' => startDetached(
        'php',
        ['artisan', 'serve', '--env=production', '--host=127.0.0.1', "--port={$apiPort}", '--no-reload'],
        $projectRoot,
        $logsDir.'/api.out.log',
        $logsDir.'/api.err.log',
    ),
    'queue' => startDetached(
        'php',
        ['artisan', 'queue:work', '--env=production', '--sleep=3', '--tries=3', '--timeout=90', '--max-time=3600'],
        $projectRoot,
        $logsDir.'/queue.out.log',
        $logsDir.'/queue.err.log',
    ),
    'next' => startDetached(
        'npm',
        ['run', 'start', '--', '--hostname', '127.0.0.1', '--port', (string) $frontendPort],
        $frontendPath,
        $logsDir.'/next.out.log',
        $logsDir.'/next.err.log',
    ),
    // queue worker
    // next server
];
mark('prod up: processes started', $runnerLogFile);

file_put_contents($pidFile, json_encode($processes, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

fwrite(STDOUT, PHP_EOL);
fwrite(STDOUT, "Production stack is running.".PHP_EOL);
fwrite(STDOUT, "Frontend: http://127.0.0.1:{$frontendPort}".PHP_EOL);
fwrite(STDOUT, "API:      http://127.0.0.1:{$apiPort}".PHP_EOL);
fwrite(STDOUT, "Logs:     {$logsDir}".PHP_EOL);
fwrite(STDOUT, PHP_EOL);
fwrite(STDOUT, "Use `composer prod:status` to check services, `composer prod:logs` to tail logs, `composer prod:down` to stop.".PHP_EOL);
