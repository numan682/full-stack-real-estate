<?php

namespace Tests\Feature\Admin;

use App\Models\CmsSection;
use App\Models\CmsSetting;
use App\Models\User;
use Database\Seeders\CmsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminCmsTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_login_and_open_cms_panel(): void
    {
        $this->seed(CmsSeeder::class);

        $admin = User::factory()->create([
            'email' => 'admin@example.com',
            'password' => 'admin12345',
            'is_admin' => true,
        ]);

        $this->post('/admin/login', [
            'email' => $admin->email,
            'password' => 'admin12345',
        ])->assertRedirect(route('admin.dashboard'));

        $this->get('/admin/cms')
            ->assertOk()
            ->assertSee('CMS Control Panel');
    }

    public function test_admin_can_update_home_template_and_sections(): void
    {
        $this->seed(CmsSeeder::class);

        $admin = User::factory()->create([
            'is_admin' => true,
        ]);

        $this->actingAs($admin)
            ->post(route('admin.cms.home-template'), [
                'home_template' => 'index-3',
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(
            'index-3',
            data_get(CmsSetting::query()->where('key', 'home.active_template')->first()?->value, 'value')
        );

        $this->getJson('/api/v1/cms/config')
            ->assertOk()
            ->assertJsonPath('cms.homeTemplate', 'index-3');

        $this->actingAs($admin)
            ->post(route('admin.cms.home-sections'), [
                'sections' => [
                    [
                        'section_key' => 'hero_banner_one',
                        'name' => 'Hero',
                        'sort_order' => 5,
                        'is_enabled' => true,
                        'payload' => '{"headline":"Dynamic Hero"}',
                    ],
                ],
            ])
            ->assertSessionHasNoErrors();

        $section = CmsSection::query()
            ->where('page_key', 'home_01')
            ->where('section_key', 'hero_banner_one')
            ->first();

        $this->assertNotNull($section);
        $this->assertTrue((bool) $section->is_enabled);
        $this->assertSame('Dynamic Hero', data_get($section->payload, 'headline'));
    }

    public function test_non_admin_cannot_access_admin_cms_panel(): void
    {
        $user = User::factory()->create([
            'is_admin' => false,
        ]);

        $this->actingAs($user)
            ->get('/admin/cms')
            ->assertForbidden();
    }
}
