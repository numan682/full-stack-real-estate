<?php

namespace Tests\Feature\Api;

use App\Models\Agent;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AgentApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_agents_index_returns_paginated_collection(): void
    {
        Agent::factory()
            ->count(6)
            ->create([
                'is_active' => true,
            ]);

        Agent::factory()->create([
            'is_active' => false,
        ]);

        $response = $this->getJson('/api/v1/agents?per_page=5');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'slug', 'full_name', 'email', 'is_active'],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_agent_show_supports_slug_with_id_suffix(): void
    {
        $agent = Agent::factory()->create([
            'is_active' => true,
        ]);
        $slug = Str::slug($agent->full_name).'-'.$agent->id;

        $response = $this->getJson("/api/v1/agents/{$slug}");

        $response
            ->assertOk()
            ->assertJsonPath('data.id', $agent->id)
            ->assertJsonPath('data.slug', $slug);
    }

    public function test_agent_show_hides_inactive_records(): void
    {
        $agent = Agent::factory()->create([
            'is_active' => false,
        ]);
        $slug = Str::slug($agent->full_name).'-'.$agent->id;

        $response = $this->getJson("/api/v1/agents/{$slug}");

        $response->assertNotFound();
    }
}
