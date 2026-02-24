<?php

namespace Tests\Feature\Api;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PropertyApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_properties_index_returns_paginated_collection(): void
    {
        Property::factory()
            ->count(6)
            ->create([
                'status' => 'published',
                'published_at' => now(),
            ]);

        $response = $this->getJson('/api/v1/properties?per_page=5');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'slug', 'listing_type', 'price'],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_properties_show_uses_slug_route_binding(): void
    {
        $property = Property::factory()->create([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/properties/{$property->slug}");

        $response
            ->assertOk()
            ->assertJsonPath('data.slug', $property->slug);
    }

    public function test_properties_show_hides_unpublished_records(): void
    {
        $property = Property::factory()->create([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $response = $this->getJson("/api/v1/properties/{$property->slug}");

        $response->assertNotFound();
    }
}
