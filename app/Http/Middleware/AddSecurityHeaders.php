<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AddSecurityHeaders
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        $response->headers->set('X-Content-Type-Options', 'nosniff');
        $response->headers->set('X-Frame-Options', 'SAMEORIGIN');
        $response->headers->set('Referrer-Policy', 'strict-origin-when-cross-origin');
        $response->headers->set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
        $response->headers->set('Cross-Origin-Opener-Policy', 'same-origin');
        $response->headers->set('Cross-Origin-Resource-Policy', 'same-site');
        $response->headers->set('X-DNS-Prefetch-Control', 'off');
        $response->headers->set('X-Permitted-Cross-Domain-Policies', 'none');
        $response->headers->set('Origin-Agent-Cluster', '?1');
        $response->headers->set('Vary', $this->mergeVaryHeader($response, ['Accept-Encoding', 'Origin']));

        if ($request->isSecure()) {
            $response->headers->set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
        }

        if ($this->isPrivateApiRequest($request)) {
            $response->headers->set('Cache-Control', 'private, no-store, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
        } elseif ($this->isPublicCacheableApiRequest($request)) {
            $response->headers->set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
        }

        if ($this->isHtmlResponse($response)) {
            $response->headers->set('Content-Security-Policy', $this->contentSecurityPolicy());
        }

        return $response;
    }

    private function isPrivateApiRequest(Request $request): bool
    {
        return $request->is('api/v1/auth/*')
            || $request->is('api/v1/agent/*')
            || $request->is('api/v1/admin/*');
    }

    private function isPublicCacheableApiRequest(Request $request): bool
    {
        if (! $request->isMethod('GET')) {
            return false;
        }

        return $request->is('api/v1/properties')
            || $request->is('api/v1/properties/*')
            || $request->is('api/v1/blogs')
            || $request->is('api/v1/blogs/*')
            || $request->is('api/v1/cms/config');
    }

    private function isHtmlResponse(Response $response): bool
    {
        $contentType = strtolower((string) $response->headers->get('Content-Type', ''));

        return str_contains($contentType, 'text/html');
    }

    private function contentSecurityPolicy(): string
    {
        return implode('; ', [
            "default-src 'self'",
            "base-uri 'self'",
            "frame-ancestors 'self'",
            "form-action 'self'",
            "object-src 'none'",
            "img-src 'self' data: blob: https:",
            "font-src 'self' data:",
            "style-src 'self' 'unsafe-inline'",
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://maps.google.com https://maps.googleapis.com",
            "connect-src 'self' https: http:",
        ]);
    }

    /**
     * @param  array<int, string>  $requiredParts
     */
    private function mergeVaryHeader(Response $response, array $requiredParts): string
    {
        $existing = array_filter(array_map(
            'trim',
            explode(',', (string) $response->headers->get('Vary', '')),
        ));

        $merged = collect($existing)
            ->merge($requiredParts)
            ->filter(fn (string $value): bool => $value !== '')
            ->unique()
            ->values()
            ->all();

        return implode(', ', $merged);
    }
}
