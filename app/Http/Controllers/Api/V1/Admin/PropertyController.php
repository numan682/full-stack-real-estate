<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Properties\PropertyCrudService;
use App\Domain\Properties\PropertyManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\PropertyIndexRequest;
use App\Http\Requests\Api\V1\Admin\StorePropertyRequest;
use App\Http\Requests\Api\V1\Admin\UpdatePropertyRequest;
use App\Http\Resources\Api\V1\Admin\AdminPropertyResource;
use Illuminate\Http\JsonResponse;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertyManagementService $propertyManagementService,
        private readonly PropertyCrudService $propertyCrudService,
    ) {}

    public function index(PropertyIndexRequest $request)
    {
        $filters = $request->validated();

        $properties = $this->propertyManagementService->search($filters);

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
        $property = $this->propertyManagementService->findForDisplay($propertyId);

        return new AdminPropertyResource($property);
    }

    public function store(StorePropertyRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $property = $this->propertyCrudService->create($validated);

        return response()->json([
            'message' => 'Property created.',
            'data' => new AdminPropertyResource($property),
        ], 201);
    }

    public function update(UpdatePropertyRequest $request, int $propertyId): JsonResponse
    {
        $property = $this->propertyManagementService->findForDisplay($propertyId);
        $validated = $request->validated();

        $property = $this->propertyCrudService->update($property, $validated);

        return response()->json([
            'message' => 'Property updated.',
            'data' => new AdminPropertyResource($property),
        ]);
    }

    public function destroy(int $propertyId): JsonResponse
    {
        $property = $this->propertyManagementService->findForDisplay($propertyId);
        $this->propertyManagementService->delete($property);

        return response()->json([
            'message' => 'Property deleted.',
        ]);
    }
}
