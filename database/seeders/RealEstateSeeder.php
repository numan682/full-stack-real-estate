<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\Agent;
use App\Models\BlogPost;
use App\Models\Inquiry;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Seeder;
use Illuminate\Support\Arr;

class RealEstateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Agency::factory()
            ->count(4)
            ->create()
            ->each(function (Agency $agency): void {
                $agents = Agent::factory()
                    ->count(3)
                    ->for($agency)
                    ->create();

                Property::factory()
                    ->count(12)
                    ->for($agency)
                    ->state(fn () => ['agent_id' => $agents->random()->id])
                    ->create()
                    ->each(function (Property $property): void {
                        PropertyImage::factory()
                            ->for($property)
                            ->state([
                                'path' => '/images/listing/img_'.str_pad((string) fake()->numberBetween(1, 72), 2, '0', STR_PAD_LEFT).'.jpg',
                                'sort_order' => 0,
                                'is_primary' => true,
                            ])
                            ->create();

                        PropertyImage::factory()
                            ->count(fake()->numberBetween(2, 5))
                            ->for($property)
                            ->sequence(
                                fn ($sequence) => ['sort_order' => $sequence->index + 1],
                            )
                            ->create();
                    });
            });

        $properties = Property::query()->pluck('id');

        for ($i = 0; $i < 25; $i++) {
            Inquiry::query()->create([
                'property_id' => Arr::random($properties->all()),
                'full_name' => fake()->name(),
                'email' => fake()->safeEmail(),
                'phone' => fake()->phoneNumber(),
                'message' => fake()->paragraph(),
                'source' => fake()->randomElement(['website', 'contact-form', 'listing-page']),
                'metadata' => [
                    'preferred_contact_time' => fake()->randomElement(['morning', 'afternoon', 'evening']),
                ],
                'ip_address' => fake()->ipv4(),
                'user_agent' => fake()->userAgent(),
            ]);
        }

        BlogPost::factory()->count(16)->create();
    }
}
