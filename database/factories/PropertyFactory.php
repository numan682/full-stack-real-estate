<?php

namespace Database\Factories;

use App\Models\Agency;
use App\Models\Agent;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Property>
 */
class PropertyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $title = fake()->randomElement([
            'Modern City Apartment',
            'Luxury Riverside Villa',
            'Downtown Office Space',
            'Family House with Garden',
            'Contemporary Condo Unit',
        ]).' '.fake()->numberBetween(10, 999);

        $listingType = fake()->randomElement(['sale', 'rent']);

        return [
            'agency_id' => Agency::factory(),
            'agent_id' => Agent::factory(),
            'uuid' => Str::uuid()->toString(),
            'title' => $title,
            'slug' => Str::slug($title).'-'.fake()->unique()->numberBetween(1000, 9999),
            'description' => fake()->paragraphs(3, true),
            'property_type' => fake()->randomElement(['apartment', 'house', 'villa', 'office', 'commercial']),
            'listing_type' => $listingType,
            'status' => 'published',
            'bedrooms' => fake()->numberBetween(1, 6),
            'bathrooms' => fake()->numberBetween(1, 4),
            'area_sqft' => fake()->numberBetween(700, 6000),
            'price' => $listingType === 'rent'
                ? fake()->numberBetween(1200, 9000)
                : fake()->numberBetween(180000, 2400000),
            'address_line' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->stateAbbr(),
            'postal_code' => fake()->postcode(),
            'country' => 'United States',
            'latitude' => fake()->latitude(25.0, 48.0),
            'longitude' => fake()->longitude(-124.0, -66.0),
            'features' => fake()->randomElements(
                ['parking', 'swimming_pool', 'security', 'gym', 'garden', 'pet_friendly'],
                fake()->numberBetween(2, 5)
            ),
            'is_featured' => fake()->boolean(30),
            'published_at' => fake()->dateTimeBetween('-60 days', 'now'),
        ];
    }
}
