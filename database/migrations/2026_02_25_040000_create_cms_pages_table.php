<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('cms_pages', function (Blueprint $table) {
            $table->id();
            $table->string('page_key')->unique();
            $table->string('template_key');
            $table->string('slug_path')->nullable()->unique();
            $table->string('title')->nullable();
            $table->string('nav_label')->nullable();
            $table->string('nav_group')->nullable();
            $table->unsignedSmallInteger('nav_order')->default(0);
            $table->boolean('show_in_nav')->default(false);
            $table->boolean('is_active')->default(true);
            $table->json('seo_payload')->nullable();
            $table->json('content_payload')->nullable();
            $table->timestamps();

            $table->index(['show_in_nav', 'nav_order']);
            $table->index(['is_active', 'slug_path']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cms_pages');
    }
};
