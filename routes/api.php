<?php

use App\Http\Controllers\Api\V1\Agent\InquiryController as AgentInquiryController;
use App\Http\Controllers\Api\V1\Agent\PropertyController as AgentPropertyController;
use App\Http\Controllers\Api\V1\Admin\AuthController as AdminAuthController;
use App\Http\Controllers\Api\V1\Admin\AgentController as AdminAgentController;
use App\Http\Controllers\Api\V1\Admin\BlogPostController as AdminBlogPostController;
use App\Http\Controllers\Api\V1\Admin\CmsController as AdminCmsController;
use App\Http\Controllers\Api\V1\Admin\DashboardController as AdminDashboardController;
use App\Http\Controllers\Api\V1\Admin\InquiryController as AdminInquiryController;
use App\Http\Controllers\Api\V1\Admin\PropertyController as AdminPropertyController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\AgentController;
use App\Http\Controllers\Api\V1\BlogPostController;
use App\Http\Controllers\Api\V1\CmsConfigController;
use App\Http\Controllers\Api\V1\InquiryController;
use App\Http\Controllers\Api\V1\PropertyController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')
    ->middleware('throttle:api')
    ->group(function (): void {
        Route::get('/properties', [PropertyController::class, 'index']);
        Route::get('/properties/{property}', [PropertyController::class, 'show']);
        Route::get('/blogs', [BlogPostController::class, 'index']);
        Route::get('/blogs/{blogPost}', [BlogPostController::class, 'show']);
        Route::get('/agents', [AgentController::class, 'index']);
        Route::get('/agents/{agent}', [AgentController::class, 'show']);
        Route::post('/inquiries', [InquiryController::class, 'store'])->middleware('throttle:20,1');
        Route::get('/cms/config', [CmsConfigController::class, 'show']);

        Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

        Route::middleware('api_token')->group(function (): void {
            Route::get('/auth/me', [AuthController::class, 'me']);
            Route::post('/auth/logout', [AuthController::class, 'logout']);

            Route::prefix('agent')->middleware('role:agent')->group(function (): void {
                Route::get('/properties', [AgentPropertyController::class, 'index']);
                Route::post('/properties', [AgentPropertyController::class, 'store']);
                Route::get('/properties/{propertyId}', [AgentPropertyController::class, 'show'])->whereNumber('propertyId');
                Route::put('/properties/{propertyId}', [AgentPropertyController::class, 'update'])->whereNumber('propertyId');

                Route::get('/inquiries', [AgentInquiryController::class, 'index']);
                Route::patch('/inquiries/{inquiryId}/status', [AgentInquiryController::class, 'updateStatus'])->whereNumber('inquiryId');
            });
        });

        Route::prefix('admin')->group(function (): void {
            Route::post('/auth/login', [AdminAuthController::class, 'login'])->middleware('throttle:10,1');

            Route::middleware('admin_api_token')->group(function (): void {
                Route::get('/auth/me', [AdminAuthController::class, 'me']);
                Route::post('/auth/logout', [AdminAuthController::class, 'logout']);

                Route::get('/dashboard', AdminDashboardController::class);
                Route::get('/agents', [AdminAgentController::class, 'index']);
                Route::post('/agents', [AdminAgentController::class, 'store']);
                Route::get('/agents/{agentId}', [AdminAgentController::class, 'show'])->whereNumber('agentId');
                Route::put('/agents/{agentId}', [AdminAgentController::class, 'update'])->whereNumber('agentId');
                Route::delete('/agents/{agentId}', [AdminAgentController::class, 'destroy'])->whereNumber('agentId');

                Route::get('/cms', [AdminCmsController::class, 'index']);
                Route::put('/cms/home-template', [AdminCmsController::class, 'updateHomeTemplate']);
                Route::put('/cms/home-sections', [AdminCmsController::class, 'updateHomeSections']);
                Route::put('/cms/pages', [AdminCmsController::class, 'updatePages']);
                Route::put('/cms/page-sections', [AdminCmsController::class, 'updatePageSections']);
                Route::put('/cms/global-settings', [AdminCmsController::class, 'updateGlobalSettings']);

                Route::get('/properties', [AdminPropertyController::class, 'index']);
                Route::post('/properties', [AdminPropertyController::class, 'store']);
                Route::get('/properties/{propertyId}', [AdminPropertyController::class, 'show'])->whereNumber('propertyId');
                Route::put('/properties/{propertyId}', [AdminPropertyController::class, 'update'])->whereNumber('propertyId');
                Route::delete('/properties/{propertyId}', [AdminPropertyController::class, 'destroy'])->whereNumber('propertyId');

                Route::get('/blogs', [AdminBlogPostController::class, 'index']);
                Route::post('/blogs', [AdminBlogPostController::class, 'store']);
                Route::get('/blogs/{blogId}', [AdminBlogPostController::class, 'show'])->whereNumber('blogId');
                Route::put('/blogs/{blogId}', [AdminBlogPostController::class, 'update'])->whereNumber('blogId');
                Route::delete('/blogs/{blogId}', [AdminBlogPostController::class, 'destroy'])->whereNumber('blogId');

                Route::get('/inquiries', [AdminInquiryController::class, 'index']);
                Route::patch('/inquiries/{inquiryId}/status', [AdminInquiryController::class, 'updateStatus'])->whereNumber('inquiryId');
            });
        });
    });
