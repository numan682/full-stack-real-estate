<?php

namespace Database\Factories;

use App\Models\BlogPost;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<BlogPost>
 */
class BlogPostFactory extends Factory
{
    protected $model = BlogPost::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $status = fake()->randomElement(['draft', 'draft', 'published', 'published', 'archived']);
        $publishedAt = $status === 'published'
            ? fake()->dateTimeBetween('-12 months', 'now')
            : null;

        return [
            'uuid' => (string) Str::uuid(),
            'title' => fake()->sentence(7),
            'slug' => fake()->unique()->slug(4),
            'excerpt' => fake()->paragraph(),
            'content' => fake()->paragraphs(6, true),
            'featured_image_path' => '/images/blog/blog_'.str_pad((string) fake()->numberBetween(1, 6), 2, '0', STR_PAD_LEFT).'.jpg',
            'featured_image_alt' => fake()->sentence(4),
            'author_name' => fake()->name(),
            'status' => $status,
            'is_featured' => fake()->boolean(20),
            'seo_payload' => [
                'title' => fake()->sentence(6),
                'description' => fake()->sentence(14),
            ],
            'published_at' => $publishedAt,
        ];
    }
}
