<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Admin\AdminApiTokenService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\LoginRequest;
use App\Models\AdminApiToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AdminApiTokenService $tokenService): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => 'Invalid credentials.',
            ]);
        }

        if ($user->isAgent() && ! $user->agent_id) {
            throw ValidationException::withMessages([
                'email' => 'Agent profile is not linked to this account.',
            ]);
        }

        $token = $tokenService->issueToken(
            $user,
            (bool) ($validated['remember'] ?? false),
            'portal-login',
        );

        return response()->json([
            'message' => 'Authenticated successfully.',
            'data' => [
                'token' => $token['token'],
                'expires_at' => $token['expires_at'],
                'redirect_path' => $this->resolveRedirectPath($user),
                'user' => $this->toUserPayload($user),
            ],
        ]);
    }

    public function me(): JsonResponse
    {
        $user = request()->user();

        return response()->json([
            'data' => [
                'user' => $user ? $this->toUserPayload($user) : null,
            ],
        ]);
    }

    public function logout(AdminApiTokenService $tokenService): JsonResponse
    {
        /** @var AdminApiToken|null $token */
        $token = request()->attributes->get('api_token');

        if ($token) {
            $tokenService->revokeToken($token);
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }

    private function toUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->portalRole(),
            'agent_id' => $user->agent_id,
        ];
    }

    private function resolveRedirectPath(User $user): string
    {
        if ($user->isAdmin()) {
            return '/admin';
        }

        if ($user->isAgent()) {
            return '/portal/agent';
        }

        return '/portal/customer';
    }
}
