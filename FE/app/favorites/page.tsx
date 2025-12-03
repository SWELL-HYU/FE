"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function FavoritesPage() {
  const router = useRouter();
  const { user, loading } = useAuth(true);
  
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 임시 좋아요 데이터 (나중에 API에서 받아옴)
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      style: "캐주얼",
      season: "봄",
      description: "편안한 봄 캐주얼 룩",
      likedAt: "2025-01-15",
    },
    {
      id: 2,
      style: "미니멀",
      season: "여름",
      description: "시원한 여름 미니멀 룩",
      likedAt: "2025-01-14",
    },
    {
      id: 3,
      style: "스트릿",
      season: "가을",
      description: "트렌디한 가을 스트릿 룩",
      likedAt: "2025-01-13",
    },
  ]);

  // 좋아요 취소
  const handleUnlike = (outfitId: number) => {
    setFavorites(favorites.filter((f) => f.id !== outfitId));
  };

  // 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    router.push("/start");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-100 flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/main")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 메인
          </button>
          <h1 className="text-xl font-bold text-gray-800">좋아요 목록</h1>
        </div>
        
        {/* 프로필 드롭다운 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <span>{user?.name}님</span>
            <span className={`transition-transform ${showDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
              <button
                onClick={() => {
                  router.push("/closet");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                🚪 로그아웃
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 overflow-auto p-6">
        {favorites.length > 0 ? (
          <div className="grid grid-cols-3 gap-6 max-w-5xl mx-auto">
            {favorites.map((outfit) => (
              <div
                key={outfit.id}
                className="bg-white rounded-2xl shadow-lg overflow-hidden group"
              >
                {/* 코디 이미지 */}
                <div className="aspect-[3/4] bg-gray-200 flex items-center justify-center relative">
                  <div className="text-center text-gray-400">
                    <p className="text-6xl mb-2">👕</p>
                    <p>{outfit.style}</p>
                  </div>
                  
                  {/* 좋아요 취소 버튼 */}
                  <button
                    onClick={() => handleUnlike(outfit.id)}
                    className="absolute top-3 right-3 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-xl shadow hover:bg-white transition"
                  >
                    ❤️
                  </button>
                </div>

                {/* 코디 정보 */}
                <div className="p-4">
                  <p className="font-medium text-gray-800">{outfit.description}</p>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-sm text-gray-400">{outfit.season}</p>
                    <p className="text-xs text-gray-400">{outfit.likedAt}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <p className="text-6xl mb-4">💔</p>
            <p className="text-lg">아직 좋아요한 코디가 없어요</p>
            <button
              onClick={() => router.push("/main")}
              className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
            >
              코디 구경하러 가기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}