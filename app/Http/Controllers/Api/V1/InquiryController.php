<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInquiryRequest;
use App\Models\Inquiry;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Throwable;

class InquiryController extends Controller
{
    public function store(StoreInquiryRequest $request)
    {
        $payload = $request->validated();
        $duplicateSubmissionCacheKey = $this->duplicateSubmissionCacheKey($payload, $request->ip());

        if (Cache::has($duplicateSubmissionCacheKey)) {
            return response()->json([
                'message' => 'A similar inquiry was submitted just now. Please wait a moment and try again.',
            ], Response::HTTP_TOO_MANY_REQUESTS);
        }

        Cache::put($duplicateSubmissionCacheKey, true, now()->addSeconds(20));

        try {
            $inquiry = Inquiry::query()->create([
                ...$payload,
                'source' => $payload['source'] ?? 'website',
                'status' => 'new',
                'metadata' => [
                    'referer' => $this->truncateHeader($request->headers->get('referer')),
                    'origin' => $this->truncateHeader($request->headers->get('origin')),
                ],
                'ip_address' => $request->ip(),
                'user_agent' => Str::limit((string) $request->userAgent(), 500, ''),
            ]);
        } catch (Throwable $throwable) {
            Cache::forget($duplicateSubmissionCacheKey);
            throw $throwable;
        }

        return response()->json([
            'message' => 'Inquiry submitted successfully.',
            'data' => [
                'id' => $inquiry->id,
            ],
        ], Response::HTTP_CREATED);
    }

    /**
     * @param  array<string, mixed>  $payload
     */
    private function duplicateSubmissionCacheKey(array $payload, ?string $ipAddress): string
    {
        $parts = [
            strtolower(trim((string) ($payload['email'] ?? ''))),
            strtolower(trim((string) ($payload['full_name'] ?? ''))),
            strtolower(trim((string) ($payload['message'] ?? ''))),
            (string) ($payload['property_id'] ?? ''),
            strtolower(trim((string) ($payload['source'] ?? 'website'))),
            trim((string) $ipAddress),
        ];

        return 'inquiries:dedupe:'.hash('sha256', implode('|', $parts));
    }

    private function truncateHeader(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        return Str::limit(trim($value), 2048, '');
    }
}
