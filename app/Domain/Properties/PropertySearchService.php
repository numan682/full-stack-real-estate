<?php

namespace App\Domain\Properties;

use App\Models\Property;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PropertySearchService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters): LengthAwarePaginator
    {
        $query = Property::query()
            ->published()
            ->with([
                'agency:id,name,slug',
                'agent:id,first_name,last_name,agency_id',
                'primaryImage:id,property_id,path,alt_text',
            ]);

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);

            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('title', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('address_line', 'like', "%{$search}%")
                    ->orWhere('city', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['listing_type'])) {
            $query->where('listing_type', $filters['listing_type']);
        }

        if (! empty($filters['property_type'])) {
            $query->where('property_type', $filters['property_type']);
        }

        if (! empty($filters['city'])) {
            $query->where('city', $filters['city']);
        }

        if (! empty($filters['state'])) {
            $query->where('state', $filters['state']);
        }

        if (! empty($filters['country'])) {
            $query->where('country', $filters['country']);
        }

        if (isset($filters['bedrooms'])) {
            $query->where('bedrooms', '>=', (int) $filters['bedrooms']);
        }

        if (isset($filters['bathrooms'])) {
            $query->where('bathrooms', '>=', (int) $filters['bathrooms']);
        }

        if (isset($filters['min_price'])) {
            $query->where('price', '>=', (float) $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $query->where('price', '<=', (float) $filters['max_price']);
        }

        if (array_key_exists('featured', $filters) && $filters['featured'] !== null) {
            $query->where('is_featured', (bool) $filters['featured']);
        }

        match ($filters['sort'] ?? 'newest') {
            'price_asc' => $query->orderBy('price'),
            'price_desc' => $query->orderByDesc('price'),
            default => $query->orderByDesc('published_at')->orderByDesc('id'),
        };

        $perPage = (int) ($filters['per_page'] ?? 12);

        return $query->paginate($perPage)->withQueryString();
    }
}
