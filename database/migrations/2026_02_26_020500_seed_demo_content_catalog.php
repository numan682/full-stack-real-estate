<?php

use App\Models\Agency;
use App\Models\Agent;
use App\Models\BlogPost;
use App\Models\Property;
use App\Models\PropertyImage;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $now = now();

        $agencyPayload = $this->demoAgencyPayload();
        $agency = Agency::withTrashed()->where('slug', $agencyPayload['slug'])->first();

        if ($agency) {
            $agency->fill($agencyPayload);
            $agency->save();
            if ($agency->trashed()) {
                $agency->restore();
            }
        } else {
            $agency = Agency::query()->create($agencyPayload);
        }

        $agents = [];
        foreach ($this->demoAgentSeeds() as $seed) {
            $payload = [
                'agency_id' => $agency->id,
                'first_name' => $seed['first_name'],
                'last_name' => $seed['last_name'],
                'email' => $seed['email'],
                'phone' => $seed['phone'],
                'avatar_path' => $seed['avatar_path'],
                'position' => $seed['position'],
                'bio' => $seed['bio'],
                'is_active' => true,
            ];

            $agent = Agent::withTrashed()->where('email', $seed['email'])->first();
            if ($agent) {
                $agent->fill($payload);
                $agent->save();
                if ($agent->trashed()) {
                    $agent->restore();
                }
            } else {
                $agent = Agent::query()->create($payload);
            }

            $agents[] = $agent;
        }

        foreach ($this->demoPropertySeeds() as $index => $seed) {
            $assignedAgent = $agents[$index % count($agents)];
            $payload = [
                'agency_id' => $agency->id,
                'agent_id' => $assignedAgent->id,
                'title' => $seed['title'],
                'slug' => $seed['slug'],
                'description' => $seed['description'],
                'property_type' => $seed['property_type'],
                'listing_type' => $seed['listing_type'],
                'status' => 'published',
                'bedrooms' => $seed['bedrooms'],
                'bathrooms' => $seed['bathrooms'],
                'area_sqft' => $seed['area_sqft'],
                'price' => $seed['price'],
                'address_line' => $seed['address_line'],
                'city' => $seed['city'],
                'state' => $seed['state'],
                'postal_code' => $seed['postal_code'],
                'country' => 'United States',
                'latitude' => $seed['latitude'],
                'longitude' => $seed['longitude'],
                'features' => $seed['features'],
                'is_featured' => $seed['is_featured'],
                'published_at' => $now->copy()->subDays($index + 3),
            ];

            $property = Property::withTrashed()->where('slug', $seed['slug'])->first();
            if ($property) {
                $property->fill($payload);
                $property->save();
                if ($property->trashed()) {
                    $property->restore();
                }
            } else {
                $property = Property::query()->create(array_merge(
                    $payload,
                    ['uuid' => (string) Str::uuid()],
                ));
            }

            PropertyImage::query()->where('property_id', $property->id)->delete();
            foreach ($this->demoListingImagePaths($index) as $imageIndex => $imagePath) {
                PropertyImage::query()->create([
                    'property_id' => $property->id,
                    'path' => $imagePath,
                    'alt_text' => $property->title,
                    'sort_order' => $imageIndex,
                    'is_primary' => $imageIndex === 0,
                ]);
            }
        }

        foreach ($this->demoBlogSeeds() as $index => $seed) {
            $payload = [
                'title' => $seed['title'],
                'slug' => $seed['slug'],
                'excerpt' => $seed['excerpt'],
                'content' => $seed['content'],
                'featured_image_path' => '/images/blog/blog_'.str_pad((string) (($index % 6) + 1), 2, '0', STR_PAD_LEFT).'.jpg',
                'featured_image_alt' => $seed['title'],
                'author_name' => 'Home Real Estate Editorial',
                'status' => 'published',
                'is_featured' => $index < 2,
                'seo_payload' => [
                    'title' => $seed['title'],
                    'description' => $seed['excerpt'],
                ],
                'published_at' => $now->copy()->subDays(10 + ($index * 2)),
            ];

            $post = BlogPost::withTrashed()->where('slug', $seed['slug'])->first();
            if ($post) {
                $post->fill($payload);
                $post->save();
                if ($post->trashed()) {
                    $post->restore();
                }
            } else {
                BlogPost::query()->create(array_merge(
                    $payload,
                    ['uuid' => (string) Str::uuid()],
                ));
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        BlogPost::withTrashed()
            ->whereIn('slug', array_column($this->demoBlogSeeds(), 'slug'))
            ->forceDelete();

        Property::withTrashed()
            ->whereIn('slug', array_column($this->demoPropertySeeds(), 'slug'))
            ->forceDelete();

        Agent::withTrashed()
            ->whereIn('email', array_column($this->demoAgentSeeds(), 'email'))
            ->forceDelete();

        Agency::withTrashed()
            ->where('slug', $this->demoAgencyPayload()['slug'])
            ->forceDelete();
    }

    /**
     * @return array<string, mixed>
     */
    private function demoAgencyPayload(): array
    {
        return [
            'name' => 'Home Real Estate Demo Agency',
            'slug' => 'demo-home-real-estate-agency',
            'email' => 'agency.demo@homerealestate.test',
            'phone' => '+1-555-1100',
            'website' => 'https://homerealestate.test',
            'address_line' => '2200 Market Street',
            'city' => 'Austin',
            'state' => 'TX',
            'country' => 'United States',
            'logo_path' => '/images/logo/logo.svg',
            'description' => 'Demo agency profile used for showcasing listings and agent assignment.',
            'is_verified' => true,
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function demoAgentSeeds(): array
    {
        return [
            [
                'first_name' => 'Olivia',
                'last_name' => 'Parker',
                'email' => 'demo.agent.olivia@homerealestate.test',
                'phone' => '+1-555-1101',
                'avatar_path' => '/images/agent/img_01.jpg',
                'position' => 'Senior Buyer Agent',
                'bio' => 'Specialized in first-time buyer guidance and suburban family homes.',
            ],
            [
                'first_name' => 'Noah',
                'last_name' => 'Ramirez',
                'email' => 'demo.agent.noah@homerealestate.test',
                'phone' => '+1-555-1102',
                'avatar_path' => '/images/agent/img_02.jpg',
                'position' => 'Luxury Property Consultant',
                'bio' => 'Focused on high-end listings, investment properties, and relocation clients.',
            ],
            [
                'first_name' => 'Mia',
                'last_name' => 'Thompson',
                'email' => 'demo.agent.mia@homerealestate.test',
                'phone' => '+1-555-1103',
                'avatar_path' => '/images/agent/img_03.jpg',
                'position' => 'Urban Housing Specialist',
                'bio' => 'Helps buyers and renters find strong value in urban and mixed-use neighborhoods.',
            ],
            [
                'first_name' => 'Liam',
                'last_name' => 'Brooks',
                'email' => 'demo.agent.liam@homerealestate.test',
                'phone' => '+1-555-1104',
                'avatar_path' => '/images/agent/img_04.jpg',
                'position' => 'Commercial Leasing Advisor',
                'bio' => 'Supports SMB clients with office, retail, and long-term leasing strategy.',
            ],
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function demoPropertySeeds(): array
    {
        return [
            [
                'title' => 'Demo: Lakeview Family Residence',
                'slug' => 'demo-lakeview-family-residence',
                'description' => 'Spacious family-ready home with open-plan kitchen, natural light, and quick access to schools and parks.',
                'property_type' => 'house',
                'listing_type' => 'sale',
                'bedrooms' => 4,
                'bathrooms' => 3,
                'area_sqft' => 2850,
                'price' => 685000,
                'address_line' => '1501 Meadow Glen Drive',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78746',
                'latitude' => 30.2912300,
                'longitude' => -97.8031000,
                'features' => ['parking', 'garden', 'pet_friendly', 'security'],
                'is_featured' => true,
            ],
            [
                'title' => 'Demo: Skyline Downtown Loft',
                'slug' => 'demo-skyline-downtown-loft',
                'description' => 'Modern loft with skyline views, integrated appliances, and walkable access to downtown work hubs.',
                'property_type' => 'apartment',
                'listing_type' => 'rent',
                'bedrooms' => 2,
                'bathrooms' => 2,
                'area_sqft' => 1320,
                'price' => 3400,
                'address_line' => '810 Congress Avenue, Unit 1804',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78701',
                'latitude' => 30.2695400,
                'longitude' => -97.7427600,
                'features' => ['gym', 'security', 'pet_friendly'],
                'is_featured' => true,
            ],
            [
                'title' => 'Demo: Riverside Office Studio',
                'slug' => 'demo-riverside-office-studio',
                'description' => 'Flexible office studio designed for growing teams, with conference corner and premium internet infrastructure.',
                'property_type' => 'office',
                'listing_type' => 'rent',
                'bedrooms' => 0,
                'bathrooms' => 1,
                'area_sqft' => 1960,
                'price' => 5200,
                'address_line' => '320 Riverside Drive, Suite 220',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78704',
                'latitude' => 30.2472000,
                'longitude' => -97.7374000,
                'features' => ['security', 'parking'],
                'is_featured' => false,
            ],
            [
                'title' => 'Demo: Garden Court Townhome',
                'slug' => 'demo-garden-court-townhome',
                'description' => 'Updated townhome in a quiet residential block with private patio and low-maintenance landscaping.',
                'property_type' => 'house',
                'listing_type' => 'sale',
                'bedrooms' => 3,
                'bathrooms' => 2,
                'area_sqft' => 2140,
                'price' => 525000,
                'address_line' => '422 Garden Court Lane',
                'city' => 'Round Rock',
                'state' => 'TX',
                'postal_code' => '78664',
                'latitude' => 30.5138500,
                'longitude' => -97.6789000,
                'features' => ['garden', 'parking', 'pet_friendly'],
                'is_featured' => false,
            ],
            [
                'title' => 'Demo: Northgate Retail Corner',
                'slug' => 'demo-northgate-retail-corner',
                'description' => 'High-traffic retail corner unit with storefront visibility, storage mezzanine, and customer parking.',
                'property_type' => 'commercial',
                'listing_type' => 'rent',
                'bedrooms' => 0,
                'bathrooms' => 1,
                'area_sqft' => 2480,
                'price' => 6900,
                'address_line' => '920 Northgate Plaza',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78758',
                'latitude' => 30.3943000,
                'longitude' => -97.7223000,
                'features' => ['parking', 'security'],
                'is_featured' => true,
            ],
            [
                'title' => 'Demo: Westside Executive Villa',
                'slug' => 'demo-westside-executive-villa',
                'description' => 'Premium villa with private pool, dual living spaces, and curated interior finishes for luxury buyers.',
                'property_type' => 'villa',
                'listing_type' => 'sale',
                'bedrooms' => 5,
                'bathrooms' => 4,
                'area_sqft' => 4620,
                'price' => 1495000,
                'address_line' => '78 Westside Ridge',
                'city' => 'Austin',
                'state' => 'TX',
                'postal_code' => '78733',
                'latitude' => 30.3305000,
                'longitude' => -97.8669000,
                'features' => ['swimming_pool', 'garden', 'security', 'gym', 'parking'],
                'is_featured' => true,
            ],
        ];
    }

    /**
     * @return array<int, array<string, string>>
     */
    private function demoBlogSeeds(): array
    {
        return [
            [
                'title' => 'Demo: 8 Steps to Prepare Your Home Before Listing',
                'slug' => 'demo-prepare-home-before-listing',
                'excerpt' => 'A practical checklist sellers can follow to reduce time on market and improve first-week offers.',
                'content' => 'Preparing a listing starts with decluttering, smart repairs, and accurate pricing strategy. This guide breaks each step into quick, actionable tasks sellers can complete before photo day.',
            ],
            [
                'title' => 'Demo: Rent vs Buy in 2026 - Decision Framework',
                'slug' => 'demo-rent-vs-buy-decision-framework',
                'excerpt' => 'Understand when buying builds stronger long-term value versus renting with flexibility.',
                'content' => 'The right choice depends on timeline, debt profile, and local market velocity. Use this framework to compare monthly burn, equity growth, and relocation risk in one view.',
            ],
            [
                'title' => 'Demo: Mortgage Pre-Approval Tips for First-Time Buyers',
                'slug' => 'demo-mortgage-preapproval-tips-first-time-buyers',
                'excerpt' => 'Simple actions that improve approval odds and speed up closing.',
                'content' => 'Lenders look for consistency, reserves, and clean credit behavior. We outline the documents and habits that help buyers lock stronger terms before touring homes.',
            ],
            [
                'title' => 'Demo: How Agents Should Stage Property Photos',
                'slug' => 'demo-agent-staging-guide-property-photos',
                'excerpt' => 'Photo-first staging guidance for better listing CTR and inquiry quality.',
                'content' => 'High-performing listings are visual products. This playbook covers lighting order, room sequencing, and mobile-first framing so each image supports buyer intent.',
            ],
            [
                'title' => 'Demo: Negotiation Patterns in Competitive Markets',
                'slug' => 'demo-negotiation-patterns-competitive-markets',
                'excerpt' => 'Three negotiation patterns that consistently close deals without inflating risk.',
                'content' => 'In competitive windows, speed and clarity beat aggressive terms. Review escalation formats, contingency limits, and communication checkpoints used by top-performing teams.',
            ],
            [
                'title' => 'Demo: Building a Profitable Rental Portfolio',
                'slug' => 'demo-profitable-rental-portfolio-blueprint',
                'excerpt' => 'A portfolio blueprint for selecting stable rental assets and improving cash flow.',
                'content' => 'Rental performance depends on acquisition discipline, tenant quality, and operating systems. This article covers market filters, cost controls, and lease-cycle planning.',
            ],
        ];
    }

    /**
     * @return array<int, string>
     */
    private function demoListingImagePaths(int $seedIndex): array
    {
        $first = (($seedIndex * 3) % 72) + 1;
        $second = (($seedIndex * 3 + 1) % 72) + 1;
        $third = (($seedIndex * 3 + 2) % 72) + 1;

        return [
            '/images/listing/img_'.str_pad((string) $first, 2, '0', STR_PAD_LEFT).'.jpg',
            '/images/listing/img_'.str_pad((string) $second, 2, '0', STR_PAD_LEFT).'.jpg',
            '/images/listing/img_'.str_pad((string) $third, 2, '0', STR_PAD_LEFT).'.jpg',
        ];
    }
};
