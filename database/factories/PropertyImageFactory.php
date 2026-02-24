<?php

namespace Database\Factories;

use App\Models\Property;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\PropertyImage>
 */
class PropertyImageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'property_id' => Property::factory(),
            'path' => '/images/listing/img_'.str_pad((string) fake()->numberBetween(1, 72), 2, '0', STR_PAD_LEFT).'.jpg',
            'alt_text' => fake()->sentence(4),
            'sort_order' => fake()->numberBetween(0, 6),
            'is_primary' => false,
        ];
    }
}
