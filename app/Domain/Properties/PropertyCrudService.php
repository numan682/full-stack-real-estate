<?php

namespace App\Domain\Properties;

use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class PropertyCrudService
{
    /**
     * @return array<int, string>
     */
    public function summaryRelations(): array
    {
        return [
            'agency:id,name',
            'agent:id,first_name,last_name,email,phone,avatar_path,position,is_active,agency_id',
            'primaryImage:id,property_id,path,alt_text',
        ];
    }

    /**
     * @return array<int, string>
     */
    public function detailRelations(): array
    {
        return [
            'agency:id,name',
            'agent:id,first_name,last_name,email,phone,avatar_path,position,is_active,agency_id',
            'images:id,property_id,path,alt_text,sort_order,is_primary',
            'primaryImage:id,property_id,path,alt_text',
        ];
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public function create(array $validated, ?int $forcedAgentId = null): Property
    {
        $property = new Property;
        $property->fill($this->buildAttributes($validated, null, $forcedAgentId));
        $property->uuid = (string) Str::uuid();
        $property->slug = $this->resolveSlug($validated['slug'] ?? null, (string) $validated['title']);
        $property->save();

        $this->syncImages($property, $validated['images'] ?? null);

        return $property->load($this->detailRelations());
    }

    /**
     * @param  array<string, mixed>  $validated
     */
    public function update(Property $property, array $validated, ?int $forcedAgentId = null): Property
    {
        $property->fill($this->buildAttributes($validated, $property, $forcedAgentId));
        $property->slug = $this->resolveSlug(
            $validated['slug'] ?? null,
            (string) $validated['title'],
            $property->id,
        );
        $property->save();

        if (array_key_exists('images', $validated)) {
            /** @var array<int, array<string, mixed>>|null $images */
            $images = is_array($validated['images'] ?? null) ? $validated['images'] : [];
            $this->syncImages($property, $images);
        }

        return $property->load($this->detailRelations());
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function buildAttributes(array $validated, ?Property $currentProperty, ?int $forcedAgentId): array
    {
        return [
            'agency_id' => $validated['agency_id'] ?? null,
            'agent_id' => $forcedAgentId ?? ($validated['agent_id'] ?? null),
            'title' => $validated['title'],
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
                (string) $validated['status'],
                $validated['published_at'] ?? null,
                $currentProperty?->published_at,
            ),
        ];
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
        $timestamp = now();

        $records = $normalizedImages
            ->map(function (array $image, int $index) use ($property, $hasPrimary, $timestamp): array {
                return [
                    'property_id' => $property->id,
                    'path' => $image['path'],
                    'alt_text' => $image['alt_text'],
                    'sort_order' => $image['sort_order'],
                    'is_primary' => $hasPrimary ? $image['is_primary'] : $index === 0,
                    'created_at' => $timestamp,
                    'updated_at' => $timestamp,
                ];
            })
            ->all();

        PropertyImage::query()->insert($records);
    }
}
