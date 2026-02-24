<?php

namespace App\Http\Resources\Api\V1\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InquiryResource extends JsonResource
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
            'property_id' => $this->property_id,
            'full_name' => $this->full_name,
            'email' => $this->email,
            'phone' => $this->phone,
            'message' => $this->message,
            'source' => $this->source,
            'status' => $this->status,
            'ip_address' => $this->ip_address,
            'created_at' => $this->created_at,
            'property' => $this->whenLoaded('property', fn () => [
                'id' => $this->property?->id,
                'title' => $this->property?->title,
                'slug' => $this->property?->slug,
            ]),
        ];
    }
}
