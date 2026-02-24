<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeSectionsRequest extends FormRequest
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
        return [
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.section_key' => ['required', 'string', 'max:120'],
            'sections.*.name' => ['nullable', 'string', 'max:180'],
            'sections.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'sections.*.is_enabled' => ['nullable', 'boolean'],
            'sections.*.payload' => ['nullable'],
        ];
    }
}
