<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class CmsSection extends Model
{
    protected $fillable = [
        'page_key',
        'section_key',
        'name',
        'sort_order',
        'is_enabled',
        'payload',
    ];

    protected function casts(): array
    {
        return [
            'is_enabled' => 'boolean',
            'payload' => 'array',
        ];
    }
}
