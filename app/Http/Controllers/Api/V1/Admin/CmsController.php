<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\UpdateCmsPageSectionsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateCmsPagesRequest;
use App\Http\Requests\Api\V1\Admin\UpdateGlobalSettingsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateHomeSectionsRequest;
use App\Http\Requests\Api\V1\Admin\UpdateHomeTemplateRequest;
use App\Models\CmsPage;
use App\Support\CmsConfigService;
use Illuminate\Http\JsonResponse;

class CmsController extends Controller
{
    public function index(CmsConfigService $cmsConfigService): JsonResponse
    {
        return response()->json([
            'data' => [
                'home_templates' => $cmsConfigService->getHomeTemplates(),
                'template_options' => $cmsConfigService->getPageTemplateOptions(),
                'section_templates' => $cmsConfigService->getPageSectionTemplateOptions(),
                'active_home_template' => $cmsConfigService->getHomeTemplateKey(),
                'home_sections' => $cmsConfigService->getHomeSections()->values(),
                'page_sections' => $cmsConfigService->getPageSectionsMap(),
                'cms_pages' => $cmsConfigService->getCmsPages()
                    ->map(fn (CmsPage $page) => [
                        'id' => $page->id,
                        'page_key' => $page->page_key,
                        'template_key' => $page->template_key,
                        'slug' => $page->slug_path,
                        'title' => $page->title,
                        'nav_label' => $page->nav_label,
                        'nav_group' => $page->nav_group,
                        'nav_order' => $page->nav_order,
                        'show_in_nav' => (bool) $page->show_in_nav,
                        'is_active' => (bool) $page->is_active,
                        'seo' => $page->seo_payload ?? [],
                        'content' => $page->content_payload ?? [],
                    ])
                    ->values(),
                'global_settings' => $cmsConfigService->getGlobalSettings(),
            ],
        ]);
    }

    public function updateHomeTemplate(UpdateHomeTemplateRequest $request, CmsConfigService $cmsConfigService): JsonResponse
    {
        $validated = $request->validated();

        $cmsConfigService->setHomeTemplate($validated['home_template']);

        return response()->json([
            'message' => 'Active home template updated.',
            'data' => [
                'active_home_template' => $cmsConfigService->getHomeTemplateKey(),
            ],
        ]);
    }

    public function updateHomeSections(UpdateHomeSectionsRequest $request, CmsConfigService $cmsConfigService): JsonResponse
    {
        $sections = $cmsConfigService->normalizeSectionsPayload($request->validated('sections'));
        $cmsConfigService->setPageSections('home_01', $sections);

        return response()->json([
            'message' => 'Home sections updated.',
            'data' => [
                'home_sections' => $cmsConfigService->getHomeSections()->values(),
            ],
        ]);
    }

    public function updatePageSections(UpdateCmsPageSectionsRequest $request, CmsConfigService $cmsConfigService): JsonResponse
    {
        $pages = $request->validated('pages');

        foreach ($pages as $page) {
            $pageKey = (string) ($page['page_key'] ?? '');
            if ($pageKey === '') {
                continue;
            }

            $sections = $cmsConfigService->normalizeSectionsPayload($page['sections'] ?? []);
            $cmsConfigService->setPageSections($pageKey, $sections);
        }

        return response()->json([
            'message' => 'Page sections updated.',
            'data' => [
                'page_sections' => $cmsConfigService->getPageSectionsMap(),
            ],
        ]);
    }

    public function updateGlobalSettings(UpdateGlobalSettingsRequest $request, CmsConfigService $cmsConfigService): JsonResponse
    {
        $validated = $request->validated();

        $cmsConfigService->setGlobalSettings($validated);

        return response()->json([
            'message' => 'Global settings updated.',
            'data' => [
                'global_settings' => $cmsConfigService->getGlobalSettings(),
            ],
        ]);
    }

    public function updatePages(UpdateCmsPagesRequest $request, CmsConfigService $cmsConfigService): JsonResponse
    {
        $pages = $cmsConfigService->normalizeCmsPagesPayload($request->validated('pages'));

        $cmsConfigService->setCmsPages($pages);

        return response()->json([
            'message' => 'CMS pages updated.',
            'data' => [
                'cms_pages' => $cmsConfigService->getCmsPages()
                    ->map(fn (CmsPage $page) => [
                        'id' => $page->id,
                        'page_key' => $page->page_key,
                        'template_key' => $page->template_key,
                        'slug' => $page->slug_path,
                        'title' => $page->title,
                        'nav_label' => $page->nav_label,
                        'nav_group' => $page->nav_group,
                        'nav_order' => $page->nav_order,
                        'show_in_nav' => (bool) $page->show_in_nav,
                        'is_active' => (bool) $page->is_active,
                        'seo' => $page->seo_payload ?? [],
                        'content' => $page->content_payload ?? [],
                    ])
                    ->values(),
            ],
        ]);
    }
}
