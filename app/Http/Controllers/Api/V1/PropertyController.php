<?php

namespace App\Http\Controllers\Api\V1;

use App\Domain\Properties\PropertySearchService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\PropertyIndexRequest;
use App\Http\Resources\Api\V1\PropertyResource;
use App\Models\Property;

class PropertyController extends Controller
{
    public function __construct(
        private readonly PropertySearchService $propertySearchService
    ) {}

    public function index(PropertyIndexRequest $request)
    {
        $properties = $this->propertySearchService->search($request->validated());

        return PropertyResource::collection($properties);
    }

    public function show(Property $property): PropertyResource
    {
        abort_if($property->status !== 'published', 404);

        $property->load([
            'agency:id,name,slug',
            'agent:id,first_name,last_name,agency_id',
            'images:id,property_id,path,alt_text,sort_order,is_primary',
            'primaryImage:id,property_id,path,alt_text',
        ]);

        return new PropertyResource($property);
    }
}
