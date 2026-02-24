<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Database\Seeders\CmsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCmsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_update_cms_configuration_via_api(): void
    {
        $this->seed(CmsSeeder::class);
        $token = $this->authenticateAdmin();

        $this->putJson('/api/v1/admin/cms/home-template', [
            'home_template' => 'index-5',
        ], [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.active_home_template', 'index-5');

        $this->putJson('/api/v1/admin/cms/home-sections', [
            'sections' => [
                [
                    'section_key' => 'hero_banner_one',
                    'name' => 'Hero Banner Dynamic',
                    'sort_order' => 5,
                    'is_enabled' => true,
                    'payload' => [
                        'headline' => 'Dynamic headline from admin API',
                    ],
                ],
            ],
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->putJson('/api/v1/admin/cms/global-settings', [
            'branding' => [
                'site_name' => 'API Site Name',
                'logo_path' => '/images/logo/logo_02.svg',
                'logo_alt' => 'API Logo',
            ],
            'header' => [
                'announcement_text' => 'API announcement',
                'announcement_link' => '/listing_01',
                'home_nav_label' => 'Start',
            ],
            'footer' => [
                'address' => 'API address',
                'email' => 'cms@example.com',
            ],
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->putJson('/api/v1/admin/cms/pages', [
            'pages' => [
                [
                    'page_key' => 'about',
                    'template_key' => 'about_us_02',
                    'slug' => 'company/about',
                    'title' => 'About Company',
                    'nav_label' => 'About Us',
                    'nav_group' => 'main',
                    'nav_order' => 15,
                    'show_in_nav' => true,
                    'is_active' => true,
                    'seo' => [
                        'title' => 'About Company SEO',
                    ],
                    'content' => [
                        'hero' => [
                            'headline' => 'Custom headline',
                        ],
                    ],
                ],
            ],
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->putJson('/api/v1/admin/cms/page-sections', [
            'pages' => [
                [
                    'page_key' => 'about',
                    'sections' => [
                        [
                            'section_key' => 'hero_banner',
                            'name' => 'Hero',
                            'sort_order' => 10,
                            'is_enabled' => true,
                            'payload' => [
                                'title' => 'Dynamic About Hero',
                            ],
                        ],
                    ],
                ],
            ],
        ], [
            'Authorization' => "Bearer {$token}",
        ])->assertOk();

        $this->getJson('/api/v1/admin/cms', [
            'Authorization' => "Bearer {$token}",
        ])
            ->assertOk()
            ->assertJsonPath('data.active_home_template', 'index-5')
            ->assertJsonPath('data.global_settings.branding.site_name', 'API Site Name')
            ->assertJsonPath('data.global_settings.header.announcement_text', 'API announcement')
            ->assertJsonPath('data.home_sections.0.section_key', 'hero_banner_one')
            ->assertJsonPath('data.cms_pages.0.template_key', 'about_us_02')
            ->assertJsonPath('data.cms_pages.0.slug', 'company/about')
            ->assertJsonPath('data.page_sections.about.0.sectionKey', 'hero_banner')
            ->assertJsonPath('data.section_templates.hero_banner.label', 'Hero Banner');
    }

    private function authenticateAdmin(): string
    {
        $admin = User::factory()->create([
            'email' => 'cms-admin@example.com',
            'password' => 'admin12345',
            'is_admin' => true,
        ]);

        $response = $this->postJson('/api/v1/admin/auth/login', [
            'email' => $admin->email,
            'password' => 'admin12345',
        ])->assertOk();

        return (string) $response->json('data.token');
    }
}
