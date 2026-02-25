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
        Schema::table('properties', function (Blueprint $table): void {
            $table->index(['status', 'published_at', 'id'], 'properties_status_published_id_idx');
            $table->index(['agent_id', 'status', 'id'], 'properties_agent_status_id_idx');
        });

        Schema::table('inquiries', function (Blueprint $table): void {
            $table->index(['status', 'created_at'], 'inquiries_status_created_idx');
            $table->index(['property_id', 'status', 'created_at'], 'inquiries_property_status_created_idx');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->index(['status', 'published_at', 'id'], 'blog_posts_status_published_id_idx');
        });

        Schema::table('users', function (Blueprint $table): void {
            $table->index(['role', 'agent_id'], 'users_role_agent_idx');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table): void {
            $table->dropIndex('users_role_agent_idx');
        });

        Schema::table('blog_posts', function (Blueprint $table): void {
            $table->dropIndex('blog_posts_status_published_id_idx');
        });

        Schema::table('inquiries', function (Blueprint $table): void {
            $table->dropIndex('inquiries_property_status_created_idx');
            $table->dropIndex('inquiries_status_created_idx');
        });

        Schema::table('properties', function (Blueprint $table): void {
            $table->dropIndex('properties_agent_status_id_idx');
            $table->dropIndex('properties_status_published_id_idx');
        });
    }
};
