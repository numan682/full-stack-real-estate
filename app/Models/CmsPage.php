<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsPage extends Model
{
    protected $fillable = [
        'page_key',
        'template_key',
        'slug_path',
        'title',
        'nav_label',
        'nav_group',
        'nav_order',
        'show_in_nav',
        'is_active',
        'seo_payload',
        'content_payload',
    ];

    protected function casts(): array
    {
        return [
            'show_in_nav' => 'boolean',
            'is_active' => 'boolean',
            'seo_payload' => 'array',
            'content_payload' => 'array',
        ];
    }
}
