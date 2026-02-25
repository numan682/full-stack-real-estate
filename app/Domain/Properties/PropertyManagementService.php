<?php

namespace App\Domain\Properties;

use App\Models\Property;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class PropertyManagementService
{
    public function __construct(
        private readonly PropertyCrudService $propertyCrudService
    ) {}

    /**
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters, ?int $agentId = null, int $defaultPerPage = 20): LengthAwarePaginator
    {
        $query = Property::query()
            ->with($this->propertyCrudService->summaryRelations());

        if ($agentId !== null) {
            $query->where('agent_id', $agentId);
        }

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

        $perPage = (int) ($filters['per_page'] ?? $defaultPerPage);

        return $query
            ->orderByDesc('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findForDisplay(int $propertyId, ?int $agentId = null): Property
    {
        $query = Property::query()
            ->with($this->propertyCrudService->detailRelations());

        if ($agentId !== null) {
            $query->where('agent_id', $agentId);
        }

        return $query->findOrFail($propertyId);
    }

    public function delete(Property $property): void
    {
        $property->delete();
    }
}
