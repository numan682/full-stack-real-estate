<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class StoreAgentRequest extends FormRequest
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
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', 'unique:agents,email'],
            'phone' => ['nullable', 'string', 'max:40'],
            'avatar_path' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:30000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
