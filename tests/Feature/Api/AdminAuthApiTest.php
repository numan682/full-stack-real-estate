<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_use_me_and_logout(): void
    {
        $admin = User::factory()->create([
            'email' => 'admin-api@example.com',
            'password' => 'admin12345',
            'is_admin' => true,
        ]);

        $loginResponse = $this->postJson('/api/v1/admin/auth/login', [
            'email' => $admin->email,
            'password' => 'admin12345',
        ])->assertOk();

        $token = $loginResponse->json('data.token');

        $this->assertIsString($token);
        $this->assertNotEmpty($token);

        $this->getJson('/api/v1/admin/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', $admin->email);

        $this->postJson('/api/v1/admin/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->getJson('/api/v1/admin/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])->assertUnauthorized();
    }

    public function test_non_admin_cannot_login_to_admin_api(): void
    {
        $user = User::factory()->create([
            'email' => 'user-api@example.com',
            'password' => 'user12345',
            'is_admin' => false,
        ]);

        $this->postJson('/api/v1/admin/auth/login', [
            'email' => $user->email,
            'password' => 'user12345',
        ])->assertStatus(422);
    }
}
