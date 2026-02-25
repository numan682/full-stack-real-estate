<?php

namespace Database\Seeders;

use App\Models\Agent;
use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Platform Admin',
            'email' => 'admin@homerealestate.test',
            'password' => 'admin12345',
            'is_admin' => true,
            'role' => User::ROLE_ADMIN,
        ]);

        $this->call(RealEstateSeeder::class);
        $this->call(CmsSeeder::class);

        User::factory()->create([
            'name' => 'Platform Customer',
            'email' => 'customer@homerealestate.test',
            'password' => 'customer12345',
            'is_admin' => false,
            'role' => User::ROLE_CUSTOMER,
        ]);

        $agent = Agent::query()->where('is_active', true)->first()
            ?? Agent::query()->first();

        if ($agent) {
            if (! $agent->is_active) {
                $agent->forceFill(['is_active' => true])->save();
            }

            User::factory()->create([
                'name' => $agent->full_name,
                'email' => 'agent@homerealestate.test',
                'password' => 'agent12345',
                'is_admin' => false,
                'role' => User::ROLE_AGENT,
                'agent_id' => $agent->id,
            ]);
        }
    }
}
