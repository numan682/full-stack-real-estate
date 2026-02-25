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

function toPowerShellArrayLiteral(array $values): string
{
    if ($values === []) {
        return '@()';
    }

    return '@('.implode(', ', array_map(
        static fn (string $value): string => quotePowerShellArg($value),
        $values,
    )).')';
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

function startDetached(string $binary, array $args, string $cwd, string $stdoutLog, string $stderrLog): int
{
    if (isWindows()) {
        $innerCommand = 'cd /d '.quoteWindowsArg($cwd)
            .' && '.commandToString(array_merge([$binary], $args))
            .' >> '.quoteWindowsArg($stdoutLog)
            .' 2>> '.quoteWindowsArg($stderrLog);

        $powershellCommand = '$ErrorActionPreference = "Stop"; '
            .'$proc = Start-Process -FilePath "cmd.exe" '
            .'-ArgumentList '.toPowerShellArrayLiteral(['/d', '/s', '/c', $innerCommand]).' '
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

    $command = implode(' ', array_map('escapeshellarg', array_merge([$binary], $args)))
        .' >> '.escapeshellarg($stdoutLog)
        .' 2>> '.escapeshellarg($stderrLog)
        .' & echo $!';
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

function endpointMatchesPort(string $endpoint, int $port): bool
{
    if ($port < 1 || $port > 65535) {
        return false;
    }

    return preg_match('/(?:^|[:.])'.preg_quote((string) $port, '/').'$/', trim($endpoint)) === 1;
}

function findListeningPid(int $port): int
{
    if ($port < 1 || $port > 65535) {
        return 0;
    }

    if (isWindows()) {
        [$exitCode, $stdout] = runProcess(['netstat', '-ano']);
        if ($exitCode !== 0 || $stdout === '') {
            return 0;
        }

        $lines = preg_split('/\R+/', $stdout) ?: [];
        foreach ($lines as $line) {
            $parts = preg_split('/\s+/', trim($line)) ?: [];
            if (count($parts) < 5) {
                continue;
            }

            $protocol = strtoupper($parts[0] ?? '');
            $localAddress = $parts[1] ?? '';
            $state = strtoupper($parts[3] ?? '');
            $pid = (int) ($parts[4] ?? 0);

            if ($protocol !== 'TCP' || $state !== 'LISTENING' || $pid < 1) {
                continue;
            }

            if (endpointMatchesPort($localAddress, $port)) {
                return $pid;
            }
        }

        return 0;
    }

    [$exitCode, $stdout] = runProcess(['sh', '-lc', 'lsof -ti tcp:'.$port.' -sTCP:LISTEN 2>/dev/null | head -n 1']);
    if ($exitCode === 0 && trim($stdout) !== '') {
        return (int) trim($stdout);
    }

    return 0;
}

function resolveServicePid(string $serviceName, array $serviceConfig, array $state): int
{
    $port = (int) ($serviceConfig['port'] ?? 0);
    if ($port > 0) {
        $portPid = findListeningPid($port);
        if ($portPid > 0) {
            return $portPid;
        }
    }

    $statePid = (int) ($state[$serviceName] ?? 0);

    return $statePid > 0 && isPidRunning($statePid) ? $statePid : 0;
}

function parseEnvFile(string $path): array
{
    if (! file_exists($path)) {
        return [];
    }

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
        $values[trim($key)] = trim(trim($value), "\"'");
    }

    return $values;
}

function loadState(string $pidFile): array
{
    if (! file_exists($pidFile)) {
        return [];
    }

    $decoded = json_decode((string) file_get_contents($pidFile), true);

    return is_array($decoded) ? $decoded : [];
}

function saveState(string $pidFile, array $state): void
{
    if ($state === []) {
        if (file_exists($pidFile)) {
            unlink($pidFile);
        }
        return;
    }

    file_put_contents($pidFile, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
}

function tailLogs(array $logFiles): never
{
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
        $script = "Get-Content -Path {$paths} -Wait -Tail 100";
        passthru('powershell -NoProfile -Command "'.$script.'"', $exitCode);
        exit((int) $exitCode);
    }

    $escaped = implode(' ', array_map('escapeshellarg', $logFiles));
    passthru('tail -n 100 -f '.$escaped, $exitCode);
    exit((int) $exitCode);
}

$action = $argv[1] ?? '';
$target = strtolower((string) ($argv[2] ?? 'all'));

$allowedActions = ['up', 'down', 'restart', 'status', 'logs', 'start', 'stop'];
$allowedTargets = ['all', 'backend', 'frontend', 'api', 'queue'];

if (! in_array($action, $allowedActions, true)) {
    fail('Usage: php scripts/dev-services.php [up|down|restart|status|logs|start|stop] [all|backend|frontend|api|queue]');
}

if (! in_array($target, $allowedTargets, true)) {
    fail('Invalid target. Use one of: all, backend, frontend, api, queue');
}

$projectRoot = realpath(__DIR__.'/..');
if (! $projectRoot) {
    fail('Unable to resolve project root.');
}

$env = parseEnvFile($projectRoot.'/.env');
$apiPort = (int) ($env['DEV_API_PORT'] ?? 8000);
$frontendPort = (int) ($env['DEV_FRONTEND_PORT'] ?? 3000);

if ($apiPort < 1 || $apiPort > 65535 || $frontendPort < 1 || $frontendPort > 65535) {
    fail('DEV_API_PORT/DEV_FRONTEND_PORT must be valid TCP ports.');
}

$frontendPath = $projectRoot.'/frontend';
$runDir = $projectRoot.'/storage/run';
$logsDir = $projectRoot.'/storage/logs/dev';
$pidFile = $runDir.'/dev-processes.json';

ensureDirectory($runDir);
ensureDirectory($logsDir);

$services = [
    'api' => [
        'binary' => 'php',
        'args' => ['artisan', 'serve', '--host=127.0.0.1', "--port={$apiPort}", '--no-reload'],
        'cwd' => $projectRoot,
        'out' => $logsDir.'/api.out.log',
        'err' => $logsDir.'/api.err.log',
        'port' => $apiPort,
    ],
    'queue' => [
        'binary' => 'php',
        'args' => ['artisan', 'queue:work', '--tries=1'],
        'cwd' => $projectRoot,
        'out' => $logsDir.'/queue.out.log',
        'err' => $logsDir.'/queue.err.log',
    ],
    'frontend' => [
        'binary' => 'npm',
        'args' => ['run', 'dev', '--', '--hostname', '127.0.0.1', '--port', (string) $frontendPort],
        'cwd' => $frontendPath,
        'out' => $logsDir.'/frontend.out.log',
        'err' => $logsDir.'/frontend.err.log',
        'port' => $frontendPort,
    ],
];

$serviceTargets = match ($target) {
    'all' => ['api', 'queue', 'frontend'],
    'backend' => ['api', 'queue'],
    'frontend' => ['frontend'],
    'api' => ['api'],
    'queue' => ['queue'],
    default => [],
};

$state = loadState($pidFile);

if ($action === 'status') {
    $stateUpdated = false;

    $captureStatus = static function (string $serviceName) use (&$state, &$stateUpdated, $services): array {
        $pid = resolveServicePid($serviceName, $services[$serviceName], $state);
        $running = $pid > 0;

        if ($running) {
            if ((int) ($state[$serviceName] ?? 0) !== $pid) {
                $state[$serviceName] = $pid;
                $stateUpdated = true;
            }
        } elseif (array_key_exists($serviceName, $state)) {
            unset($state[$serviceName]);
            $stateUpdated = true;
        }

        return ['running' => $running, 'pid' => $pid];
    };

    if ($target === 'all' || $target === 'backend') {
        $api = $captureStatus('api');
        $queue = $captureStatus('queue');

        if ($api['running'] && $queue['running']) {
            $backendStatus = sprintf('running (api PID %d, queue PID %d)', $api['pid'], $queue['pid']);
        } elseif (! $api['running'] && ! $queue['running']) {
            $backendStatus = 'stopped';
        } else {
            $backendStatus = sprintf(
                'partial (%s, %s)',
                $api['running'] ? "api PID {$api['pid']}" : 'api stopped',
                $queue['running'] ? "queue PID {$queue['pid']}" : 'queue stopped',
            );
        }

        fwrite(STDOUT, "backend: {$backendStatus}".PHP_EOL);

        if ($target === 'all') {
            $frontend = $captureStatus('frontend');
            $frontendStatus = $frontend['running'] ? "running (PID {$frontend['pid']})" : 'stopped';
            fwrite(STDOUT, "frontend: {$frontendStatus}".PHP_EOL);
        }
    } else {
        foreach ($serviceTargets as $serviceName) {
            $service = $captureStatus($serviceName);
            $serviceStatus = $service['running'] ? "running (PID {$service['pid']})" : 'stopped';
            fwrite(STDOUT, "{$serviceName}: {$serviceStatus}".PHP_EOL);
        }
    }

    if ($stateUpdated) {
        saveState($pidFile, $state);
    }

    exit(0);
}

if ($action === 'logs') {
    $logFiles = [];
    foreach ($serviceTargets as $serviceName) {
        $logFiles[] = $services[$serviceName]['out'];
        $logFiles[] = $services[$serviceName]['err'];
    }

    tailLogs($logFiles);
}

if ($action === 'down' || $action === 'stop') {
    foreach ($serviceTargets as $serviceName) {
        $pid = resolveServicePid($serviceName, $services[$serviceName], $state);
        if ($pid > 0) {
            stopPid($pid);
            fwrite(STDOUT, "Stopped {$serviceName} (PID {$pid}).".PHP_EOL);
        } else {
            fwrite(STDOUT, "No running {$serviceName} process found.".PHP_EOL);
        }

        unset($state[$serviceName]);
    }

    saveState($pidFile, $state);
    exit(0);
}

if ($action === 'restart') {
    foreach ($serviceTargets as $serviceName) {
        $pid = resolveServicePid($serviceName, $services[$serviceName], $state);
        if ($pid > 0) {
            stopPid($pid);
            fwrite(STDOUT, "Stopped {$serviceName} (PID {$pid}).".PHP_EOL);
            unset($state[$serviceName]);
        }
    }
}

// up/start/restart start phase
foreach ($serviceTargets as $serviceName) {
    $existingPid = resolveServicePid($serviceName, $services[$serviceName], $state);
    if ($existingPid > 0) {
        $state[$serviceName] = $existingPid;
        fwrite(STDOUT, "{$serviceName} already running (PID {$existingPid}).".PHP_EOL);
        continue;
    }

    $startedPid = startDetached(
        $services[$serviceName]['binary'],
        $services[$serviceName]['args'],
        $services[$serviceName]['cwd'],
        $services[$serviceName]['out'],
        $services[$serviceName]['err'],
    );

    $trackedPid = $startedPid;
    $port = (int) ($services[$serviceName]['port'] ?? 0);
    if ($port > 0) {
        $attempts = 30;
        while ($attempts > 0) {
            usleep(200000);
            $portPid = findListeningPid($port);
            if ($portPid > 0) {
                $trackedPid = $portPid;
                break;
            }
            $attempts--;
        }
    }

    if (! isPidRunning($trackedPid)) {
        fwrite(STDERR, "Failed to start {$serviceName}. Check logs in {$logsDir}.".PHP_EOL);
        continue;
    }

    $state[$serviceName] = $trackedPid;
    fwrite(STDOUT, "Started {$serviceName} (PID {$trackedPid}).".PHP_EOL);
}

saveState($pidFile, $state);

if ($target === 'all') {
    fwrite(STDOUT, PHP_EOL);
    fwrite(STDOUT, "API:      http://127.0.0.1:{$apiPort}".PHP_EOL);
    fwrite(STDOUT, "Frontend: http://127.0.0.1:{$frontendPort}".PHP_EOL);
    fwrite(STDOUT, "Logs:     {$logsDir}".PHP_EOL);
}

fwrite(STDOUT, PHP_EOL."Use `composer serve:status` and `composer serve:logs` for monitoring.".PHP_EOL);
