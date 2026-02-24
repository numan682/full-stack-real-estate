@extends('admin.layout')

@section('title', 'Dashboard')

@section('content')
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <h3 class="mb-1">Admin Dashboard</h3>
            <p class="text-muted mb-0">Manage dynamic content, templates, and platform data.</p>
        </div>
        <a href="{{ route('admin.cms.index') }}" class="btn btn-dark">Open CMS Control</a>
    </div>

    <div class="row g-3 mb-4">
        <div class="col-md-3">
            <div class="card admin-card p-3">
                <div class="text-muted small">Properties</div>
                <div class="fs-3 fw-semibold">{{ number_format($stats['properties']) }}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card admin-card p-3">
                <div class="text-muted small">Agencies</div>
                <div class="fs-3 fw-semibold">{{ number_format($stats['agencies']) }}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card admin-card p-3">
                <div class="text-muted small">Agents</div>
                <div class="fs-3 fw-semibold">{{ number_format($stats['agents']) }}</div>
            </div>
        </div>
        <div class="col-md-3">
            <div class="card admin-card p-3">
                <div class="text-muted small">Inquiries</div>
                <div class="fs-3 fw-semibold">{{ number_format($stats['inquiries']) }}</div>
            </div>
        </div>
    </div>

    <div class="card admin-card mb-4">
        <div class="card-body">
            <h5 class="card-title mb-1">Active Home Template</h5>
            <p class="mb-0">
                <span class="badge text-bg-dark mono">{{ $activeHomeTemplate }}</span>
            </p>
        </div>
    </div>

    <div class="card admin-card">
        <div class="card-body">
            <h5 class="card-title mb-3">Recent Inquiries</h5>
            <div class="table-responsive">
                <table class="table align-middle">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Source</th>
                        <th>Date</th>
                    </tr>
                    </thead>
                    <tbody>
                    @forelse($recentInquiries as $inquiry)
                        <tr>
                            <td>#{{ $inquiry->id }}</td>
                            <td>{{ $inquiry->full_name }}</td>
                            <td>{{ $inquiry->email }}</td>
                            <td>{{ $inquiry->source }}</td>
                            <td>{{ $inquiry->created_at?->format('Y-m-d H:i') }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="5" class="text-muted">No inquiries yet.</td>
                        </tr>
                    @endforelse
                    </tbody>
                </table>
            </div>
        </div>
    </div>
@endsection
