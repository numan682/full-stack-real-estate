<?php

namespace Tests\Feature\Api;

use App\Models\Inquiry;
use App\Models\Property;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminInquiryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_list_and_update_inquiry_status(): void
    {
        $property = Property::factory()->create();
        $inquiry = Inquiry::query()->create([
            'property_id' => $property->id,
            'full_name' => 'API Lead',
            'email' => 'lead@example.com',
            'phone' => '123456',
            'message' => 'Interested in details.',
            'source' => 'website',
            'status' => 'new',
            'metadata' => [],
        ]);

        $token = $this->authenticateAdmin();

        $this->getJson('/api/v1/admin/inquiries', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.0.id', $inquiry->id);

        $this->patchJson("/api/v1/admin/inquiries/{$inquiry->id}/status", [
            'status' => 'resolved',
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.status', 'resolved');
    }

    private function authenticateAdmin(): string
    {
        $admin = User::factory()->create([
            'email' => 'inquiry-admin@example.com',
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
