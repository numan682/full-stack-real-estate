<?php

namespace Tests\Feature\Web;

use Tests\TestCase;

class AppShellTest extends TestCase
{
    public function test_backend_root_redirects_to_the_next_frontend(): void
    {
        $this->get('/')
            ->assertRedirect(config('app.frontend_url'));
    }

    public function test_backend_does_not_serve_public_template_routes(): void
    {
        $this->get('/index-2')
            ->assertNotFound();
    }
}
