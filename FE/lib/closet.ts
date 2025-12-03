// lib/closet.ts
// 옷장 관리 관련 API 함수들

import api from "./api";
import type {
  ApiSuccessResponse,
  ClosetItem,
  Pagination,
  Season,
} from "@/types/api";

/**
 * ============================================
 * 5.1 내 옷 목록 조회
 * GET /api/closet
 * ============================================
 */
export const getClosetItems = async (params?: {
  page?: number;
  limit?: number;
  category?: string;
}) => {
  const response = await api.get<
    ApiSuccessResponse<{
      items: ClosetItem[];
      pagination: Pagination;
    }>
  >("/closet", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      category: params?.category,
    },
  });
  return response.data;
};

/**
 * ============================================
 * 5.2 옷 추가
 * POST /api/closet
 * ============================================
 */
export const addClosetItem = async (data: { image: File; season: Season }) => {
  const formData = new FormData();
  formData.append("image", data.image);
  formData.append("season", data.season);

  const response = await api.post<
    ApiSuccessResponse<{
      message: string;
      item: ClosetItem;
    }>
  >("/closet", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

/**
 * ============================================
 * 5.3 특정 옷 조회
 * GET /api/closet/{itemId}
 * ============================================
 */
export const getClosetItem = async (itemId: number) => {
  const response = await api.get<
    ApiSuccessResponse<{
      item: ClosetItem;
    }>
  >(`/closet/${itemId}`);
  return response.data;
};

/**
 * ============================================
 * 5.4 옷 삭제
 * DELETE /api/closet/{itemId}
 * ============================================
 */
export const deleteClosetItem = async (itemId: number) => {
  const response = await api.delete<
    ApiSuccessResponse<{
      message: string;
      deletedAt: string;
    }>
  >(`/closet/${itemId}`);
  return response.data;
};