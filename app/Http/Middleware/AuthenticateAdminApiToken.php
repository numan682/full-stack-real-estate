<?php

namespace App\Http\Middleware;

use App\Domain\Admin\AdminApiTokenService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateAdminApiToken
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $bearerToken = $request->bearerToken();

        if (! $bearerToken) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $adminApiTokenService = app(AdminApiTokenService::class);
        $token = $adminApiTokenService->findValidToken($bearerToken);

        if (! $token || ! $token->user || ! $token->user->isAdmin()) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        $request->setUserResolver(fn () => $token->user);
        $request->attributes->set('admin_api_token', $token);

        return $next($request);
    }
}
