<?php

namespace Tests\Feature\Api;

use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InquiryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_inquiry_store_creates_record(): void
    {
        $property = Property::factory()->create([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $payload = [
            'property_id' => $property->id,
            'full_name' => 'Jane Doe',
            'email' => 'jane@example.com',
            'phone' => '+1 555 123 4567',
            'message' => 'I want to schedule a property visit this week.',
            'source' => 'website',
        ];

        $response = $this->postJson('/api/v1/inquiries', $payload);

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Inquiry submitted successfully.');

        $this->assertDatabaseHas('inquiries', [
            'property_id' => $property->id,
            'full_name' => 'Jane Doe',
            'email' => 'jane@example.com',
        ]);
    }

    public function test_inquiry_store_validates_required_fields(): void
    {
        $response = $this->postJson('/api/v1/inquiries', []);

        $response
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['full_name', 'email', 'message']);
    }
}
