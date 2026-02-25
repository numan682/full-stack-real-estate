<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\CmsSection;
use App\Support\CmsConfigService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\View\View;

class CmsController extends Controller
{
    public function index(CmsConfigService $cmsConfigService): View
    {
        return view('admin.cms.index', [
            'homeTemplates' => $cmsConfigService->getHomeTemplates(),
            'activeHomeTemplate' => $cmsConfigService->getHomeTemplateKey(),
            'homeSections' => $cmsConfigService->getHomeSections(),
            'cmsPages' => $cmsConfigService->getCmsPages(),
            'globalSettings' => $cmsConfigService->getGlobalSettings(),
        ]);
    }

    public function updateHomeTemplate(Request $request, CmsConfigService $cmsConfigService): RedirectResponse
    {
        $validated = $request->validate([
            'home_template' => ['required', 'string', 'in:'.implode(',', array_keys($cmsConfigService->getHomeTemplates()))],
        ]);

        $cmsConfigService->setHomeTemplate($validated['home_template']);

        return back()->with('status', 'Active home template updated.');
    }

    public function updateHomeSections(Request $request, CmsConfigService $cmsConfigService): RedirectResponse
    {
        $validated = $request->validate([
            'sections' => ['required', 'array', 'min:1'],
            'sections.*.section_key' => ['required', 'string', 'max:120'],
            'sections.*.name' => ['nullable', 'string', 'max:180'],
            'sections.*.sort_order' => ['nullable', 'integer', 'min:0', 'max:5000'],
            'sections.*.is_enabled' => ['nullable', 'boolean'],
            'sections.*.payload' => ['nullable'],
        ]);

        $sections = $cmsConfigService->normalizeHomeSectionsPayload($validated['sections']);

        foreach ($sections as $section) {
            CmsSection::query()->updateOrCreate(
                [
                    'page_key' => 'home_01',
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

        $cmsConfigService->clearCache();

        return back()->with('status', 'Home sections updated.');
    }

    public function updateGlobalSettings(Request $request, CmsConfigService $cmsConfigService): RedirectResponse
    {
        $validated = $request->validate([
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
        ]);

        $cmsConfigService->setGlobalSettings($validated);

        return back()->with('status', 'Global settings updated.');
    }
}
