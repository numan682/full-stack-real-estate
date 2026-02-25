<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Domain\Inquiries\InquiryManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\InquiryIndexRequest;
use App\Http\Requests\Api\V1\Admin\UpdateInquiryStatusRequest;
use App\Http\Resources\Api\V1\Admin\InquiryResource;
use Illuminate\Http\JsonResponse;

class InquiryController extends Controller
{
    public function __construct(
        private readonly InquiryManagementService $inquiryManagementService
    ) {}

    public function index(InquiryIndexRequest $request)
    {
        $filters = $request->validated();
        $inquiries = $this->inquiryManagementService->search($filters);

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
        $inquiry = $this->inquiryManagementService->findForStatusUpdate($inquiryId);
        $inquiry = $this->inquiryManagementService->updateStatus(
            $inquiry,
            (string) $request->validated('status'),
        );

        return response()->json([
            'message' => 'Inquiry status updated.',
            'data' => new InquiryResource($inquiry),
        ]);
    }
}
