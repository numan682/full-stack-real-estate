<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminBlogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_crud_blog_posts_via_api(): void
    {
        $token = $this->authenticateAdmin();

        $createResponse = $this->postJson('/api/v1/admin/blogs', [
            'title' => 'Launch Update',
            'status' => 'draft',
            'excerpt' => 'Draft excerpt.',
            'content' => 'Draft content body.',
            'author_name' => 'Admin User',
            'is_featured' => true,
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertCreated();

        $blogId = (int) $createResponse->json('data.id');

        $this->getJson('/api/v1/admin/blogs', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonFragment([
                'id' => $blogId,
            ]);

        $this->putJson("/api/v1/admin/blogs/{$blogId}", [
            'title' => 'Launch Update Published',
            'slug' => 'launch-update-published',
            'status' => 'published',
            'excerpt' => 'Published excerpt.',
            'content' => 'Published content body.',
            'author_name' => 'Admin User',
            'is_featured' => false,
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.title', 'Launch Update Published')
            ->assertJsonPath('data.status', 'published');

        $this->deleteJson("/api/v1/admin/blogs/{$blogId}", [], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();
    }

    private function authenticateAdmin(): string
    {
        $admin = User::factory()->create([
            'email' => 'blog-admin@example.com',
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
