"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClosetItems, deleteClosetItem } from "@/lib/closet";
import { uploadProfilePhoto } from "@/lib/profile";
import { startFitting, pollFittingStatus } from "@/lib/fitting";
import type { ClosetItem } from "@/lib/closet";
import type { FittingCategory } from "@/lib/fitting";

// 카테고리 매핑 (한글 ↔ 영문)
const CATEGORY_MAP: Record<string, FittingCategory> = {
  "상의": "top",
  "하의": "bottom",
  "아우터": "outer",
};

const CATEGORY_MAP_REVERSE: Record<FittingCategory, string> = {
  "top": "상의",
  "bottom": "하의",
  "outer": "아우터",
};

export default function ClosetPage() {
  const router = useRouter();
  
  // 인증 상태
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  
  // 옷장 데이터
  const [closetItems, setClosetItems] = useState<ClosetItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
  
  // 가상 피팅 상태
  const [fittingSlots, setFittingSlots] = useState<{
    상의: number | null;
    하의: number | null;
    아우터: number | null;
  }>({
    상의: null,
    하의: null,
    아우터: null,
  });
  
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [fittingResult, setFittingResult] = useState<string | null>(null);
  const [fittingStatus, setFittingStatus] = useState<"idle" | "processing" | "completed">("idle");
  const [fittingProgress, setFittingProgress] = useState<string>("");
  const [llmMessage, setLlmMessage] = useState<string | null>(null);

  // UI 상태
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 초기화
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/start");
      return;
    }
    
    const storedName = sessionStorage.getItem("userName");
    if (storedName) setUserName(storedName);
    
    loadClosetItems();
    setLoading(false);
  }, [router]);

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

  // 옷장 아이템 로드
  const loadClosetItems = async () => {
    try {
      const response = await getClosetItems({ category: "all", limit: 50 });
      setClosetItems(response.data.items);
    } catch (err: any) {
      console.error("옷장 로딩 실패:", err);
      console.error("에러 메시지:", err.response?.data?.error?.message);
    }
  };

  // 카테고리 필터링
  const categories = ["전체", "상의", "하의", "아우터"];
  const filteredItems = selectedCategory === "전체" 
    ? closetItems 
    : closetItems.filter(item => {
        const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
        return koreanCategory === selectedCategory;
      });

  // 아이템 클릭 시 슬롯에 추가/제거
  const handleItemClick = (item: ClosetItem) => {
    const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
    if (!koreanCategory) return;
    
    const slotCategory = koreanCategory as "상의" | "하의" | "아우터";
    
    setFittingSlots(prev => ({
      ...prev,
      [slotCategory]: prev[slotCategory] === item.id ? null : item.id
    }));
  };

  // 슬롯에서 아이템 제거
  const handleRemoveFromSlot = (slotCategory: "상의" | "하의" | "아우터") => {
    setFittingSlots(prev => ({
      ...prev,
      [slotCategory]: null
    }));
  };

  // 슬롯의 아이템 정보 가져오기
  const getSlotItem = (slotCategory: "상의" | "하의" | "아우터") => {
    const itemId = fittingSlots[slotCategory];
    return itemId ? closetItems.find(item => item.id === itemId) : null;
  };

  // 프로필 사진 업로드
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const response = await uploadProfilePhoto(file);
      console.log("✅ 업로드 응답:", response);
      console.log("📷 photoUrl:", response.data.photoUrl);

      // 백엔드 URL을 절대 경로로 변환
      const fullPhotoUrl = response.data.photoUrl.startsWith("http")
        ? response.data.photoUrl
        : `http://localhost:8000${response.data.photoUrl}`;

      console.log("🌐 전체 URL:", fullPhotoUrl);

      setUserPhoto(fullPhotoUrl);
      setFittingResult(null);
      setFittingStatus("idle");
      alert("사진이 업로드되었습니다!");
    } catch (err: any) {
      console.error("❌ 업로드 에러:", err);
      const errorMessage = err.response?.data?.error?.message || "사진 업로드 실패";
      alert(errorMessage);
    }
  };

  // 가상 피팅 실행
  const handleFitting = async () => {
    const selectedItems = Object.entries(fittingSlots)
      .filter(([_, id]) => id !== null)
      .map(([koreanCat, id]) => ({
        itemId: id!,
        category: CATEGORY_MAP[koreanCat as "상의" | "하의" | "아우터"]
      }));
    
    if (selectedItems.length === 0) {
      alert("최소 1개 이상의 아이템을 선택해주세요");
      return;
    }
    
    setFittingStatus("processing");
    setFittingProgress("피팅 시작 중...");
    
    try {
      // 1. 피팅 시작
      const startResponse = await startFitting({ items: selectedItems });
      const jobId = startResponse.data.jobId;
      
      setFittingProgress("멋진 사진 완성 중..");
      
      // 2. 상태 폴링
      const result = await pollFittingStatus(jobId);
      
      if (result.data.status === "completed") {
        setFittingResult(result.data.resultImageUrl || null);
        setLlmMessage(result.data.llmMessage || null);
        setFittingStatus("completed");
        setFittingProgress("");
        // 피팅 완료 시 큐 초기화
        setFittingSlots({
          상의: null,
          하의: null,
          아우터: null,
        });
      } else if (result.data.status === "failed") {
        alert(`피팅 실패: ${result.data.error || "알 수 없는 오류"}`);
        setFittingStatus("idle");
        setFittingProgress("");
      } else if (result.data.status === "timeout") {
        alert("피팅 처리 시간이 초과되었습니다. 다시 시도해주세요.");
        setFittingStatus("idle");
        setFittingProgress("");
      }
    } catch (err: any) {
      console.error("피팅 실패:", err);
      alert(err.response?.data?.error?.message || "피팅 요청 실패");
      setFittingStatus("idle");
      setFittingProgress("");
    }
  };

  // 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("userName");
    router.push("/start");
  };

  // 피팅 가능 여부 (사진 있고, 아이템 1개 이상 선택되고, 완료 상태가 아닐 때)
  const canFit = userPhoto && (fittingSlots.상의 || fittingSlots.하의 || fittingSlots.아우터) && fittingStatus !== "completed";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5697B0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)] flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <nav className="bg-transparent px-6 py-4 flex justify-between items-center flex-shrink-0 w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              sessionStorage.setItem("mainPageNavigating", "true");
              router.push("/main");
            }}
            className="text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Main
          </button>
          <h1 className="text-xl font-bold text-gray-800">My Closet</h1>
        </div>
        
        {/* 프로필 드롭다운 */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <span className="font-medium">{userName}</span>
            <span className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50">
              <button
                onClick={() => {
                  router.push("/favorites");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                ❤️ 좋아요한 코디
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-sm"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 왼쪽: 가상 피팅 영역 */}
        <div className="w-[45%] p-6 flex">
          {/* 사진 영역 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden relative">
              {fittingStatus === "processing" ? (
                // 피팅 진행 중
                <div className="h-full flex flex-col items-center justify-center p-8">
                  <video
                    src="/videos/logo_animation.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-64 h-64 object-contain mb-4"
                  />
                  <p className="text-gray-600 text-center font-medium">{fittingProgress}</p>
                  <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요...</p>
                </div>
              ) : fittingResult ? (
                // 피팅 결과
                <div className="h-full relative">
                  <img
                    src={fittingResult}
                    alt="피팅 결과"
                    className="w-full h-full object-contain"
                  />
                  <button
                    onClick={() => {
                      setFittingResult(null);
                      setLlmMessage(null);
                      setFittingStatus("idle");
                    }}
                    className="absolute top-4 right-4 px-4 py-2 bg-white/90 rounded-lg shadow hover:bg-white transition text-sm font-medium"
                  >
                    다시 피팅
                  </button>

                  {/* LLM 메시지 */}
                  {llmMessage && (
                    <div className="absolute bottom-4 left-4 right-4 bg-[#B7C9E2]/80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20">
                      <p className="text-black text-sm leading-relaxed font-medium">
                        💬 {llmMessage}
                      </p>
                    </div>
                  )}
                </div>
              ) : userPhoto ? (
                // 업로드된 사진
                <div className="h-full relative">
                  <img
                    src={userPhoto}
                    alt="내 사진"
                    className="w-full h-full object-contain"
                    onLoad={() => console.log("✅ 이미지 로드 성공:", userPhoto)}
                    onError={(e) => {
                      console.error("❌ 이미지 로드 실패:", userPhoto);
                      console.error("에러 상세:", e);
                    }}
                  />
                </div>
              ) : (
                // 업로드 영역
                <div 
                  className="h-full flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-6xl mb-4">📷</div>
                  <p className="text-gray-600 font-medium">사진을 업로드하세요</p>
                  <p className="text-sm text-gray-400 mt-2">클릭하여 파일 선택</p>
                </div>
              )}
              
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            {/* 하단 버튼 영역 */}
            <div className="mt-4 flex gap-3">
              {userPhoto && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  사진 변경
                </button>
              )}
              <button
                onClick={handleFitting}
                disabled={!canFit || fittingStatus === "processing"}
                className="flex-1 py-3 bg-[#5697B0] text-white rounded-xl font-medium hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {fittingStatus === "processing" ? "피팅 중..." : "피팅 확인하기"}
              </button>
            </div>
          </div>

          {/* 옷걸이 슬롯 */}
          <div className="w-[100px] ml-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-600 text-center"></p>
            
            {(["상의", "하의", "아우터"] as const).map((slotCategory) => (
              <div 
                key={slotCategory}
                className="flex-1 bg-white rounded-xl shadow border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-2 relative"
              >
                <p className="text-xs text-gray-400 mb-1">{slotCategory}</p>
                {getSlotItem(slotCategory) ? (
                  <div className="relative w-full">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                      {getSlotItem(slotCategory)?.imageUrl ? (
                        <img
                          src={getSlotItem(slotCategory)!.imageUrl!}
                          alt={getSlotItem(slotCategory)?.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-2xl">
                            {slotCategory === "상의" ? "👔" : slotCategory === "하의" ? "👖" : "🧥"}
                          </span>
                        </div>
                      )}
                    </div>
                    {/* 삭제 버튼을 이미지 컨테이너 밖으로 이동 */}
                    <button
                      onClick={() => handleRemoveFromSlot(slotCategory)}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition shadow-md"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="aspect-square w-full bg-gray-50 rounded-lg flex items-center justify-center">
                    <span className="text-gray-300 text-2xl">+</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 오른쪽: 옷장 아이템 목록 */}
        <div className="w-[55%] bg-transparent p-6 flex flex-col overflow-hidden">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-[#5697B0] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 아이템 그리드 */}
          <div className="flex-1 overflow-auto p-1">
            <div className="grid grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
                const isInSlot =
                  fittingSlots.상의 === item.id ||
                  fittingSlots.하의 === item.id ||
                  fittingSlots.아우터 === item.id;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl p-3 transition-all group relative ${
                      isInSlot
                        ? "ring-2 ring-[#5697B0] bg-blue-50"
                        : "hover:shadow-lg"
                    }`}
                  >
                    {/* 아이템 이미지 */}
                    <div className="aspect-square bg-gray-50 rounded-lg mb-2 flex items-center justify-center relative overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">
                          {koreanCategory === "상의" ? "👔" : koreanCategory === "하의" ? "👖" : "🧥"}
                        </span>
                      )}

                      {/* Hover 오버레이 */}
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        {/* 삭제 버튼 (왼쪽 상단) */}
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm('이 아이템을 옷장에서 삭제하시겠습니까?')) {
                              try {
                                await deleteClosetItem(item.id);
                                await loadClosetItems();
                                alert('삭제되었습니다');
                              } catch (err: any) {
                                alert(err.response?.data?.error?.message || '삭제 실패');
                              }
                            }
                          }}
                          className="absolute top-2 left-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition text-xs font-bold"
                        >
                          ✕
                        </button>

                        {/* 피팅에 추가 버튼 */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleItemClick(item);
                          }}
                          className="w-full px-3 py-2 bg-[#5697B0] text-white rounded-lg text-xs font-medium hover:bg-[#4a8299] transition"
                        >
                          {isInSlot ? '피팅에서 제거' : '피팅에 추가'}
                        </button>

                        {/* 구매 링크 방문 버튼 */}
                        {item.purchaseUrl && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (item.purchaseUrl) {
                                window.open(item.purchaseUrl, '_blank');
                              }
                            }}
                            className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
                          >
                            구매 링크 방문
                          </button>
                        )}
                      </div>

                      {isInSlot && (
                        <div className="absolute top-1 right-1 w-6 h-6 bg-[#5697B0] rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>

                    {/* 아이템 정보 */}
                    <p className="text-xs text-gray-400">{item.brand || "BRAND"}</p>
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    {item.price && (
                      <p className="text-[#5697B0] font-bold text-sm mt-1">
                        {item.price.toLocaleString()}원
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-400">
                <div className="text-center">
                  <p className="text-5xl mb-2">📦</p>
                  <p>이 카테고리에 저장된 아이템이 없어요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}