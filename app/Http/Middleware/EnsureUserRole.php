<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     * @param  string  ...$allowedRoles
     */
    public function handle(Request $request, Closure $next, string ...$allowedRoles): Response
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if ($allowedRoles === []) {
            return $next($request);
        }

        $normalizedAllowedRoles = array_values(array_unique(array_map(
            fn (string $role): string => strtolower(trim($role)),
            $allowedRoles,
        )));

        if (! in_array($this->resolveRole($user), $normalizedAllowedRoles, true)) {
            return response()->json([
                'message' => 'Forbidden.',
            ], Response::HTTP_FORBIDDEN);
        }

        return $next($request);
    }

    private function resolveRole(User $user): string
    {
        return $user->portalRole();
    }
}
