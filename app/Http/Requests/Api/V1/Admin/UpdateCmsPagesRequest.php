<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCmsPagesRequest extends FormRequest
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
            'pages.*.template_key' => ['required', 'string', 'max:120'],
            'pages.*.slug' => ['nullable', 'string', 'max:180', 'regex:/^(?:[a-z0-9]+(?:[-_][a-z0-9]+)*(?:\/[a-z0-9]+(?:[-_][a-z0-9]+)*)*)?$/'],
            'pages.*.title' => ['nullable', 'string', 'max:180'],
            'pages.*.nav_label' => ['nullable', 'string', 'max:80'],
            'pages.*.nav_group' => ['nullable', 'string', 'max:80'],
            'pages.*.nav_order' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'pages.*.show_in_nav' => ['nullable', 'boolean'],
            'pages.*.is_active' => ['nullable', 'boolean'],
            'pages.*.seo' => ['nullable'],
            'pages.*.content' => ['nullable'],
        ];
    }
}
