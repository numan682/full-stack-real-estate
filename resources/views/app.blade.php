<!doctype html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <meta name="theme-color" content="#0D1A1C">
    <meta name="msapplication-navbutton-color" content="#0D1A1C">
    <meta name="apple-mobile-web-app-status-bar-style" content="#0D1A1C">
    <title>{{ config('app.name') }}</title>
    <link rel="icon" type="image/png" sizes="56x56" href="/images/fav-icon/icon.png">
    <link rel="stylesheet" href="/css/bootstrap.min.css" media="all">
    <link rel="stylesheet" href="/css/style.css" media="all">
    <link rel="stylesheet" href="/css/responsive.css" media="all">
    <script>
        window.__APP_CONFIG__ = @json($appConfig ?? []);
    </script>
    @viteReactRefresh
    @vite('resources/js/app.tsx')
</head>
<body>
    <div id="app"></div>
</body>
</html>
