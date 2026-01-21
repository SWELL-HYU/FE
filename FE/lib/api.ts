import axios from "axios";

// API Base URL from environment variable
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://54.180.130.159:8000";

// 🔍 환경변수 확인용 (확인 후 삭제)
console.log("🌐 API_BASE_URL:", API_BASE_URL);

// API 기본 설정
const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청할 때마다 토큰 자동 첨부
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = sessionStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// 토큰 만료 시 로그인 페이지로 이동
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("token");
        window.location.href = "/start";
      }
    }
    return Promise.reject(error);
  }
);

export default api;