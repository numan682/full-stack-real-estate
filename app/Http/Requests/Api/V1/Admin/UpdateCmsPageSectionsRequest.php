<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCmsPageSectionsRequest extends FormRequest
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
            'pages' => ['required', 'array', 'min:1'],
            'pages.*.page_key' => ['required', 'string', 'max:120', 'regex:/^[a-z0-9\-_]+$/'],
            'pages.*.sections' => ['required', 'array'],
            'pages.*.sections.*.section_key' => ['required', 'string', 'max:120'],
            'pages.*.sections.*.name' => ['nullable', 'string', 'max:180'],
            'pages.*.sections.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'pages.*.sections.*.is_enabled' => ['nullable', 'boolean'],
            'pages.*.sections.*.payload' => ['nullable'],
        ];
    }
}
