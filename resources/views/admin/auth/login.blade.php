<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Admin Login - {{ config('app.name') }}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">
    <style>
        body { background: linear-gradient(135deg, #101828, #1d2939); min-height: 100vh; }
        .card { border: 0; border-radius: 18px; box-shadow: 0 30px 60px rgba(0,0,0,0.25); }
    </style>
</head>
<body class="d-flex align-items-center justify-content-center">
<div class="card p-4" style="width:100%;max-width:430px;">
    <h4 class="mb-1">Admin Panel</h4>
    <p class="text-muted mb-4">Sign in to manage templates and components.</p>

    @if ($errors->any())
        <div class="alert alert-danger py-2">{{ $errors->first() }}</div>
    @endif

    <form method="POST" action="{{ route('admin.login.submit') }}">
        @csrf
        <div class="mb-3">
            <label class="form-label">Email</label>
            <input name="email" type="email" value="{{ old('email') }}" class="form-control" required autofocus>
        </div>
        <div class="mb-3">
            <label class="form-label">Password</label>
            <input name="password" type="password" class="form-control" required>
        </div>
        <div class="form-check mb-3">
            <input class="form-check-input" type="checkbox" name="remember" value="1" id="remember">
            <label class="form-check-label" for="remember">Remember me</label>
        </div>
        <button type="submit" class="btn btn-dark w-100">Sign in</button>
    </form>

    <div class="small text-muted mt-3">
        Default seeded admin:
        <span class="d-block">admin@homerealestate.test / admin12345</span>
    </div>
</div>
</body>
</html>
