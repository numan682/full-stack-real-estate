<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\BlogPostIndexRequest;
use App\Http\Requests\Api\V1\Admin\StoreBlogPostRequest;
use App\Http\Requests\Api\V1\Admin\UpdateBlogPostRequest;
use App\Http\Resources\Api\V1\Admin\AdminBlogPostResource;
use App\Models\BlogPost;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class BlogPostController extends Controller
{
    public function index(BlogPostIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();

        $query = BlogPost::query();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null) {
            $query->where('is_featured', (bool) $filters['featured']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $posts = $query
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => AdminBlogPostResource::collection($posts->getCollection())->resolve(),
            'meta' => [
                'current_page' => $posts->currentPage(),
                'last_page' => $posts->lastPage(),
                'per_page' => $posts->perPage(),
                'total' => $posts->total(),
            ],
        ]);
    }

    public function show(int $blogId): AdminBlogPostResource
    {
        return new AdminBlogPostResource(BlogPost::query()->findOrFail($blogId));
    }

    public function store(StoreBlogPostRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $post = BlogPost::query()->create([
            'uuid' => (string) Str::uuid(),
            'title' => $validated['title'],
            'slug' => $this->resolveSlug($validated['slug'] ?? null, $validated['title']),
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? null,
            'featured_image_path' => $validated['featured_image_path'] ?? null,
            'featured_image_alt' => $validated['featured_image_alt'] ?? null,
            'author_name' => $validated['author_name'] ?? null,
            'status' => $validated['status'],
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'seo_payload' => is_array($validated['seo_payload'] ?? null) ? $validated['seo_payload'] : [],
            'published_at' => $this->resolvePublishedAt(
                $validated['status'],
                $validated['published_at'] ?? null,
            ),
        ]);

        return response()->json([
            'message' => 'Blog post created.',
            'data' => new AdminBlogPostResource($post),
        ], 201);
    }

    public function update(UpdateBlogPostRequest $request, int $blogId): JsonResponse
    {
        $post = BlogPost::query()->findOrFail($blogId);
        $validated = $request->validated();

        $post->fill([
            'title' => $validated['title'],
            'slug' => $this->resolveSlug($validated['slug'] ?? null, $validated['title'], $post->id),
            'excerpt' => $validated['excerpt'] ?? null,
            'content' => $validated['content'] ?? null,
            'featured_image_path' => $validated['featured_image_path'] ?? null,
            'featured_image_alt' => $validated['featured_image_alt'] ?? null,
            'author_name' => $validated['author_name'] ?? null,
            'status' => $validated['status'],
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'seo_payload' => is_array($validated['seo_payload'] ?? null) ? $validated['seo_payload'] : [],
            'published_at' => $this->resolvePublishedAt(
                $validated['status'],
                $validated['published_at'] ?? null,
                $post->published_at,
            ),
        ]);
        $post->save();

        return response()->json([
            'message' => 'Blog post updated.',
            'data' => new AdminBlogPostResource($post),
        ]);
    }

    public function destroy(int $blogId): JsonResponse
    {
        $post = BlogPost::query()->findOrFail($blogId);
        $post->delete();

        return response()->json([
            'message' => 'Blog post deleted.',
        ]);
    }

    private function resolveSlug(?string $slug, string $title, ?int $ignoreBlogId = null): string
    {
        $baseSlug = Str::slug($slug ?: $title);
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'post';
        $candidate = $baseSlug;
        $suffix = 2;

        while (
            BlogPost::query()
                ->when($ignoreBlogId, fn ($query) => $query->whereKeyNot($ignoreBlogId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    private function resolvePublishedAt(string $status, mixed $publishedAt = null, mixed $currentPublishedAt = null): ?Carbon
    {
        if ($status !== 'published') {
            return null;
        }

        if (is_string($publishedAt) && trim($publishedAt) !== '') {
            return Carbon::parse($publishedAt);
        }

        if ($currentPublishedAt instanceof Carbon) {
            return $currentPublishedAt;
        }

        return now();
    }
}
