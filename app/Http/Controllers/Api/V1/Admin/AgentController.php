<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\StoreAgentRequest;
use App\Http\Requests\Api\V1\Admin\UpdateAgentRequest;
use App\Http\Resources\Api\V1\Admin\AdminAgentResource;
use App\Models\Agent;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AgentController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $limit = max(1, min((int) $request->query('limit', 250), 500));
        $includeInactive = filter_var(
            $request->query('include_inactive', true),
            FILTER_VALIDATE_BOOLEAN,
        );

        $query = Agent::query()
            ->with('agency:id,name')
            ->orderByDesc('is_active')
            ->orderBy('first_name')
            ->orderBy('last_name');

        if (! $includeInactive) {
            $query->where('is_active', true);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $agents = $query
            ->limit($limit)
            ->get([
                'id',
                'agency_id',
                'first_name',
                'last_name',
                'email',
                'phone',
                'avatar_path',
                'position',
                'bio',
                'is_active',
                'created_at',
                'updated_at',
            ]);

        return response()->json([
            'data' => AdminAgentResource::collection($agents)->resolve(),
        ]);
    }

    public function show(int $agentId): AdminAgentResource
    {
        return new AdminAgentResource(
            Agent::query()
                ->with('agency:id,name')
                ->findOrFail($agentId),
        );
    }

    public function store(StoreAgentRequest $request): JsonResponse
    {
        $agent = Agent::query()->create($request->validated());

        return response()->json([
            'message' => 'Agent created.',
            'data' => new AdminAgentResource($agent->load('agency:id,name')),
        ], 201);
    }

    public function update(UpdateAgentRequest $request, int $agentId): JsonResponse
    {
        $agent = Agent::query()->findOrFail($agentId);
        $agent->fill($request->validated());
        $agent->save();

        return response()->json([
            'message' => 'Agent updated.',
            'data' => new AdminAgentResource($agent->load('agency:id,name')),
        ]);
    }

    public function destroy(int $agentId): JsonResponse
    {
        $agent = Agent::query()->findOrFail($agentId);
        $agent->delete();

        return response()->json([
            'message' => 'Agent deleted.',
        ]);
    }
}
