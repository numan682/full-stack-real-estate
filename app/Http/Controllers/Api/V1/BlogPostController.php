<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\BlogPostIndexRequest;
use App\Http\Resources\Api\V1\BlogPostResource;
use App\Models\BlogPost;

class BlogPostController extends Controller
{
    public function index(BlogPostIndexRequest $request)
    {
        $filters = $request->validated();

        $query = BlogPost::query()->published();

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('excerpt', 'like', "%{$search}%")
                    ->orWhere('content', 'like', "%{$search}%");
            });
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null) {
            $query->where('is_featured', (bool) $filters['featured']);
        }

        match ($filters['sort'] ?? 'newest') {
            'oldest' => $query->orderBy('published_at')->orderBy('id'),
            default => $query->orderByDesc('published_at')->orderByDesc('id'),
        };

        $perPage = (int) ($filters['per_page'] ?? 9);
        $posts = $query->paginate($perPage)->withQueryString();

        return BlogPostResource::collection($posts);
    }

    public function show(BlogPost $blogPost): BlogPostResource
    {
        abort_if($blogPost->status !== 'published' || $blogPost->published_at === null, 404);

        return new BlogPostResource($blogPost);
    }
}
