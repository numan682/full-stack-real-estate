<?php

namespace App\Http\Resources\Api\V1;

use App\Models\Agent;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Str;

/**
 * @mixin Agent
 */
class AgentResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $fullName = $this->full_name;
        $slugBase = Str::slug($fullName);
        $slug = ($slugBase !== '' ? $slugBase : 'agent').'-'.$this->id;

        $publishedPropertiesCount = $this->published_properties_count
            ?? ($this->properties_count ?? null);

        return [
            'id' => $this->id,
            'slug' => $slug,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => $fullName,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_path' => $this->avatar_path,
            'position' => $this->position,
            'bio' => $this->bio,
            'is_active' => (bool) $this->is_active,
            'published_properties_count' => $publishedPropertiesCount !== null
                ? (int) $publishedPropertiesCount
                : null,
            'agency' => $this->when($this->relationLoaded('agency'), function (): ?array {
                if (! $this->agency) {
                    return null;
                }

                return [
                    'id' => $this->agency->id,
                    'name' => $this->agency->name,
                    'slug' => $this->agency->slug,
                    'email' => $this->agency->email,
                    'phone' => $this->agency->phone,
                    'website' => $this->agency->website,
                    'city' => $this->agency->city,
                    'state' => $this->agency->state,
                    'country' => $this->agency->country,
                ];
            }),
            'properties' => $this->when($this->relationLoaded('properties'), function () {
                return $this->properties->map(function ($property) {
                    return [
                        'id' => $property->id,
                        'title' => $property->title,
                        'slug' => $property->slug,
                        'listing_type' => $property->listing_type,
                        'price' => $property->price,
                        'address_line' => $property->address_line,
                        'city' => $property->city,
                        'state' => $property->state,
                        'country' => $property->country,
                        'bedrooms' => $property->bedrooms,
                        'bathrooms' => $property->bathrooms,
                        'area_sqft' => $property->area_sqft,
                        'is_featured' => (bool) $property->is_featured,
                        'primary_image' => $property->primaryImage ? [
                            'path' => $property->primaryImage->path,
                            'alt_text' => $property->primaryImage->alt_text,
                        ] : null,
                    ];
                })->values();
            }),
        ];
    }
}
