<?php

use App\Http\Middleware\AddSecurityHeaders;
use App\Http\Middleware\AuthenticateAdminApiToken;
use App\Http\Middleware\AuthenticateApiToken;
use App\Http\Middleware\EnsureAdmin;
use App\Http\Middleware\EnsureUserRole;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->append(AddSecurityHeaders::class);
        $middleware->alias([
            'admin' => EnsureAdmin::class,
            'api_token' => AuthenticateApiToken::class,
            'admin_api_token' => AuthenticateAdminApiToken::class,
            'role' => EnsureUserRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
