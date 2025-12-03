// lib/profile.ts
// 사용자 프로필 관련 API 함수들

import api from "./api";
import type {
  ApiSuccessResponse,
  User,
  UpdateProfileRequest,
} from "@/types/api";

/**
 * ============================================
 * 4.1 프로필 조회
 * GET /api/profile
 * ============================================
 */
export const getProfile = async () => {
  const response = await api.get<
    ApiSuccessResponse<{
      user: User;
    }>
  >("/profile");
  return response.data;
};

/**
 * ============================================
 * 4.2 프로필 수정
 * PUT /api/profile
 * ============================================
 */
export const updateProfile = async (data: UpdateProfileRequest) => {
  const response = await api.put<
    ApiSuccessResponse<{
      message: string;
      user: User;
    }>
  >("/profile", data);
  return response.data;
};

/**
 * ============================================
 * 4.3 프로필 사진 업로드
 * POST /api/profile/photo
 * ============================================
 */
export const uploadProfilePhoto = async (photo: File) => {
  const formData = new FormData();
  formData.append("photo", photo);

  const response = await api.post<
    ApiSuccessResponse<{
      message: string;
      profileImageUrl: string;
    }>
  >("/profile/photo", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * ============================================
 * 4.4 프로필 사진 삭제
 * DELETE /api/profile/photo
 * ============================================
 */
export const deleteProfilePhoto = async () => {
  const response = await api.delete<
    ApiSuccessResponse<{
      message: string;
    }>
  >("/profile/photo");
  return response.data;
};

/**
 * ============================================
 * 4.5 선호 태그 수정
 * PUT /api/profile/tags
 * ============================================
 */
export const updatePreferredTags = async (tagIds: number[]) => {
  const response = await api.put<
    ApiSuccessResponse<{
      message: string;
      preferredTags: number[];
    }>
  >("/profile/tags", { tagIds });
  return response.data;
};

/**
 * ============================================
 * 4.6 선호 코디 수정
 * PUT /api/profile/coordis
 * ============================================
 */
export const updatePreferredCoordis = async (coordiIds: number[]) => {
  const response = await api.put<
    ApiSuccessResponse<{
      message: string;
      preferredCoordis: number[];
    }>
  >("/profile/coordis", { coordiIds });
  return response.data;
};