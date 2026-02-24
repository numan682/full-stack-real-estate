<?php

namespace App\Http\Controllers\Web;

use App\Http\Controllers\Controller;
use App\Support\CmsConfigService;
use Illuminate\View\View;

class AppController extends Controller
{
    public function __invoke(CmsConfigService $cmsConfigService): View
    {
        return view('app', [
            'appConfig' => $cmsConfigService->getFrontendConfig(),
        ]);
    }
}
