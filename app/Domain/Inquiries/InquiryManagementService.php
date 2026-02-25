<?php

namespace App\Domain\Inquiries;

use App\Models\Inquiry;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class InquiryManagementService
{
    /**
     * @param  array<string, mixed>  $filters
     */
    public function search(array $filters, ?int $agentId = null, int $defaultPerPage = 30): LengthAwarePaginator
    {
        $query = Inquiry::query()
            ->with('property:id,title,slug');

        if ($agentId !== null) {
            $query->whereHas('property', fn ($propertyQuery) => $propertyQuery->where('agent_id', $agentId));
        }

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = (int) ($filters['per_page'] ?? $defaultPerPage);

        return $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();
    }

    public function findForStatusUpdate(int $inquiryId, ?int $agentId = null): Inquiry
    {
        $query = Inquiry::query();

        if ($agentId !== null) {
            $query->whereHas('property', fn ($propertyQuery) => $propertyQuery->where('agent_id', $agentId));
        }

        return $query->findOrFail($inquiryId);
    }

    public function updateStatus(Inquiry $inquiry, string $status): Inquiry
    {
        $inquiry->update([
            'status' => $status,
        ]);

        return $inquiry->load('property:id,title,slug');
    }
}
