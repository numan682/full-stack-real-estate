<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminPropertyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_properties_via_api(): void
    {
        $token = $this->authenticateAdmin();

        $createResponse = $this->postJson('/api/v1/admin/properties', [
            'title' => 'API Property',
            'property_type' => 'Apartment',
            'listing_type' => 'sale',
            'status' => 'draft',
            'price' => 245000,
            'address_line' => '123 API Street',
            'city' => 'Austin',
            'state' => 'TX',
            'country' => 'United States',
            'features' => ['parking', 'gym'],
            'is_featured' => true,
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertCreated();

        $propertyId = (int) $createResponse->json('data.id');

        $this->getJson('/api/v1/admin/properties', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonFragment([
                'id' => $propertyId,
            ]);

        $this->putJson("/api/v1/admin/properties/{$propertyId}", [
            'title' => 'API Property Updated',
            'slug' => 'api-property-updated',
            'property_type' => 'Apartment',
            'listing_type' => 'sale',
            'status' => 'published',
            'price' => 250000,
            'address_line' => '123 API Street',
            'city' => 'Austin',
            'state' => 'TX',
            'country' => 'United States',
            'features' => ['parking'],
            'is_featured' => false,
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'API Property Updated')
            ->assertJsonPath('data.status', 'published');

        $this->deleteJson("/api/v1/admin/properties/{$propertyId}", [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();
    }

    private function authenticateAdmin(): string
    {
        $admin = User::factory()->create([
            'email' => 'property-admin@example.com',
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
