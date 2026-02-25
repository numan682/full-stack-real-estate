<?php

namespace App\Http\Resources\Api\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'uuid' => $this->uuid,
            'agent_id' => $this->agent_id,
            'title' => $this->title,
            'slug' => $this->slug,
            'description' => $this->description,
            'property_type' => $this->property_type,
            'listing_type' => $this->listing_type,
            'status' => $this->status,
            'bedrooms' => $this->bedrooms,
            'bathrooms' => $this->bathrooms,
            'area_sqft' => $this->area_sqft,
            'price' => $this->price,
            'address_line' => $this->address_line,
            'city' => $this->city,
            'state' => $this->state,
            'postal_code' => $this->postal_code,
            'country' => $this->country,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'features' => $this->features,
            'is_featured' => $this->is_featured,
            'published_at' => $this->published_at,
            'agency' => $this->whenLoaded('agency', fn () => [
                'id' => $this->agency?->id,
                'name' => $this->agency?->name,
                'slug' => $this->agency?->slug,
            ]),
            'agent' => $this->whenLoaded('agent', fn () => [
                'id' => $this->agent?->id,
                'first_name' => $this->agent?->first_name,
                'last_name' => $this->agent?->last_name,
                'full_name' => $this->agent?->full_name,
                'email' => $this->agent?->email,
                'phone' => $this->agent?->phone,
                'avatar_path' => $this->agent?->avatar_path,
                'position' => $this->agent?->position,
                'is_active' => (bool) $this->agent?->is_active,
            ]),
            'primary_image' => $this->whenLoaded('primaryImage', fn () => [
                'path' => $this->primaryImage?->path,
                'alt_text' => $this->primaryImage?->alt_text,
            ]),
            'images' => $this->whenLoaded('images', fn () => $this->images->map(fn ($image) => [
                'id' => $image->id,
                'path' => $image->path,
                'alt_text' => $image->alt_text,
                'is_primary' => (bool) $image->is_primary,
                'sort_order' => $image->sort_order,
            ])->values()),
        ];
    }
}
