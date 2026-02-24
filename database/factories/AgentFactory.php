<?php

namespace Database\Factories;

use App\Models\Agency;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Agent>
 */
class AgentFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'agency_id' => Agency::factory(),
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'phone' => fake()->phoneNumber(),
            'avatar_path' => '/images/agent/img_0'.fake()->numberBetween(1, 9).'.jpg',
            'position' => fake()->randomElement(['Senior Agent', 'Property Consultant', 'Broker']),
            'bio' => fake()->paragraph(),
            'is_active' => fake()->boolean(90),
        ];
    }
}
