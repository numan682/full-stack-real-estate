<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreInquiryRequest;
use App\Models\Inquiry;
use Illuminate\Http\Response;

class InquiryController extends Controller
{
    public function store(StoreInquiryRequest $request)
    {
        $payload = $request->validated();

        $inquiry = Inquiry::query()->create([
            ...$payload,
            'source' => $payload['source'] ?? 'website',
            'status' => 'new',
            'metadata' => [
                'referer' => $request->headers->get('referer'),
                'origin' => $request->headers->get('origin'),
            ],
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);

        return response()->json([
            'message' => 'Inquiry submitted successfully.',
            'data' => [
                'id' => $inquiry->id,
            ],
        ], Response::HTTP_CREATED);
    }
}
