<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Agency;
use App\Models\Agent;
use App\Models\Inquiry;
use App\Models\Property;
use App\Support\CmsConfigService;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function __invoke(CmsConfigService $cmsConfigService): View
    {
        return view('admin.dashboard', [
            'stats' => [
                'properties' => Property::query()->count(),
                'agencies' => Agency::query()->count(),
                'agents' => Agent::query()->count(),
                'inquiries' => Inquiry::query()->count(),
            ],
            'recentInquiries' => Inquiry::query()
                ->latest('id')
                ->limit(8)
                ->get(['id', 'full_name', 'email', 'source', 'created_at']),
            'activeHomeTemplate' => $cmsConfigService->getHomeTemplateKey(),
        ]);
    }
}
