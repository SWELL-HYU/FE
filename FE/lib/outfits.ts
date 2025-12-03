// lib/outfits.ts
// 코디 추천 및 조회 관련 API 함수들

import api from "./api";
import type {
  ApiSuccessResponse,
  Outfit,
  Pagination,
  Season,
} from "@/types/api";

/**
 * ============================================
 * 3.1 개인화 추천 코디 목록
 * GET /api/outfits/recommendations
 * ============================================
 */
export const getRecommendations = async (params?: {
  page?: number;
  limit?: number;
  season?: Season;
}) => {
  const response = await api.get<
    ApiSuccessResponse<{
      outfits: Outfit[];
      pagination: Pagination;
    }>
  >("/outfits/recommendations", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
      season: params?.season,
    },
  });
  return response.data;
};

/**
 * ============================================
 * 3.2 특정 코디 상세 조회
 * GET /api/outfits/{outfitId}
 * ============================================
 */
export const getOutfitDetail = async (outfitId: number) => {
  const response = await api.get<
    ApiSuccessResponse<{
      outfit: Outfit;
    }>
  >(`/outfits/${outfitId}`);
  return response.data;
};

/**
 * ============================================
 * 3.3 코디에 좋아요 추가
 * POST /api/outfits/{outfitId}/favorite
 * ============================================
 */
export const addFavorite = async (outfitId: number) => {
  const response = await api.post<
    ApiSuccessResponse<{
      message: string;
      isFavorite: boolean;
    }>
  >(`/outfits/${outfitId}/favorite`);
  return response.data;
};

/**
 * ============================================
 * 3.4 코디 좋아요 취소
 * DELETE /api/outfits/{outfitId}/favorite
 * ============================================
 */
export const removeFavorite = async (outfitId: number) => {
  const response = await api.delete<
    ApiSuccessResponse<{
      message: string;
      isFavorite: boolean;
    }>
  >(`/outfits/${outfitId}/favorite`);
  return response.data;
};

/**
 * ============================================
 * 3.5 좋아요한 코디 목록
 * GET /api/outfits/favorites
 * ============================================
 */
export const getFavorites = async (params?: {
  page?: number;
  limit?: number;
}) => {
  const response = await api.get<
    ApiSuccessResponse<{
      outfits: Outfit[];
      pagination: Pagination;
    }>
  >("/outfits/favorites", {
    params: {
      page: params?.page || 1,
      limit: params?.limit || 20,
    },
  });
  return response.data;
};