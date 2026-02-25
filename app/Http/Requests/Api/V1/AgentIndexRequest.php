<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Foundation\Http\FormRequest;

class AgentIndexRequest extends FormRequest
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
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
            'search' => ['nullable', 'string', 'max:120'],
            'agency_id' => ['nullable', 'integer', 'min:1'],
            'sort' => ['nullable', 'in:newest,oldest,name_asc,name_desc'],
        ];
    }
}
