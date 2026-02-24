<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Admin\AdminApiTokenService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\LoginRequest;
use App\Models\AdminApiToken;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(LoginRequest $request, AdminApiTokenService $adminApiTokenService): JsonResponse
    {
        $validated = $request->validated();

        $user = User::query()
            ->where('email', $validated['email'])
            ->first();

        if (! $user || ! Hash::check($validated['password'], $user->password) || ! $user->is_admin) {
            throw ValidationException::withMessages([
                'email' => 'Invalid admin credentials.',
            ]);
        }

        $token = $adminApiTokenService->issueToken($user, (bool) ($validated['remember'] ?? false));

        return response()->json([
            'message' => 'Authenticated successfully.',
            'data' => [
                'token' => $token['token'],
                'expires_at' => $token['expires_at'],
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
            ],
        ]);
    }

    public function me(): JsonResponse
    {
        $user = request()->user();

        return response()->json([
            'data' => [
                'user' => [
                    'id' => $user?->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                ],
            ],
        ]);
    }

    public function logout(AdminApiTokenService $adminApiTokenService): JsonResponse
    {
        /** @var AdminApiToken|null $token */
        $token = request()->attributes->get('admin_api_token');

        if ($token) {
            $adminApiTokenService->revokeToken($token);
        }

        return response()->json([
            'message' => 'Logged out successfully.',
        ]);
    }
}
