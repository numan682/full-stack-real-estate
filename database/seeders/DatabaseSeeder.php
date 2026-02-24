<?php

namespace Database\Seeders;

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
        ]);

        $this->call(RealEstateSeeder::class);
        $this->call(CmsSeeder::class);
    }
}
