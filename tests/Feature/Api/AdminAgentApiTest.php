<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminAgentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_agents_via_api(): void
    {
        $token = $this->authenticateAdmin();

        $createResponse = $this->postJson('/api/v1/admin/agents', [
            'first_name' => 'Maya',
            'last_name' => 'Lopez',
            'email' => 'maya.agent@example.com',
            'phone' => '+1-555-3010',
            'position' => 'Listing Specialist',
            'bio' => 'Experienced real estate professional.',
            'is_active' => true,
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertCreated()
            ->assertJsonPath('data.full_name', 'Maya Lopez')
            ->assertJsonPath('data.email', 'maya.agent@example.com');

        $agentId = (int) $createResponse->json('data.id');

        $this->getJson('/api/v1/admin/agents', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonFragment([
                'id' => $agentId,
            ]);

        $this->getJson("/api/v1/admin/agents/{$agentId}", [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.id', $agentId);

        $this->putJson("/api/v1/admin/agents/{$agentId}", [
            'first_name' => 'Maya',
            'last_name' => 'Lopez',
            'email' => 'maya.agent@example.com',
            'phone' => '+1-555-4400',
            'position' => 'Lead Agent',
            'bio' => 'Updated bio',
            'is_active' => false,
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.position', 'Lead Agent')
            ->assertJsonPath('data.is_active', false);

        $this->deleteJson("/api/v1/admin/agents/{$agentId}", [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();
    }

    private function authenticateAdmin(): string
    {
        $admin = User::factory()->create([
            'email' => 'agent-admin@example.com',
            'password' => 'admin12345',
            'is_admin' => true,
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => $admin->email,
            'password' => 'admin12345',
        ])->assertOk();

        return (string) $response->json('data.token');
    }
}
