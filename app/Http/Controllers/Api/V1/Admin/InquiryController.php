<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\InquiryIndexRequest;
use App\Http\Requests\Api\V1\Admin\UpdateInquiryStatusRequest;
use App\Http\Resources\Api\V1\Admin\InquiryResource;
use App\Models\Inquiry;
use Illuminate\Http\JsonResponse;

class InquiryController extends Controller
{
    public function index(InquiryIndexRequest $request)
    {
        $filters = $request->validated();

        $query = Inquiry::query()
            ->with('property:id,title,slug');

        if (! empty($filters['search'])) {
            $search = trim((string) $filters['search']);
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('message', 'like', "%{$search}%");
            });
        }

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $perPage = (int) ($filters['per_page'] ?? 30);
        $inquiries = $query
            ->latest('id')
            ->paginate($perPage)
            ->withQueryString();

        return response()->json([
            'data' => InquiryResource::collection($inquiries->getCollection())->resolve(),
            'meta' => [
                'current_page' => $inquiries->currentPage(),
                'last_page' => $inquiries->lastPage(),
                'per_page' => $inquiries->perPage(),
                'total' => $inquiries->total(),
            ],
        ]);
    }

    public function updateStatus(UpdateInquiryStatusRequest $request, int $inquiryId): JsonResponse
    {
        $inquiry = Inquiry::query()->findOrFail($inquiryId);
        $inquiry->update([
            'status' => $request->validated('status'),
        ]);

        $inquiry->load('property:id,title,slug');

        return response()->json([
            'message' => 'Inquiry status updated.',
            'data' => new InquiryResource($inquiry),
        ]);
    }
}
