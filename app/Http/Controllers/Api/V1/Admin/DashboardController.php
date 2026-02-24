<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Agent;
use App\Models\BlogPost;
use App\Models\Inquiry;
use App\Models\Property;
use App\Support\CmsConfigService;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    public function __invoke(CmsConfigService $cmsConfigService): JsonResponse
    {
        return response()->json([
            'data' => [
                'stats' => [
                    'properties' => Property::query()->count(),
                    'blogs' => BlogPost::query()->count(),
                    'agencies' => Agency::query()->count(),
                    'agents' => Agent::query()->count(),
                    'inquiries' => Inquiry::query()->count(),
                ],
                'recent_inquiries' => Inquiry::query()
                    ->with('property:id,title,slug')
                    ->latest('id')
                    ->limit(10)
                    ->get(['id', 'property_id', 'full_name', 'email', 'source', 'status', 'created_at']),
                'active_home_template' => $cmsConfigService->getHomeTemplateKey(),
            ],
        ]);
    }
}
