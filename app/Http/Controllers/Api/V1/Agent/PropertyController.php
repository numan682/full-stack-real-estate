<?php

namespace App\Http\Controllers\Api\V1\Agent;

use App\Domain\Properties\PropertyCrudService;
use App\Domain\Properties\PropertyManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\PropertyIndexRequest;
use App\Http\Requests\Api\V1\Admin\StorePropertyRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePropertyRequest;
use App\Http\Resources\Api\V1\Admin\AdminPropertyResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyManagementService $propertyManagementService,
        private readonly PropertyCrudService $propertyCrudService,
    ) {}

    public function index(PropertyIndexRequest $request): JsonResponse
    {
        $agentId = $this->resolveAgentId();
        $filters = $request->validated();
        $properties = $this->propertyManagementService->search($filters, $agentId);

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
        $property = $this->propertyManagementService->findForDisplay($propertyId, $this->resolveAgentId());

        return new AdminPropertyResource($property);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $agentId = $this->resolveAgentId();
        $validated = $request->validated();
        $property = $this->propertyCrudService->create($validated, $agentId);

        return response()->json([
            'message' => 'Property created.',
            'data' => new AdminPropertyResource($property),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, int $propertyId): JsonResponse
    {
        $agentId = $this->resolveAgentId();
        $property = $this->propertyManagementService->findForDisplay($propertyId, $agentId);
        $validated = $request->validated();
        $property = $this->propertyCrudService->update($property, $validated, $agentId);

        return response()->json([
            'message' => 'Property updated.',
            'data' => new AdminPropertyResource($property),
        ]);
    }

    private function resolveAgentId(): int
    {
        /** @var User|null $user */
        $user = request()->user();

        if (! $user || ! $user->agent_id) {
            abort(403, 'Agent profile is required.');
        }

        return (int) $user->agent_id;
    }
}
