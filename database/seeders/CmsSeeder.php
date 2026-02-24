<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use App\Models\CmsSection;
use App\Models\CmsSetting;
use Illuminate\Database\Seeder;

class CmsSeeder extends Seeder
{
    public function run(): void
    {
        CmsSetting::query()->updateOrCreate(
            ['key' => 'home.active_template'],
            [
                'type' => 'string',
                'value' => ['value' => 'home_01'],
            ],
        );

        CmsSetting::query()->updateOrCreate(
            ['key' => 'site.global'],
            [
                'type' => 'json',
                'value' => config('cms.global_settings', []),
            ],
        );

        foreach (config('cms.home_sections', []) as $section) {
            CmsSection::query()->updateOrCreate(
                [
                    'page_key' => 'home_01',
                    'section_key' => $section['section_key'],
                ],
                [
                    'name' => $section['name'] ?? null,
                    'sort_order' => $section['sort_order'] ?? 0,
                    'is_enabled' => (bool) ($section['is_enabled'] ?? true),
                    'payload' => $section['payload'] ?? [],
                ],
            );
        }

        foreach (config('cms.page_sections', []) as $pageKey => $sections) {
            if (! is_string($pageKey) || ! is_array($sections)) {
                continue;
            }

            foreach ($sections as $section) {
                CmsSection::query()->updateOrCreate(
                    [
                        'page_key' => $pageKey,
                        'section_key' => (string) ($section['section_key'] ?? ''),
                    ],
                    [
                        'name' => $section['name'] ?? null,
                        'sort_order' => (int) ($section['sort_order'] ?? 0),
                        'is_enabled' => (bool) ($section['is_enabled'] ?? true),
                        'payload' => is_array($section['payload'] ?? null) ? $section['payload'] : [],
                    ],
                );
            }
        }

        foreach (config('cms.pages', []) as $page) {
            $pageKey = (string) ($page['page_key'] ?? '');
            if ($pageKey === '') {
                continue;
            }

            CmsPage::query()->updateOrCreate(
                [
                    'page_key' => $pageKey,
                ],
                [
                    'template_key' => (string) ($page['template_key'] ?? 'about_us_01'),
                    'slug_path' => $this->normalizeSlug($page['slug'] ?? null),
                    'title' => $page['title'] ?? null,
                    'nav_label' => $page['nav_label'] ?? null,
                    'nav_group' => $page['nav_group'] ?? null,
                    'nav_order' => (int) ($page['nav_order'] ?? 0),
                    'show_in_nav' => (bool) ($page['show_in_nav'] ?? false),
                    'is_active' => (bool) ($page['is_active'] ?? true),
                    'seo_payload' => is_array($page['seo'] ?? null) ? $page['seo'] : [],
                    'content_payload' => is_array($page['content'] ?? null) ? $page['content'] : [],
                ],
            );
        }
    }

    private function normalizeSlug(mixed $rawSlug): ?string
    {
        if (! is_string($rawSlug)) {
            return null;
        }

        $slug = trim(trim($rawSlug), '/');

        return $slug === '' ? null : strtolower($slug);
    }
}
