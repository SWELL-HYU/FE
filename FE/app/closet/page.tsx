"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ClosetPage() {
  const router = useRouter();
  const { user, loading } = useAuth(true);
  
  const [selectedCategory, setSelectedCategory] = useState<string>("전체");
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
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // 카테고리 목록
  const categories = ["전체", "상의", "하의", "아우터"];

  // 임시 옷장 데이터 (나중에 API에서 받아옴)
  const closetItems = [
    { id: 101, name: "오버핏 린넨 셔츠", brand: "ZARA", category: "상의", price: 59000 },
    { id: 102, name: "와이드 치노 팬츠", brand: "UNIQLO", category: "하의", price: 39000 },
    { id: 201, name: "쿨맥스 반팔 티", brand: "COS", category: "상의", price: 45000 },
    { id: 202, name: "라이트 데님 쇼츠", brand: "LEVIS", category: "하의", price: 89000 },
    { id: 301, name: "그래픽 후디", brand: "STUSSY", category: "아우터", price: 149000 },
    { id: 302, name: "카고 조거 팬츠", brand: "NIKE", category: "하의", price: 99000 },
    { id: 401, name: "라이트 패딩", brand: "NORTHFACE", category: "아우터", price: 189000 },
    { id: 402, name: "크롭 가디건", brand: "ZARA", category: "아우터", price: 79000 },
  ];

  // 필터링된 아이템
  const filteredItems = selectedCategory === "전체" 
    ? closetItems 
    : closetItems.filter(item => item.category === selectedCategory);

  // 아이템 클릭 시 옷걸이에 추가
  const handleItemClick = (item: typeof closetItems[0]) => {
    const slotCategory = item.category as "상의" | "하의" | "아우터";
    
    if (slotCategory === "상의" || slotCategory === "하의" || slotCategory === "아우터") {
      setFittingSlots(prev => ({
        ...prev,
        [slotCategory]: prev[slotCategory] === item.id ? null : item.id
      }));
    }
  };

  // 슬롯에서 아이템 제거
  const handleRemoveFromSlot = (slotCategory: "상의" | "하의" | "아우터") => {
    setFittingSlots(prev => ({
      ...prev,
      [slotCategory]: null
    }));
  };

  // 사진 업로드
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserPhoto(reader.result as string);
        setFittingResult(null);
        setFittingStatus("idle");
      };
      reader.readAsDataURL(file);
    }
  };

  // 가상 피팅 실행
  const handleFitting = () => {
    const hasItems = fittingSlots.상의 || fittingSlots.하의 || fittingSlots.아우터;
    if (!userPhoto || !hasItems) return;
    
    setFittingStatus("processing");
    
    // 임시: 3초 후 완료 (실제로는 API 호출)
    setTimeout(() => {
      setFittingResult("fitting-result");
      setFittingStatus("completed");
    }, 3000);
  };

  // 슬롯에 있는 아이템 정보 가져오기
  const getSlotItem = (slotCategory: "상의" | "하의" | "아우터") => {
    const itemId = fittingSlots[slotCategory];
    return itemId ? closetItems.find(item => item.id === itemId) : null;
  };

  // 로그아웃
  const handleLogout = () => {
    sessionStorage.removeItem("token");
    router.push("/start");
  };

  // 피팅 가능 여부
  const canFit = userPhoto && (fittingSlots.상의 || fittingSlots.하의 || fittingSlots.아우터);

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
      <nav className="bg-white shadow-sm px-6 py-4 flex justify-between items-center flex-shrink-0 w-full">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/main")}
            className="text-gray-600 hover:text-gray-800"
          >
            ← 메인
          </button>
          <h1 className="text-xl font-bold text-gray-800">내 옷장</h1>
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
                  router.push("/favorites");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                ❤️ 좋아요 목록
              </button>
              <button
                onClick={() => {
                  router.push("/main");
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
      <div className="flex-1 flex overflow-hidden">
        
        {/* 왼쪽: 가상 피팅 영역 */}
        <div className="w-[45%] p-6 flex">
          {/* 사진 영역 */}
          <div className="flex-1 flex flex-col">
            <div className="flex-1 bg-white rounded-2xl shadow-lg overflow-hidden relative">
              {fittingStatus === "processing" ? (
                // 피팅 진행 중
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="text-6xl mb-4 animate-bounce">👕</div>
                  <p className="text-gray-600">AI가 피팅 결과를 생성하고 있어요...</p>
                  <p className="text-sm text-gray-400 mt-2">잠시만 기다려주세요</p>
                </div>
              ) : fittingResult ? (
                // 피팅 결과
                <div className="h-full flex flex-col">
                  <div className="flex-1 bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-8xl mb-4">👤</p>
                      <p className="text-lg">피팅 결과 이미지</p>
                    </div>
                  </div>
                  {/* AI 코멘트 */}
                  <div className="p-4 bg-blue-50 border-t border-blue-200">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💬</span>
                      <p className="text-sm text-gray-700">
                        선택하신 아이템들의 조합이 정말 잘 어울려요! 
                        깔끔하면서도 트렌디한 느낌을 줄 수 있는 코디네요. 👍
                      </p>
                    </div>
                  </div>
                </div>
              ) : userPhoto ? (
                // 업로드된 사진
                <img 
                  src={userPhoto} 
                  alt="내 사진" 
                  className="w-full h-full object-contain bg-gray-100 flex items-center justify-center"
                />
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
                  onClick={() => {
                    setUserPhoto(null);
                    setFittingResult(null);
                    setFittingStatus("idle");
                  }}
                  className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition"
                >
                  사진 변경
                </button>
              )}
              <button
                onClick={handleFitting}
                disabled={!canFit || fittingStatus === "processing"}
                className="flex-1 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {fittingStatus === "processing" ? "피팅 중..." : "👤 가상 피팅 시작"}
              </button>
            </div>
          </div>

          {/* 옷걸이 큐 (세로 플로팅) */}
          <div className="w-[100px] ml-4 flex flex-col gap-3">
            <p className="text-sm font-medium text-gray-600 text-center">옷걸이</p>
            
            {/* 상의 슬롯 */}
            <div className="flex-1 bg-white rounded-xl shadow border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-2 relative">
              <p className="text-xs text-gray-400 mb-1">상의</p>
              {getSlotItem("상의") ? (
                <div className="relative w-full">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👔</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromSlot("상의")}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <p className="text-xs text-center mt-1 truncate">{getSlotItem("상의")?.name}</p>
                </div>
              ) : (
                <div className="aspect-square w-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-gray-300 text-2xl">+</span>
                </div>
              )}
            </div>

            {/* 하의 슬롯 */}
            <div className="flex-1 bg-white rounded-xl shadow border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-2 relative">
              <p className="text-xs text-gray-400 mb-1">하의</p>
              {getSlotItem("하의") ? (
                <div className="relative w-full">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">👖</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromSlot("하의")}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <p className="text-xs text-center mt-1 truncate">{getSlotItem("하의")?.name}</p>
                </div>
              ) : (
                <div className="aspect-square w-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-gray-300 text-2xl">+</span>
                </div>
              )}
            </div>

            {/* 아우터 슬롯 */}
            <div className="flex-1 bg-white rounded-xl shadow border-2 border-dashed border-gray-300 flex flex-col items-center justify-center p-2 relative">
              <p className="text-xs text-gray-400 mb-1">아우터</p>
              {getSlotItem("아우터") ? (
                <div className="relative w-full">
                  <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                    <span className="text-2xl">🧥</span>
                  </div>
                  <button
                    onClick={() => handleRemoveFromSlot("아우터")}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                  >
                    ✕
                  </button>
                  <p className="text-xs text-center mt-1 truncate">{getSlotItem("아우터")?.name}</p>
                </div>
              ) : (
                <div className="aspect-square w-full bg-gray-50 rounded-lg flex items-center justify-center">
                  <span className="text-gray-300 text-2xl">+</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 오른쪽: 옷장 아이템 목록 */}
        <div className="w-[55%] bg-gray-50 border-l border-gray-200 p-6 flex flex-col overflow-hidden">
          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1.5 rounded-full text-sm transition ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* 아이템 그리드 */}
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-3 gap-3">
              {filteredItems.map((item) => {
                const isInSlot = 
                  fittingSlots.상의 === item.id || 
                  fittingSlots.하의 === item.id || 
                  fittingSlots.아우터 === item.id;
                const canAddToSlot = item.category === "상의" || item.category === "하의" || item.category === "아우터";
                
                return (
                  <div
                    key={item.id}
                    className={`bg-gray-50 rounded-xl p-3 cursor-pointer transition ${
                      isInSlot 
                        ? "ring-2 ring-blue-500 bg-blue-50" 
                        : canAddToSlot 
                          ? "hover:shadow-md hover:bg-gray-100" 
                          : "opacity-50 cursor-not-allowed"
                    }`}
                    onClick={() => canAddToSlot && handleItemClick(item)}
                  >
                    {/* 아이템 이미지 */}
                    <div className="aspect-square bg-white rounded-lg mb-2 flex items-center justify-center relative">
                      <span className="text-3xl">
                        {item.category === "상의" ? "👔" : item.category === "하의" ? "👖" : item.category === "아우터" ? "🧥" : "👟"}
                      </span>
                      {isInSlot && (
                        <div className="absolute top-1 right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                          ✓
                        </div>
                      )}
                    </div>
                    
                    {/* 아이템 정보 */}
                    <p className="text-xs text-gray-400">{item.brand}</p>
                    <p className="font-medium text-gray-800 text-sm truncate">{item.name}</p>
                    <p className="text-blue-600 font-bold text-sm mt-1">
                      {item.price.toLocaleString()}원
                    </p>
                  </div>
                );
              })}
            </div>

            {filteredItems.length === 0 && (
              <div className="flex items-center justify-center h-40 text-gray-400">
                이 카테고리에 저장된 아이템이 없어요
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}