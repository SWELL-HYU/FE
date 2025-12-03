"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getMe } from "@/lib/auth";
import { User } from "@/types";

// 테스트 모드 (백엔드 없이 개발할 때 true)
const TEST_MODE = true;

// 테스트용 임시 유저
const TEST_USER: User = {
  id: 1,
  email: "test@example.com",
  name: "테스트",
  gender: "male",
  profileImageUrl: null,
  preferredTags: null,
  preferredCoordis: null,
  hasCompletedOnboarding: true,
  createdAt: "2025-01-01T00:00:00Z",
};

export function useAuth(requireAuth: boolean = true) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      // 테스트 모드
      if (TEST_MODE) {
        setUser(TEST_USER);
        setLoading(false);
        return;
      }

      const token = sessionStorage.getItem("token");

      // 토큰 없으면
      if (!token) {
        setLoading(false);
        if (requireAuth) {
          router.push("/start");
        }
        return;
      }

      // 토큰 있으면 유저 정보 조회
      try {
        const response = await getMe();
        if (response.success && response.data) {
          setUser(response.data.user);
        } else {
          sessionStorage.removeItem("token");
          if (requireAuth) {
            router.push("/start");
          }
        }
      } catch (error) {
        sessionStorage.removeItem("token");
        if (requireAuth) {
          router.push("/start");
        }
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [requireAuth, router]);

  return { user, loading, setUser };
}