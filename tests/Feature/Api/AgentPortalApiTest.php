<?php

namespace Tests\Feature\Api;

use App\Models\Agent;
use App\Models\Inquiry;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AgentPortalApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_agent_can_only_access_own_listings_and_tickets(): void
    {
        $agentOne = Agent::factory()->create();
        $agentTwo = Agent::factory()->create();

        $agentOneUser = User::factory()->create([
            'email' => 'agent-one@example.com',
            'password' => 'agent12345',
            'role' => User::ROLE_AGENT,
            'agent_id' => $agentOne->id,
        ]);

        $propertyOne = Property::factory()->create([
            'agency_id' => $agentOne->agency_id,
            'agent_id' => $agentOne->id,
        ]);

        $propertyTwo = Property::factory()->create([
            'agency_id' => $agentTwo->agency_id,
            'agent_id' => $agentTwo->id,
        ]);

        $inquiryOne = Inquiry::query()->create([
            'property_id' => $propertyOne->id,
            'full_name' => 'Alice Buyer',
            'email' => 'alice@example.com',
            'phone' => '123456789',
            'message' => 'Can I schedule a tour?',
            'source' => 'listing-page',
            'status' => 'new',
        ]);

        $inquiryTwo = Inquiry::query()->create([
            'property_id' => $propertyTwo->id,
            'full_name' => 'Bob Buyer',
            'email' => 'bob@example.com',
            'phone' => '123456780',
            'message' => 'Need details',
            'source' => 'listing-page',
            'status' => 'new',
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $agentOneUser->email,
            'password' => 'agent12345',
        ])->assertOk()->json('data.token');

        $propertiesResponse = $this->getJson('/api/v1/agent/properties', [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $propertyIds = collect($propertiesResponse->json('data'))->pluck('id')->all();
        $this->assertContains($propertyOne->id, $propertyIds);
        $this->assertNotContains($propertyTwo->id, $propertyIds);

        $inquiriesResponse = $this->getJson('/api/v1/agent/inquiries', [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $inquiryIds = collect($inquiriesResponse->json('data'))->pluck('id')->all();
        $this->assertContains($inquiryOne->id, $inquiryIds);
        $this->assertNotContains($inquiryTwo->id, $inquiryIds);

        $this->patchJson("/api/v1/agent/inquiries/{$inquiryOne->id}/status", [
            'status' => 'contacted',
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'contacted');

        $this->assertSame('contacted', $inquiryOne->fresh()->status);

        $this->patchJson("/api/v1/agent/inquiries/{$inquiryTwo->id}/status", [
            'status' => 'contacted',
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertNotFound();
    }

    public function test_agent_property_create_forces_authenticated_agent_ownership(): void
    {
        $agentOne = Agent::factory()->create();
        $agentTwo = Agent::factory()->create();

        $agentOneUser = User::factory()->create([
            'email' => 'agent-create@example.com',
            'password' => 'agent12345',
            'role' => User::ROLE_AGENT,
            'agent_id' => $agentOne->id,
        ]);

        $token = $this->postJson('/api/v1/auth/login', [
            'email' => $agentOneUser->email,
            'password' => 'agent12345',
        ])->assertOk()->json('data.token');

        $response = $this->postJson('/api/v1/agent/properties', [
            'title' => 'Agent Owned Listing',
            'property_type' => 'Apartment',
            'listing_type' => 'sale',
            'status' => 'draft',
            'price' => 250000,
            'address_line' => '120 Main Street',
            'city' => 'Austin',
            'state' => 'TX',
            'postal_code' => '78701',
            'country' => 'United States',
            'agent_id' => $agentTwo->id,
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertCreated();

        $createdPropertyId = (int) $response->json('data.id');
        $this->assertDatabaseHas('properties', [
            'id' => $createdPropertyId,
            'agent_id' => $agentOne->id,
            'title' => 'Agent Owned Listing',
        ]);
    }
}
