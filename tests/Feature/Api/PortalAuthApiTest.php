<?php

namespace Tests\Feature\Api;

use App\Models\Agent;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PortalAuthApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_portal_login_redirects_to_role_specific_destination(): void
    {
        $admin = User::factory()->create([
            'email' => 'portal-admin@example.com',
            'password' => 'admin12345',
            'is_admin' => true,
            'role' => User::ROLE_ADMIN,
        ]);

        $customer = User::factory()->create([
            'email' => 'portal-customer@example.com',
            'password' => 'customer12345',
            'is_admin' => false,
            'role' => User::ROLE_CUSTOMER,
        ]);

        $agent = Agent::factory()->create();
        User::factory()->create([
            'email' => 'portal-agent@example.com',
            'password' => 'agent12345',
            'is_admin' => false,
            'role' => User::ROLE_AGENT,
            'agent_id' => $agent->id,
        ]);

        $adminResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $admin->email,
            'password' => 'admin12345',
        ])->assertOk();

        $this->assertSame('/admin', $adminResponse->json('data.redirect_path'));
        $this->assertSame(User::ROLE_ADMIN, $adminResponse->json('data.user.role'));

        $customerResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $customer->email,
            'password' => 'customer12345',
        ])->assertOk();

        $this->assertSame('/portal/customer', $customerResponse->json('data.redirect_path'));
        $this->assertSame(User::ROLE_CUSTOMER, $customerResponse->json('data.user.role'));

        $agentResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'portal-agent@example.com',
            'password' => 'agent12345',
        ])->assertOk();

        $this->assertSame('/portal/agent', $agentResponse->json('data.redirect_path'));
        $this->assertSame(User::ROLE_AGENT, $agentResponse->json('data.user.role'));
        $this->assertSame($agent->id, $agentResponse->json('data.user.agent_id'));
    }

    public function test_portal_authenticated_user_can_get_profile_and_logout(): void
    {
        $user = User::factory()->create([
            'email' => 'portal-profile@example.com',
            'password' => 'password123',
            'role' => User::ROLE_CUSTOMER,
        ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $token = $loginResponse->json('data.token');

        $this->getJson('/api/v1/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.user.email', $user->email)
            ->assertJsonPath('data.user.role', User::ROLE_CUSTOMER);

        $this->postJson('/api/v1/auth/logout', [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->getJson('/api/v1/auth/me', [
            'Authorization' => "Bearer {$token}",
        ])->assertUnauthorized();
    }
}
