<?php

use App\Models\Agency;
use App\Models\Agent;
use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $agent = Agent::query()->where('is_active', true)->first()
            ?? Agent::query()->first();

        if (! $agent) {
            $agency = Agency::query()->first() ?? Agency::query()->create([
                'name' => 'Home Real Estate',
                'slug' => 'home-real-estate-demo-agency',
                'email' => 'agency@homerealestate.test',
                'phone' => '+1-555-0100',
                'website' => 'https://homerealestate.test',
                'address_line' => '100 Main Street',
                'city' => 'Austin',
                'state' => 'TX',
                'country' => 'United States',
                'logo_path' => '/images/logo/logo.svg',
                'description' => 'Demo agency profile for local development.',
                'is_verified' => true,
            ]);

            $agent = Agent::query()->create([
                'agency_id' => $agency->id,
                'first_name' => 'Demo',
                'last_name' => 'Agent',
                'email' => 'demo.agent@homerealestate.test',
                'phone' => '+1-555-0110',
                'avatar_path' => '/images/agent/img_01.jpg',
                'position' => 'Senior Agent',
                'bio' => 'Demo agent profile for local development.',
                'is_active' => true,
            ]);
        }

        if (! $agent->is_active) {
            $agent->forceFill(['is_active' => true])->save();
        }

        User::query()->updateOrCreate(
            ['email' => 'agent@homerealestate.test'],
            [
                'name' => $agent->full_name,
                'password' => Hash::make('agent12345'),
                'is_admin' => false,
                'role' => User::ROLE_AGENT,
                'agent_id' => $agent->id,
            ],
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        User::query()
            ->where('email', 'agent@homerealestate.test')
            ->delete();
    }
};
