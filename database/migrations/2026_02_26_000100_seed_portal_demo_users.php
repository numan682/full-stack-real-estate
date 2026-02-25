<?php

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
        User::query()->updateOrCreate(
            ['email' => 'admin@homerealestate.test'],
            [
                'name' => 'Platform Admin',
                'password' => Hash::make('admin12345'),
                'is_admin' => true,
                'role' => User::ROLE_ADMIN,
                'agent_id' => null,
            ],
        );

        User::query()->updateOrCreate(
            ['email' => 'customer@homerealestate.test'],
            [
                'name' => 'Platform Customer',
                'password' => Hash::make('customer12345'),
                'is_admin' => false,
                'role' => User::ROLE_CUSTOMER,
                'agent_id' => null,
            ],
        );

        $agent = Agent::query()->where('is_active', true)->first()
            ?? Agent::query()->first();

        if ($agent) {
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
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        User::query()
            ->whereIn('email', [
                'customer@homerealestate.test',
                'agent@homerealestate.test',
            ])
            ->delete();
    }
};
