<?php

namespace App\Http\Requests\Api\V1\Admin;

use App\Support\CmsConfigService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateHomeTemplateRequest extends FormRequest
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
        $templates = array_keys(app(CmsConfigService::class)->getHomeTemplates());

        return [
            'home_template' => ['required', 'string', 'in:'.implode(',', $templates)],
        ];
    }
}
