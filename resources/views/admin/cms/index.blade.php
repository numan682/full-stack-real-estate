@extends('admin.layout')

@section('title', 'CMS Control')

@section('content')
    <div class="mb-4">
        <h3 class="mb-1">CMS Control Panel</h3>
        <p class="text-muted mb-0">Make components dynamic, switch home templates, and update global content.</p>
    </div>

    <div class="row g-4">
        <div class="col-12">
            <div class="card admin-card">
                <div class="card-body">
                    <h5 class="card-title">Home Template Selector</h5>
                    <form method="POST" action="{{ route('admin.cms.home-template') }}">
                        @csrf
                        <div class="row g-3">
                            @foreach($homeTemplates as $templateKey => $templateMeta)
                                <div class="col-lg-4 col-md-6">
                                    <label class="form-section d-block">
                                        <div class="form-check">
                                            <input class="form-check-input" type="radio" name="home_template" value="{{ $templateKey }}" {{ $activeHomeTemplate === $templateKey ? 'checked' : '' }}>
                                            <span class="form-check-label fw-semibold">{{ $templateMeta['label'] ?? $templateKey }}</span>
                                        </div>
                                        <div class="small text-muted mt-2">{{ $templateMeta['description'] ?? '' }}</div>
                                        <div class="small mono mt-1">{{ $templateKey }}</div>
                                    </label>
                                </div>
                            @endforeach
                        </div>
                        <button class="btn btn-dark mt-3" type="submit">Save Active Home Template</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-12">
            <div class="card admin-card">
                <div class="card-body">
                    <h5 class="card-title">Home 01 Dynamic Component Builder</h5>
                    <p class="text-muted small">Control each section visibility/order and optional JSON payload.</p>
                    <form method="POST" action="{{ route('admin.cms.home-sections') }}">
                        @csrf
                        <div class="table-responsive">
                            <table class="table align-middle">
                                <thead>
                                <tr>
                                    <th>Enable</th>
                                    <th>Section Key</th>
                                    <th>Name</th>
                                    <th style="width:120px;">Order</th>
                                    <th>Payload (JSON)</th>
                                </tr>
                                </thead>
                                <tbody>
                                @foreach($homeSections as $index => $section)
                                    <tr>
                                        <td>
                                            <input type="hidden" name="sections[{{ $index }}][is_enabled]" value="0">
                                            <input class="form-check-input" type="checkbox" name="sections[{{ $index }}][is_enabled]" value="1" {{ $section->is_enabled ? 'checked' : '' }}>
                                        </td>
                                        <td>
                                            <input type="hidden" name="sections[{{ $index }}][section_key]" value="{{ $section->section_key }}">
                                            <span class="badge text-bg-light mono">{{ $section->section_key }}</span>
                                        </td>
                                        <td>
                                            <input type="text" class="form-control form-control-sm" name="sections[{{ $index }}][name]" value="{{ $section->name }}">
                                        </td>
                                        <td>
                                            <input type="number" class="form-control form-control-sm" name="sections[{{ $index }}][sort_order]" min="0" value="{{ $section->sort_order }}">
                                        </td>
                                        <td>
                                            <textarea class="form-control form-control-sm mono" name="sections[{{ $index }}][payload]" rows="3">{{ json_encode($section->payload ?? [], JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES) }}</textarea>
                                        </td>
                                    </tr>
                                @endforeach
                                </tbody>
                            </table>
                        </div>
                        <button class="btn btn-dark" type="submit">Save Home Sections</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="col-12">
            <div class="card admin-card">
                <div class="card-body">
                    <h5 class="card-title">Global Header/Footer Settings</h5>
                    <form method="POST" action="{{ route('admin.cms.global-settings') }}">
                        @csrf
                        <div class="row g-3">
                            <div class="col-12">
                                <h6 class="text-muted">Header</h6>
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Announcement Text</label>
                                <input type="text" class="form-control" name="header[announcement_text]" value="{{ data_get($globalSettings, 'header.announcement_text') }}">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Announcement Link</label>
                                <input type="text" class="form-control" name="header[announcement_link]" value="{{ data_get($globalSettings, 'header.announcement_link') }}">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Login Label</label>
                                <input type="text" class="form-control" name="header[login_label]" value="{{ data_get($globalSettings, 'header.login_label') }}">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Add Listing Label</label>
                                <input type="text" class="form-control" name="header[add_listing_label]" value="{{ data_get($globalSettings, 'header.add_listing_label') }}">
                            </div>

                            <div class="col-12 mt-2">
                                <h6 class="text-muted">Footer</h6>
                            </div>
                            <div class="col-md-8">
                                <label class="form-label">Address</label>
                                <input type="text" class="form-control" name="footer[address]" value="{{ data_get($globalSettings, 'footer.address') }}">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" name="footer[email]" value="{{ data_get($globalSettings, 'footer.email') }}">
                            </div>
                        </div>
                        <button class="btn btn-dark mt-3" type="submit">Save Global Settings</button>
                    </form>
                </div>
            </div>
        </div>
    </div>
@endsection
