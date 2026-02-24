<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\PropertyIndexRequest;
use App\Http\Requests\Api\V1\Admin\StorePropertyRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePropertyRequest;
use App\Http\Resources\Api\V1\Admin\AdminPropertyResource;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class PropertyController extends Controller
{
    public function index(PropertyIndexRequest $request)
    {
        $filters = $request->validated();

        $query = Property::query()
            ->with([
                'agency:id,name',
                'agent:id,first_name,last_name',
                'primaryImage:id,property_id,path,alt_text',
            ]);

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%")
                    ->orWhere('address_line', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['listing_type'])) {
            $query->where('listing_type', $filters['listing_type']);
        }

        if (! empty($filters['city'])) {
            $query->where('city', $filters['city']);
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null) {
            $query->where('is_featured', (bool) $filters['featured']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);
        $properties = $query
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => AdminPropertyResource::collection($properties->getCollection())->resolve(),
            'meta' => [
                'current_page' => $properties->currentPage(),
                'last_page' => $properties->lastPage(),
                'per_page' => $properties->perPage(),
                'total' => $properties->total(),
            ],
        ]);
    }

    public function show(int $propertyId): AdminPropertyResource
    {
        $property = Property::query()
            ->with([
                'agency:id,name',
                'agent:id,first_name,last_name',
                'images:id,property_id,path,alt_text,sort_order,is_primary',
                'primaryImage:id,property_id,path,alt_text',
            ])
            ->findOrFail($propertyId);

        return new AdminPropertyResource($property);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $property = Property::query()->create([
            'agency_id' => $validated['agency_id'] ?? null,
            'agent_id' => $validated['agent_id'] ?? null,
            'uuid' => (string) Str::uuid(),
            'title' => $validated['title'],
            'slug' => $this->resolveSlug($validated['slug'] ?? null, $validated['title']),
            'description' => $validated['description'] ?? null,
            'property_type' => $validated['property_type'],
            'listing_type' => $validated['listing_type'],
            'status' => $validated['status'],
            'bedrooms' => $validated['bedrooms'] ?? null,
            'bathrooms' => $validated['bathrooms'] ?? null,
            'area_sqft' => $validated['area_sqft'] ?? null,
            'price' => $validated['price'],
            'address_line' => $validated['address_line'],
            'city' => $validated['city'],
            'state' => $validated['state'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'country' => $validated['country'] ?? 'United States',
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'features' => $this->normalizeFeatures($validated['features'] ?? []),
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'published_at' => $this->resolvePublishedAt(
                $validated['status'],
                $validated['published_at'] ?? null,
            ),
        ]);

        $this->syncImages($property, $validated['images'] ?? null);

        $property->load([
            'agency:id,name',
            'agent:id,first_name,last_name',
            'images:id,property_id,path,alt_text,sort_order,is_primary',
            'primaryImage:id,property_id,path,alt_text',
        ]);

        return response()->json([
            'message' => 'Property created.',
            'data' => new AdminPropertyResource($property),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, int $propertyId): JsonResponse
    {
        $property = Property::query()->findOrFail($propertyId);
        $validated = $request->validated();

        $property->fill([
            'agency_id' => $validated['agency_id'] ?? null,
            'agent_id' => $validated['agent_id'] ?? null,
            'title' => $validated['title'],
            'slug' => $this->resolveSlug($validated['slug'] ?? null, $validated['title'], $property->id),
            'description' => $validated['description'] ?? null,
            'property_type' => $validated['property_type'],
            'listing_type' => $validated['listing_type'],
            'status' => $validated['status'],
            'bedrooms' => $validated['bedrooms'] ?? null,
            'bathrooms' => $validated['bathrooms'] ?? null,
            'area_sqft' => $validated['area_sqft'] ?? null,
            'price' => $validated['price'],
            'address_line' => $validated['address_line'],
            'city' => $validated['city'],
            'state' => $validated['state'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'country' => $validated['country'] ?? 'United States',
            'latitude' => $validated['latitude'] ?? null,
            'longitude' => $validated['longitude'] ?? null,
            'features' => $this->normalizeFeatures($validated['features'] ?? []),
            'is_featured' => (bool) ($validated['is_featured'] ?? false),
            'published_at' => $this->resolvePublishedAt(
                $validated['status'],
                $validated['published_at'] ?? null,
                $property->published_at,
            ),
        ]);
        $property->save();

        if (array_key_exists('images', $validated)) {
            $this->syncImages($property, $validated['images'] ?? []);
        }

        $property->load([
            'agency:id,name',
            'agent:id,first_name,last_name',
            'images:id,property_id,path,alt_text,sort_order,is_primary',
            'primaryImage:id,property_id,path,alt_text',
        ]);

        return response()->json([
            'message' => 'Property updated.',
            'data' => new AdminPropertyResource($property),
        ]);
    }

    public function destroy(int $propertyId): JsonResponse
    {
        $property = Property::query()->findOrFail($propertyId);
        $property->delete();

        return response()->json([
            'message' => 'Property deleted.',
        ]);
    }

    private function resolveSlug(?string $slug, string $title, ?int $ignorePropertyId = null): string
    {
        $baseSlug = Str::slug($slug ?: $title);
        $baseSlug = $baseSlug !== '' ? $baseSlug : 'property';
        $candidate = $baseSlug;
        $suffix = 2;

        while (
            Property::query()
                ->when($ignorePropertyId, fn ($query) => $query->whereKeyNot($ignorePropertyId))
                ->where('slug', $candidate)
                ->exists()
        ) {
            $candidate = "{$baseSlug}-{$suffix}";
            $suffix++;
        }

        return $candidate;
    }

    /**
     * @param  array<int, mixed>|string|null  $features
     * @return array<int, mixed>
     */
    private function normalizeFeatures(array|string|null $features): array
    {
        if (is_string($features)) {
            $decoded = json_decode($features, true);

            return is_array($decoded) ? array_values($decoded) : [];
        }

        if (! is_array($features)) {
            return [];
        }

        return array_values($features);
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

    /**
     * @param  array<int, array<string, mixed>>|null  $images
     */
    private function syncImages(Property $property, ?array $images): void
    {
        if ($images === null) {
            return;
        }

        $normalizedImages = collect($images)
            ->filter(fn ($image): bool => is_array($image) && ! empty($image['path']))
            ->map(function (array $image, int $index): array {
                return [
                    'path' => (string) $image['path'],
                    'alt_text' => isset($image['alt_text']) ? (string) $image['alt_text'] : null,
                    'sort_order' => (int) ($image['sort_order'] ?? ($index + 1) * 10),
                    'is_primary' => (bool) ($image['is_primary'] ?? false),
                ];
            })
            ->values();

        PropertyImage::query()->where('property_id', $property->id)->delete();

        if ($normalizedImages->isEmpty()) {
            return;
        }

        $hasPrimary = $normalizedImages->contains(fn (array $image): bool => $image['is_primary']);

        $normalizedImages->each(function (array $image, int $index) use ($property, $hasPrimary): void {
            PropertyImage::query()->create([
                'property_id' => $property->id,
                'path' => $image['path'],
                'alt_text' => $image['alt_text'],
                'sort_order' => $image['sort_order'],
                'is_primary' => $hasPrimary ? $image['is_primary'] : $index === 0,
            ]);
        });
    }
}
