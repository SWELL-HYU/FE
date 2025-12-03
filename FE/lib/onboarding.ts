// lib/onboarding.ts
// Cold-start 설문 관련 API 함수들

import api from "./api";
import type {
  ApiSuccessResponse,
  Tag,
  Outfit,
  OnboardingRequest,
} from "@/types/api";

/**
 * ============================================
 * 2.1 사용 가능한 태그 목록 조회
 * GET /api/onboarding/tags
 * ============================================
 */
export const getTags = async () => {
  const response = await api.get<
    ApiSuccessResponse<{
      tags: Tag[];
    }>
  >("/onboarding/tags");
  return response.data;
};

/**
 * ============================================
 * 2.2 샘플 코디 목록 조회
 * GET /api/onboarding/sample-coordis
 * ============================================
 */
export const getSampleCoordis = async (params?: {
  gender?: "male" | "female";
  season?: "spring" | "summer" | "fall" | "winter";
}) => {
  const response = await api.get<
    ApiSuccessResponse<{
      coordis: Outfit[];
    }>
  >("/onboarding/sample-coordis", { params });
  return response.data;
};

/**
 * ============================================
 * 2.3 온보딩 정보 제출
 * POST /api/onboarding
 * ============================================
 */
export const submitOnboarding = async (data: OnboardingRequest) => {
  const response = await api.post<
    ApiSuccessResponse<{
      message: string;
      user: {
        hasCompletedOnboarding: boolean;
      };
    }>
  >("/onboarding", data);
  return response.data;
};