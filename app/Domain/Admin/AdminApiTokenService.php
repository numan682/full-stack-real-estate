<?php

namespace App\Domain\Admin;

use App\Models\AdminApiToken;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class AdminApiTokenService
{
    public function issueToken(User $user, bool $remember = false): array
    {
        $this->deleteExpiredTokens();

        $plainTextToken = Str::random(80);
        $expiresAt = now()->addHours($remember ? 24 * 7 : 12);

        $token = AdminApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'admin-panel',
            'token_hash' => $this->hashToken($plainTextToken),
            'expires_at' => $expiresAt,
        ]);

        $this->trimUserTokens($user);

        return [
            'token' => $plainTextToken,
            'expires_at' => $token->expires_at,
        ];
    }

    public function findValidToken(string $plainTextToken): ?AdminApiToken
    {
        $token = AdminApiToken::query()
            ->with('user')
            ->where('token_hash', $this->hashToken($plainTextToken))
            ->first();

        if (! $token) {
            return null;
        }

        if ($token->expires_at && $token->expires_at->isPast()) {
            $token->delete();

            return null;
        }

        $this->touchLastUsedAt($token);

        return $token;
    }

    public function revokeToken(AdminApiToken $token): void
    {
        $token->delete();
    }

    private function hashToken(string $token): string
    {
        return hash('sha256', $token);
    }

    private function deleteExpiredTokens(): void
    {
        AdminApiToken::query()
            ->whereNotNull('expires_at')
            ->where('expires_at', '<', now())
            ->delete();
    }

    private function trimUserTokens(User $user): void
    {
        $maxTokens = 10;
        $tokenIdsToKeep = AdminApiToken::query()
            ->where('user_id', $user->id)
            ->latest('id')
            ->limit($maxTokens)
            ->pluck('id');

        AdminApiToken::query()
            ->where('user_id', $user->id)
            ->whereNotIn('id', $tokenIdsToKeep)
            ->delete();
    }

    private function touchLastUsedAt(AdminApiToken $token): void
    {
        $currentLastUsedAt = $token->last_used_at;

        if (! $currentLastUsedAt instanceof Carbon || $currentLastUsedAt->lte(now()->subMinutes(2))) {
            $token->forceFill([
                'last_used_at' => now(),
            ])->save();
        }
    }
}
