<?php

namespace App\Http\Requests\Api\V1\Admin;

use Illuminate\Foundation\Http\FormRequest;

class UpdateGlobalSettingsRequest extends FormRequest
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
            'branding.site_name' => ['nullable', 'string', 'max:120'],
            'branding.logo_path' => ['nullable', 'string', 'max:255'],
            'branding.logo_alt' => ['nullable', 'string', 'max:120'],
            'header.announcement_text' => ['nullable', 'string', 'max:255'],
            'header.announcement_link' => ['nullable', 'string', 'max:255'],
            'header.home_nav_label' => ['nullable', 'string', 'max:80'],
            'header.login_label' => ['nullable', 'string', 'max:80'],
            'header.contact_label' => ['nullable', 'string', 'max:80'],
            'header.contact_link' => ['nullable', 'string', 'max:255'],
            'header.add_listing_label' => ['nullable', 'string', 'max:80'],
            'header.add_listing_link' => ['nullable', 'string', 'max:255'],
            'footer.address' => ['nullable', 'string', 'max:255'],
            'footer.email' => ['nullable', 'email', 'max:180'],
            'footer.copyright_text' => ['nullable', 'string', 'max:255'],
        ];
    }
}
