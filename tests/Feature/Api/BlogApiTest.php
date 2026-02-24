<?php

namespace Tests\Feature\Api;

use App\Models\BlogPost;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BlogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_blogs_index_returns_paginated_collection(): void
    {
        BlogPost::factory()
            ->count(6)
            ->create([
                'status' => 'published',
                'published_at' => now(),
            ]);

        BlogPost::factory()->create([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $response = $this->getJson('/api/v1/blogs?per_page=5');

        $response
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    '*' => ['id', 'title', 'slug', 'status'],
                ],
                'links',
                'meta',
            ]);
    }

    public function test_blog_show_uses_slug_route_binding(): void
    {
        $post = BlogPost::factory()->create([
            'status' => 'published',
            'published_at' => now(),
        ]);

        $response = $this->getJson("/api/v1/blogs/{$post->slug}");

        $response
            ->assertOk()
            ->assertJsonPath('data.slug', $post->slug);
    }

    public function test_blog_show_hides_unpublished_records(): void
    {
        $post = BlogPost::factory()->create([
            'status' => 'draft',
            'published_at' => null,
        ]);

        $response = $this->getJson("/api/v1/blogs/{$post->slug}");

        $response->assertNotFound();
    }
}
