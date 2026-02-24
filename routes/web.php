<?php

use App\Http\Controllers\Admin\AuthController;
use App\Http\Controllers\Admin\CmsController;
use App\Http\Controllers\Admin\DashboardController;
use Illuminate\Support\Facades\Route;

Route::prefix('admin')->group(function (): void {
    Route::middleware('guest')->group(function (): void {
        Route::get('/login', [AuthController::class, 'showLogin'])->name('admin.login');
        Route::post('/login', [AuthController::class, 'login'])->name('admin.login.submit');
    });

    Route::middleware(['auth', 'admin'])->group(function (): void {
        Route::get('/', DashboardController::class)->name('admin.dashboard');
        Route::post('/logout', [AuthController::class, 'logout'])->name('admin.logout');

        Route::get('/cms', [CmsController::class, 'index'])->name('admin.cms.index');
        Route::post('/cms/home-template', [CmsController::class, 'updateHomeTemplate'])->name('admin.cms.home-template');
        Route::post('/cms/home-sections', [CmsController::class, 'updateHomeSections'])->name('admin.cms.home-sections');
        Route::post('/cms/global-settings', [CmsController::class, 'updateGlobalSettings'])->name('admin.cms.global-settings');
    });
});

Route::redirect('/', config('app.frontend_url'));
