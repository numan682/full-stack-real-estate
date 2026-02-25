<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\AgentIndexRequest;
use App\Http\Resources\Api\V1\AgentResource;
use App\Models\Agent;
use Illuminate\Support\Str;

class AgentController extends Controller
{
    public function index(AgentIndexRequest $request)
    {
        $filters = $request->validated();

        $query = Agent::query()
            ->where('is_active', true)
            ->with('agency:id,name,slug,email,phone,website,city,state,country')
            ->withCount([
                'properties as published_properties_count' => fn ($builder) => $builder->published(),
            ]);

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('position', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['agency_id'])) {
            $query->where('agency_id', (int) $filters['agency_id']);
        }

        match ($filters['sort'] ?? 'name_asc') {
            'newest' => $query->orderByDesc('id'),
            'oldest' => $query->orderBy('id'),
            'name_desc' => $query->orderByDesc('first_name')->orderByDesc('last_name')->orderByDesc('id'),
            default => $query->orderBy('first_name')->orderBy('last_name')->orderBy('id'),
        };

        $perPage = (int) ($filters['per_page'] ?? 12);
        $agents = $query->paginate($perPage)->withQueryString();

        return AgentResource::collection($agents);
    }

    public function show(string $agent): AgentResource
    {
        $record = $this->resolveActiveAgent($agent);

        abort_if(! $record, 404);

        $record->load([
            'agency:id,name,slug,email,phone,website,city,state,country',
            'properties' => fn ($builder) => $builder
                ->published()
                ->with('primaryImage:id,property_id,path,alt_text')
                ->orderByDesc('published_at')
                ->orderByDesc('id')
                ->limit(8),
        ]);

        $record->loadCount([
            'properties as published_properties_count' => fn ($builder) => $builder->published(),
        ]);

        return new AgentResource($record);
    }

    private function resolveActiveAgent(string $identifier): ?Agent
    {
        $normalized = trim(Str::of($identifier)->lower()->toString());
        if ($normalized === '') {
            return null;
        }

        $baseQuery = Agent::query()->where('is_active', true);

        if (ctype_digit($normalized)) {
            return $baseQuery->whereKey((int) $normalized)->first();
        }

        if (preg_match('/-(\d+)$/', $normalized, $matches) === 1) {
            $candidate = $baseQuery->whereKey((int) $matches[1])->first();
            if ($candidate) {
                $candidateSlug = Str::slug($candidate->full_name).'-'.$candidate->id;
                if ($candidateSlug === $normalized) {
                    return $candidate;
                }
            }
        }

        return $baseQuery
            ->get()
            ->first(function (Agent $candidate) use ($normalized): bool {
                $candidateSlug = Str::slug($candidate->full_name).'-'.$candidate->id;
                return $candidateSlug === $normalized;
            });
    }
}
