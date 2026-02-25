<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAgentRequest extends FormRequest
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
        $agentId = (int) $this->route('agentId');

        return [
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'first_name' => ['required', 'string', 'max:120'],
            'last_name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:255', Rule::unique('agents', 'email')->ignore($agentId)],
            'phone' => ['nullable', 'string', 'max:40'],
            'avatar_path' => ['nullable', 'string', 'max:255'],
            'position' => ['nullable', 'string', 'max:120'],
            'bio' => ['nullable', 'string', 'max:30000'],
            'is_active' => ['nullable', 'boolean'],
        ];
    }
}
