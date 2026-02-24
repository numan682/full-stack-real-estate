<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>@yield('title', 'Admin Panel') - {{ config('app.name') }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
        body { background: #f5f7fb; }
        .admin-sidebar { min-height: 100vh; background: #101828; color: #fff; }
        .admin-sidebar a { color: rgba(255,255,255,.86); text-decoration: none; }
        .admin-sidebar a.active,
        .admin-sidebar a:hover { color: #fff; }
        .admin-card { border: 0; border-radius: 14px; box-shadow: 0 10px 30px rgba(16, 24, 40, 0.08); }
        .form-section { border: 1px solid #e4e7ec; border-radius: 10px; padding: 1rem; background: #fff; }
        .mono { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    </style>
</head>
<body>
<div class="container-fluid">
    <div class="row">
        <aside class="col-lg-2 col-md-3 p-4 admin-sidebar">
            <h5 class="mb-4">{{ config('app.name') }}</h5>
            <nav class="d-flex flex-column gap-2">
                <a href="{{ route('admin.dashboard') }}" class="{{ request()->routeIs('admin.dashboard') ? 'active fw-semibold' : '' }}">Dashboard</a>
                <a href="{{ route('admin.cms.index') }}" class="{{ request()->routeIs('admin.cms.*') ? 'active fw-semibold' : '' }}">CMS Control</a>
            </nav>
            <form method="POST" action="{{ route('admin.logout') }}" class="mt-4">
                @csrf
                <button type="submit" class="btn btn-sm btn-outline-light w-100">Logout</button>
            </form>
        </aside>
        <main class="col-lg-10 col-md-9 p-4">
            @if (session('status'))
                <div class="alert alert-success">{{ session('status') }}</div>
            @endif
            @if ($errors->any())
                <div class="alert alert-danger">
                    <strong>Validation failed:</strong>
                    <ul class="mb-0 mt-2">
                        @foreach ($errors->all() as $error)
                            <li>{{ $error }}</li>
                        @endforeach
                    </ul>
                </div>
            @endif

            @yield('content')
        </main>
    </div>
</div>
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>
</body>
</html>
