<?php

namespace App\Http\Controllers\Api\V1\Agent;

use App\Domain\Inquiries\InquiryManagementService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\Admin\InquiryIndexRequest;
use App\Http\Requests\Api\V1\Admin\UpdateInquiryStatusRequest;
use App\Http\Resources\Api\V1\Admin\InquiryResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class InquiryController extends Controller
{
    public function __construct(
        private readonly InquiryManagementService $inquiryManagementService
    ) {}

    public function index(InquiryIndexRequest $request): JsonResponse
    {
        $filters = $request->validated();
        $agentId = $this->resolveAgentId();
        $inquiries = $this->inquiryManagementService->search($filters, $agentId);

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
        $agentId = $this->resolveAgentId();
        $inquiry = $this->inquiryManagementService->findForStatusUpdate($inquiryId, $agentId);
        $inquiry = $this->inquiryManagementService->updateStatus(
            $inquiry,
            (string) $request->validated('status'),
        );

        return response()->json([
            'message' => 'Inquiry status updated.',
            'data' => new InquiryResource($inquiry),
        ]);
    }

    private function resolveAgentId(): int
    {
        /** @var User|null $user */
        $user = request()->user();

        if (! $user || ! $user->agent_id) {
            abort(403, 'Agent profile is required.');
        }

        return (int) $user->agent_id;
    }
}
