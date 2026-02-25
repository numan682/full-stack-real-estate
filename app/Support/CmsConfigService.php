<?php

namespace App\Support;

use App\Models\CmsPage;
use App\Models\CmsSection;
use App\Models\CmsSetting;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CmsConfigService
{
    private const FRONTEND_CACHE_KEY = 'cms.frontend-config';

    public function getHomeTemplates(): array
    {
        return config('cms.home_templates', []);
    }

    public function getHomeTemplateKey(): string
    {
        $setting = $this->getSetting('home.active_template');
        $template = (string) ($setting['value'] ?? 'home_01');

        return array_key_exists($template, $this->getHomeTemplates())
            ? $template
            : 'home_01';
    }

    public function getGlobalSettings(): array
    {
        $defaults = config('cms.global_settings', []);
        $setting = $this->getSetting('site.global');

        if (! is_array($setting)) {
            return $defaults;
        }

        return array_replace_recursive($defaults, $setting);
    }

    public function getPageTemplateOptions(): array
    {
        return config('cms.page_templates', []);
    }

    public function getPageSectionTemplateOptions(): array
    {
        return config('cms.page_section_templates', []);
    }

    public function getCmsPages(): Collection
    {
        $pages = CmsPage::query()
            ->orderBy('nav_order')
            ->orderBy('id')
            ->get();

        if ($pages->isNotEmpty()) {
            return $pages;
        }

        return collect(config('cms.pages', []))
            ->map(function (array $page): CmsPage {
                $model = new CmsPage;
                $model->page_key = (string) ($page['page_key'] ?? '');
                $model->template_key = (string) ($page['template_key'] ?? 'about_us_01');
                $model->slug_path = $this->normalizeSlugPath($page['slug'] ?? null);
                $model->title = $page['title'] ?? null;
                $model->nav_label = $page['nav_label'] ?? null;
                $model->nav_group = $page['nav_group'] ?? null;
                $model->nav_order = (int) ($page['nav_order'] ?? 0);
                $model->show_in_nav = (bool) ($page['show_in_nav'] ?? false);
                $model->is_active = (bool) ($page['is_active'] ?? true);
                $model->seo_payload = is_array($page['seo'] ?? null) ? $page['seo'] : [];
                $model->content_payload = is_array($page['content'] ?? null) ? $page['content'] : [];

                return $model;
            })
            ->filter(fn (CmsPage $page): bool => $page->page_key !== '')
            ->values();
    }

    public function getHomeSections(): Collection
    {
        return $this->getPageSections('home_01');
    }

    public function getPageSections(string $pageKey): Collection
    {
        $sections = CmsSection::query()
            ->where('page_key', $pageKey)
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get();

        if ($sections->isNotEmpty()) {
            return $sections;
        }

        return $this->getConfiguredSectionsForPage($pageKey);
    }

    public function getPageSectionsMap(): array
    {
        $records = CmsSection::query()
            ->orderBy('sort_order')
            ->orderBy('id')
            ->get()
            ->groupBy('page_key');

        $pageKeys = collect(['home_01'])
            ->merge(array_keys(config('cms.page_sections', [])))
            ->merge($this->getCmsPages()->pluck('page_key')->all())
            ->merge($records->keys()->all())
            ->filter(fn (mixed $key): bool => is_string($key) && $key !== '')
            ->unique()
            ->values();

        $result = [];

        foreach ($pageKeys as $pageKey) {
            $group = $records->get($pageKey);

            if ($group instanceof Collection && $group->isNotEmpty()) {
                $result[$pageKey] = $group
                    ->map(fn (CmsSection $section) => $this->formatSection($section))
                    ->values()
                    ->all();

                continue;
            }

            $result[$pageKey] = $this->getConfiguredSectionsForPage($pageKey)
                ->map(fn (CmsSection $section) => $this->formatSection($section))
                ->values()
                ->all();
        }

        return $result;
    }

    public function setHomeTemplate(string $templateKey): void
    {
        CmsSetting::query()->updateOrCreate(
            ['key' => 'home.active_template'],
            [
                'type' => 'string',
                'value' => ['value' => $templateKey],
            ],
        );

        $this->clearCache();
    }

    public function setGlobalSettings(array $settings): void
    {
        CmsSetting::query()->updateOrCreate(
            ['key' => 'site.global'],
            [
                'type' => 'json',
                'value' => $settings,
            ],
        );

        $this->clearCache();
    }

    public function setCmsPages(array $pages): void
    {
        DB::transaction(function () use ($pages): void {
            foreach ($pages as $page) {
                CmsPage::query()->updateOrCreate(
                    ['page_key' => $page['page_key']],
                    [
                        'template_key' => $page['template_key'],
                        'slug_path' => $page['slug_path'],
                        'title' => $page['title'],
                        'nav_label' => $page['nav_label'],
                        'nav_group' => $page['nav_group'],
                        'nav_order' => $page['nav_order'],
                        'show_in_nav' => $page['show_in_nav'],
                        'is_active' => $page['is_active'],
                        'seo_payload' => $page['seo_payload'],
                        'content_payload' => $page['content_payload'],
                    ],
                );
            }
        });

        $this->clearCache();
    }

    public function setPageSections(string $pageKey, array $sections): void
    {
        DB::transaction(function () use ($pageKey, $sections): void {
            $sectionKeys = collect($sections)
                ->pluck('section_key')
                ->filter(fn (mixed $value): bool => is_string($value) && $value !== '')
                ->values();

            $query = CmsSection::query()->where('page_key', $pageKey);

            if ($sectionKeys->isNotEmpty()) {
                $query->whereNotIn('section_key', $sectionKeys->all());
            }

            $query->delete();

            foreach ($sections as $section) {
                CmsSection::query()->updateOrCreate(
                    [
                        'page_key' => $pageKey,
                        'section_key' => $section['section_key'],
                    ],
                    [
                        'name' => $section['name'] !== '' ? $section['name'] : null,
                        'sort_order' => $section['sort_order'],
                        'is_enabled' => $section['is_enabled'],
                        'payload' => $section['payload'],
                    ],
                );
            }
        });

        $this->clearCache();
    }

    public function getFrontendConfig(): array
    {
        return Cache::remember(self::FRONTEND_CACHE_KEY, now()->addMinutes(15), function (): array {
            $pages = $this->getCmsPages();

            return [
                'cms' => [
                    'homeTemplate' => $this->getHomeTemplateKey(),
                    'globalSettings' => $this->getGlobalSettings(),
                    'homeSections' => $this->getHomeSections()->map(fn (CmsSection $section) => [
                        'sectionKey' => $section->section_key,
                        'name' => $section->name,
                        'sortOrder' => $section->sort_order,
                        'isEnabled' => (bool) $section->is_enabled,
                        'payload' => $section->payload ?? [],
                    ])->values()->all(),
                    'pageSections' => $this->getPageSectionsMap(),
                    'pages' => $pages->map(fn (CmsPage $page) => [
                        'pageKey' => $page->page_key,
                        'templateKey' => $page->template_key,
                        'slug' => $page->slug_path ?? '',
                        'routePath' => $this->toRoutePath($page->slug_path),
                        'title' => $page->title,
                        'navLabel' => $page->nav_label,
                        'navGroup' => $page->nav_group,
                        'navOrder' => (int) $page->nav_order,
                        'showInNav' => (bool) $page->show_in_nav,
                        'isActive' => (bool) $page->is_active,
                        'seo' => is_array($page->seo_payload) ? $page->seo_payload : [],
                        'content' => is_array($page->content_payload) ? $page->content_payload : [],
                    ])->values()->all(),
                    'navigation' => $this->getNavigationItems($pages),
                ],
            ];
        });
    }

    public function normalizeSectionsPayload(array $sections): array
    {
        return $this->normalizeHomeSectionsPayload($sections);
    }

    public function normalizeHomeSectionsPayload(array $sections): array
    {
        return collect($sections)
            ->map(function (array $section): array {
                $payload = $section['payload'] ?? [];

                if (is_string($payload)) {
                    $decoded = json_decode($payload, true);
                    $payload = is_array($decoded) ? $decoded : [];
                }

                return [
                    'section_key' => (string) ($section['section_key'] ?? ''),
                    'name' => (string) ($section['name'] ?? ''),
                    'sort_order' => (int) ($section['sort_order'] ?? 0),
                    'is_enabled' => (bool) ($section['is_enabled'] ?? false),
                    'payload' => is_array($payload) ? $payload : [],
                ];
            })
            ->filter(fn (array $section): bool => $section['section_key'] !== '')
            ->values()
            ->all();
    }

    public function normalizeCmsPagesPayload(array $pages): array
    {
        $normalizedPages = collect($pages)
            ->map(function (array $page): array {
                $seoPayload = $page['seo'] ?? [];
                if (is_string($seoPayload)) {
                    $decoded = json_decode($seoPayload, true);
                    $seoPayload = is_array($decoded) ? $decoded : [];
                }

                $contentPayload = $page['content'] ?? [];
                if (is_string($contentPayload)) {
                    $decoded = json_decode($contentPayload, true);
                    $contentPayload = is_array($decoded) ? $decoded : [];
                }

                return [
                    'page_key' => strtolower(trim((string) ($page['page_key'] ?? ''))),
                    'template_key' => trim((string) ($page['template_key'] ?? '')),
                    'slug_path' => $this->normalizeSlugPath($page['slug'] ?? null),
                    'title' => $this->normalizeNullableString($page['title'] ?? null),
                    'nav_label' => $this->normalizeNullableString($page['nav_label'] ?? null),
                    'nav_group' => $this->normalizeNullableString($page['nav_group'] ?? null),
                    'nav_order' => (int) ($page['nav_order'] ?? 0),
                    'show_in_nav' => (bool) ($page['show_in_nav'] ?? false),
                    'is_active' => (bool) ($page['is_active'] ?? false),
                    'seo_payload' => is_array($seoPayload) ? $seoPayload : [],
                    'content_payload' => is_array($contentPayload) ? $contentPayload : [],
                ];
            })
            ->filter(fn (array $page): bool => $page['page_key'] !== '' && $page['template_key'] !== '')
            ->values();

        $duplicatePageKeys = $normalizedPages
            ->groupBy('page_key')
            ->filter(fn (Collection $entries): bool => $entries->count() > 1)
            ->keys()
            ->values()
            ->all();

        if ($duplicatePageKeys !== []) {
            throw ValidationException::withMessages([
                'pages' => ['Duplicate page keys found: '.implode(', ', $duplicatePageKeys).'.'],
            ]);
        }

        $duplicateSlugPaths = $normalizedPages
            ->filter(fn (array $page): bool => $page['slug_path'] !== null)
            ->groupBy('slug_path')
            ->filter(fn (Collection $entries): bool => $entries->count() > 1)
            ->keys()
            ->values()
            ->all();

        if ($duplicateSlugPaths !== []) {
            throw ValidationException::withMessages([
                'pages' => ['Duplicate slug paths found: '.implode(', ', $duplicateSlugPaths).'.'],
            ]);
        }

        $restrictedSlugPaths = $normalizedPages
            ->filter(function (array $page): bool {
                if ($page['slug_path'] === null) {
                    return false;
                }

                return str_starts_with($page['slug_path'], 'dashboard')
                    || str_starts_with($page['slug_path'], 'admin')
                    || str_starts_with($page['slug_path'], 'portal')
                    || $page['slug_path'] === 'login';
            })
            ->pluck('slug_path')
            ->filter()
            ->unique()
            ->values()
            ->all();

        if ($restrictedSlugPaths !== []) {
            throw ValidationException::withMessages([
                'pages' => ['Restricted slug prefixes detected: '.implode(', ', $restrictedSlugPaths).'. Use non-system paths.'],
            ]);
        }

        return $normalizedPages->all();
    }

    private function getSetting(string $key): array
    {
        $record = CmsSetting::query()->where('key', $key)->first();

        if (! $record) {
            return [];
        }

        return is_array($record->value) ? $record->value : [];
    }

    private function normalizeSlugPath(mixed $rawSlug): ?string
    {
        if (! is_string($rawSlug)) {
            return null;
        }

        $slug = trim(trim($rawSlug), '/');
        if ($slug === '') {
            return null;
        }

        return strtolower($slug);
    }

    private function normalizeNullableString(mixed $value): ?string
    {
        if (! is_string($value)) {
            return null;
        }

        $normalized = trim($value);

        return $normalized === '' ? null : $normalized;
    }

    private function toRoutePath(?string $slugPath): string
    {
        return $slugPath ? '/'.$slugPath : '/';
    }

    private function getNavigationItems(Collection $pages): array
    {
        return $pages
            ->filter(function (CmsPage $page): bool {
                if (! $page->is_active || ! $page->show_in_nav || empty($page->slug_path)) {
                    return false;
                }

                $slugPath = (string) $page->slug_path;

                return ! str_starts_with($slugPath, 'dashboard')
                    && ! str_starts_with($slugPath, 'admin')
                    && ! str_starts_with($slugPath, 'portal')
                    && $slugPath !== 'login';
            })
            ->sortBy([
                ['nav_order', 'asc'],
                ['id', 'asc'],
            ])
            ->values()
            ->map(fn (CmsPage $page) => [
                'pageKey' => $page->page_key,
                'label' => $page->nav_label ?: ($page->title ?: str($page->page_key)->headline()->toString()),
                'path' => $this->toRoutePath($page->slug_path),
                'group' => $page->nav_group,
                'order' => (int) $page->nav_order,
            ])
            ->all();
    }

    private function getConfiguredSectionsForPage(string $pageKey): Collection
    {
        $configuredSections = $pageKey === 'home_01'
            ? config('cms.home_sections', [])
            : config("cms.page_sections.{$pageKey}", []);

        if (! is_array($configuredSections)) {
            return collect();
        }

        return collect($configuredSections)
            ->map(function (array $section) use ($pageKey): CmsSection {
                $model = new CmsSection;
                $model->page_key = $pageKey;
                $model->section_key = (string) ($section['section_key'] ?? '');
                $model->name = $section['name'] ?? null;
                $model->sort_order = (int) ($section['sort_order'] ?? 0);
                $model->is_enabled = (bool) ($section['is_enabled'] ?? true);
                $model->payload = is_array($section['payload'] ?? null) ? $section['payload'] : [];

                return $model;
            })
            ->filter(fn (CmsSection $section): bool => $section->section_key !== '')
            ->values();
    }

    private function formatSection(CmsSection $section): array
    {
        return [
            'sectionKey' => $section->section_key,
            'name' => $section->name,
            'sortOrder' => (int) $section->sort_order,
            'isEnabled' => (bool) $section->is_enabled,
            'payload' => $section->payload ?? [],
        ];
    }

    public function clearCache(): void
    {
        Cache::forget(self::FRONTEND_CACHE_KEY);
    }
}
