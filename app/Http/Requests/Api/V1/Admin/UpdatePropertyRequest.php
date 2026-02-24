<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePropertyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $propertyId = (int) $this->route('propertyId');

        return [
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'agent_id' => ['nullable', 'integer', 'exists:agents,id'],
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('properties', 'slug')->ignore($propertyId)],
            'description' => ['nullable', 'string', 'max:60000'],
            'property_type' => ['required', 'string', 'max:100'],
            'listing_type' => ['required', 'in:sale,rent'],
            'status' => ['required', 'in:draft,published,archived'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'bathrooms' => ['nullable', 'integer', 'min:0', 'max:50'],
            'area_sqft' => ['nullable', 'integer', 'min:0', 'max:200000'],
            'price' => ['required', 'numeric', 'min:0'],
            'address_line' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'state' => ['nullable', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'country' => ['nullable', 'string', 'max:100'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
            'features' => ['nullable'],
            'is_featured' => ['nullable', 'boolean'],
            'published_at' => ['nullable', 'date'],
            'images' => ['nullable', 'array'],
            'images.*.path' => ['required_with:images', 'string', 'max:255'],
            'images.*.alt_text' => ['nullable', 'string', 'max:255'],
            'images.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'images.*.is_primary' => ['nullable', 'boolean'],
        ];
    }
}
