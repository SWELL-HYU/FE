// lib/fitting.ts
// 가상 피팅 관련 API 함수들

import api from "./api";
import type {
  ApiSuccessResponse,
  FittingJob,
  FittingHistoryItem,
  Pagination,
  StartFittingRequest,
} from "@/types/api";

/**
 * ============================================
 * 6.1 가상 피팅 시작
 * POST /api/virtual-fitting
 * ============================================
 * 참고: API 명세서 업데이트로 user_profile_url은 내부 처리됨
 */
export const startFitting = async (data: StartFittingRequest) => {
  const response = await api.post<
    ApiSuccessResponse<{
      jobId: number;
      message: string;
    }>
  >("/virtual-fitting", data);
  return response.data;
};

/**
 * ============================================
 * 6.2 가상 피팅 상태 조회
 * GET /api/virtual-fitting/{jobId}/status
 * ============================================
 * 폴링(Polling)으로 사용: 2초마다 호출하여 상태 확인
 */
export const getFittingStatus = async (jobId: number) => {
  const response = await api.get<
    ApiSuccessResponse<{
      job: FittingJob;
    }>
  >(`/virtual-fitting/${jobId}/status`);
  return response.data;
};

/**
 * ============================================
 * 6.3 가상 피팅 이력 조회
 * GET /api/virtual-fitting
 * ============================================
 */
export const getFittingHistory = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<
    ApiSuccessResponse<{
      fittings: FittingHistoryItem[];
      pagination: Pagination;
    }>
  >("/virtual-fitting", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  });
  return response.data;
};

/**
 * ============================================
 * 6.4 가상 피팅 이력 삭제
 * DELETE /api/virtual-fitting/{jobId}
 * ============================================
 */
export const deleteFittingHistory = async (jobId: number) => {
  const response = await api.delete<
    ApiSuccessResponse<{
      message: string;
      deletedAt: string;
    }>
  >(`/virtual-fitting/${jobId}`);
  return response.data;
};

/**
 * ============================================
 * 유틸리티: 피팅 완료까지 대기 (폴링)
 * ============================================
 * 사용 예시:
 * const result = await waitForFitting(jobId, {
 *   onProgress: (job) => console.log('현재 단계:', job.currentStep)
 * });
 */
export const waitForFitting = async (
  jobId: number,
  options?: {
    interval?: number; // 폴링 간격 (기본: 2000ms)
    timeout?: number; // 최대 대기 시간 (기본: 60000ms)
    onProgress?: (job: FittingJob) => void; // 진행 상황 콜백
  }
): Promise<FittingJob> => {
  const interval = options?.interval || 2000;
  const timeout = options?.timeout || 60000;
  const startTime = Date.now();

  return new Promise((resolve, reject) => {
    const poll = async () => {
      try {
        const response = await getFittingStatus(jobId);
        const job = response.data.job;

        // 진행 상황 콜백 호출
        if (options?.onProgress) {
          options.onProgress(job);
        }

        // 완료 상태 확인
        if (job.status === "completed") {
          resolve(job);
          return;
        }

        // 실패 상태 확인
        if (job.status === "failed" || job.status === "timeout") {
          reject(new Error(`피팅 실패: ${job.status}`));
          return;
        }

        // 타임아웃 체크
        if (Date.now() - startTime > timeout) {
          reject(new Error("피팅 대기 시간 초과"));
          return;
        }

        // 다음 폴링 예약
        setTimeout(poll, interval);
      } catch (error) {
        reject(error);
      }
    };

    poll();
  });
};