<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Support\CmsConfigService;
use Illuminate\Http\JsonResponse;

class CmsConfigController extends Controller
{
    public function show(CmsConfigService $cmsConfigService): JsonResponse
    {
        return response()->json($cmsConfigService->getFrontendConfig());
    }
}
