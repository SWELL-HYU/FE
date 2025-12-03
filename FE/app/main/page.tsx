"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function MainPage() {
  const router = useRouter();
  const { user, loading } = useAuth(true);
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [likedOutfits, setLikedOutfits] = useState<number[]>([]);
  const [selectedSeasons, setSelectedSeasons] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 필터 옵션
  const seasons = ["봄", "여름", "가을", "겨울"];
  const styles = ["캐주얼", "미니멀", "스트릿", "스포티"];

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

  // 임시 코디 데이터 (나중에 API에서 받아옴)
  const allOutfits = [
    {
      id: 1,
      style: "캐주얼",
      season: "봄",
      description: "편안한 봄 캐주얼 룩",
      llmMessage: "화사한 봄날에 딱 맞는 코디예요! 린넨 셔츠가 시원한 느낌을 주고, 치노 팬츠가 깔끔한 인상을 줘요. 🌸",
      items: [
        { id: 101, name: "오버핏 린넨 셔츠", brand: "ZARA", category: "상의", price: 59000, imageUrl: "" },
        { id: 102, name: "와이드 치노 팬츠", brand: "UNIQLO", category: "하의", price: 39000, imageUrl: "" },
        { id: 103, name: "캔버스 스니커즈", brand: "CONVERSE", category: "신발", price: 75000, imageUrl: "" },
      ],
    },
    {
      id: 2,
      style: "미니멀",
      season: "여름",
      description: "시원한 여름 미니멀 룩",
      llmMessage: "더운 여름에도 스타일을 포기하지 않는 미니멀 룩이에요. 쿨맥스 소재가 땀 흡수를 도와줘요! ☀️",
      items: [
        { id: 201, name: "쿨맥스 반팔 티", brand: "COS", category: "상의", price: 45000, imageUrl: "" },
        { id: 202, name: "라이트 데님 쇼츠", brand: "LEVIS", category: "하의", price: 89000, imageUrl: "" },
        { id: 203, name: "레더 샌들", brand: "BIRKENSTOCK", category: "신발", price: 120000, imageUrl: "" },
      ],
    },
    {
      id: 3,
      style: "스트릿",
      season: "가을",
      description: "트렌디한 가을 스트릿 룩",
      llmMessage: "가을 감성 가득한 스트릿 룩! 후디와 카고 팬츠 조합이 트렌디하면서도 편안해요. 🍂",
      items: [
        { id: 301, name: "그래픽 후디", brand: "STUSSY", category: "상의", price: 149000, imageUrl: "" },
        { id: 302, name: "카고 조거 팬츠", brand: "NIKE", category: "하의", price: 99000, imageUrl: "" },
        { id: 303, name: "에어포스 1", brand: "NIKE", category: "신발", price: 139000, imageUrl: "" },
      ],
    },
    {
      id: 4,
      style: "스포티",
      season: "여름",
      description: "활동적인 여름 스포티 룩",
      llmMessage: "운동할 때도, 일상에서도 활용 가능한 스포티 룩이에요! 통기성 좋은 소재로 시원해요. 💪",
      items: [
        { id: 401, name: "드라이핏 티셔츠", brand: "NIKE", category: "상의", price: 45000, imageUrl: "" },
        { id: 402, name: "트레이닝 쇼츠", brand: "ADIDAS", category: "하의", price: 55000, imageUrl: "" },
        { id: 403, name: "러닝화", brand: "NEW BALANCE", category: "신발", price: 129000, imageUrl: "" },
      ],
    },
    {
      id: 5,
      style: "미니멀",
      season: "겨울",
      description: "따뜻한 겨울 미니멀 룩",
      llmMessage: "추운 겨울에도 깔끔한 미니멀 스타일! 코트와 니트의 조합이 세련돼요. ❄️",
      items: [
        { id: 501, name: "울 블렌드 코트", brand: "COS", category: "아우터", price: 290000, imageUrl: "" },
        { id: 502, name: "캐시미어 니트", brand: "UNIQLO", category: "상의", price: 79000, imageUrl: "" },
        { id: 503, name: "슬랙스", brand: "ZARA", category: "하의", price: 59000, imageUrl: "" },
      ],
    },
  ];

  // 필터링된 코디
  const filteredOutfits = allOutfits.filter((outfit) => {
    const seasonMatch = selectedSeasons.length === 0 || selectedSeasons.includes(outfit.season);
    const styleMatch = selectedStyles.length === 0 || selectedStyles.includes(outfit.style);
    return seasonMatch && styleMatch;
  });

  const currentOutfit = filteredOutfits[currentIndex];
  const isLiked = currentOutfit ? likedOutfits.includes(currentOutfit.id) : false;

  // 필터 변경 시 인덱스 리셋
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedSeasons, selectedStyles]);

  // 계절 필터 토글
  const toggleSeason = (season: string) => {
    if (selectedSeasons.includes(season)) {
      setSelectedSeasons(selectedSeasons.filter((s) => s !== season));
    } else {
      setSelectedSeasons([...selectedSeasons, season]);
    }
  };

  // 스타일 필터 토글
  const toggleStyle = (style: string) => {
    if (selectedStyles.includes(style)) {
      setSelectedStyles(selectedStyles.filter((s) => s !== style));
    } else {
      setSelectedStyles([...selectedStyles, style]);
    }
  };

  // 이전 코디 (스와이프 효과)
  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // 다음 코디 (스와이프 효과)
  const handleNext = () => {
    if (currentIndex < filteredOutfits.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  // 좋아요 토글
  const handleToggleLike = () => {
    if (!currentOutfit) return;
    if (isLiked) {
      setLikedOutfits(likedOutfits.filter((id) => id !== currentOutfit.id));
    } else {
      setLikedOutfits([...likedOutfits, currentOutfit.id]);
    }
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
        <h1 className="text-xl font-bold text-gray-800">Swell</h1>
        
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
                  router.push("/closet");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                👜 내 옷장
              </button>
              <hr className="my-2" />
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 text-red-500 flex items-center gap-2"
              >
                🚪 로그아웃
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 relative flex">
        
        {/* 왼쪽 화살표 */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isTransitioning || filteredOutfits.length === 0}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl disabled:opacity-30 hover:bg-gray-50 transition"
        >
          ←
        </button>

        {/* 오른쪽 화살표 */}
        <button
          onClick={handleNext}
          disabled={currentIndex === filteredOutfits.length - 1 || isTransitioning || filteredOutfits.length === 0}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white shadow-lg flex items-center justify-center text-xl disabled:opacity-30 hover:bg-gray-50 transition"
        >
          →
        </button>

        {/* 스와이프 컨텐츠 */}
        <div
          className={`flex-1 flex px-20 py-6 gap-6 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* 왼쪽: 코디 이미지 + 추천 메시지 (60%) */}
          <div className="w-[60%] flex items-center justify-center">
            {filteredOutfits.length > 0 && currentOutfit ? (
              <div className="relative h-full max-h-[calc(100vh-140px)] aspect-[3/4]">
                {/* 코디 이미지 카드 */}
                <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-full">
                  <div className="h-full bg-gray-200 flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-7xl mb-4">👕</p>
                      <p className="text-lg">코디 이미지</p>
                      <p className="mt-2">{currentOutfit.style} / {currentOutfit.season}</p>
                    </div>
                  </div>
                </div>

                {/* 좋아요 버튼 (우측 하단 플로팅) */}
                <button
                  onClick={handleToggleLike}
                  className={`absolute bottom-20 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:scale-110 transition-transform ${
                    isLiked ? "bg-pink-100" : "bg-white"
                  }`}
                >
                  {isLiked ? "❤️" : "🤍"}
                </button>

                {/* AI 추천 메시지 (코디 카드 하단에 겹쳐서 플로팅) */}
                <div className="absolute -bottom-2 left-4 right-4 transform translate-y-1/2">
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 shadow-md">
                    <div className="flex items-start gap-2">
                      <span className="text-xl">💬</span>
                      <p className="text-sm text-gray-700 leading-relaxed">{currentOutfit.llmMessage}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-lg">필터에 맞는 코디가 없어요</p>
                <p className="text-sm mt-2">다른 필터를 선택해보세요</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 필터 + 상품 정보 (40%) */}
          <div className="w-[40%] flex flex-col py-4">
            {/* 필터 영역 */}
            <div className="mb-4">
              {/* 계절 필터 */}
              <div className="flex flex-wrap gap-2 mb-2">
                {seasons.map((season) => (
                  <button
                    key={season}
                    onClick={() => toggleSeason(season)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      selectedSeasons.includes(season)
                        ? "bg-blue-500 text-white"
                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {season}
                  </button>
                ))}
              </div>
              
              {/* 스타일 필터 */}
              <div className="flex flex-wrap gap-2">
                {styles.map((style) => (
                  <button
                    key={style}
                    onClick={() => toggleStyle(style)}
                    className={`px-3 py-1.5 rounded-full text-sm transition ${
                      selectedStyles.includes(style)
                        ? "bg-green-500 text-white"
                        : "bg-white text-gray-600 border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* 상품 목록 */}
            {currentOutfit && (
              <>
                <h2 className="text-lg font-bold text-gray-800 mb-3">포함된 아이템</h2>
                
                <div className="flex flex-col gap-2 flex-1 overflow-auto">
                  {currentOutfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow p-3 flex gap-3 hover:shadow-md transition cursor-pointer"
                    >
                      {/* 상품 이미지 */}
                      <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">👔</span>
                      </div>
                      
                      {/* 상품 정보 */}
                      <div className="flex-1 flex flex-col justify-center">
                        <p className="text-xs text-gray-400">{item.brand}</p>
                        <p className="font-medium text-gray-800 text-sm">{item.name}</p>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-blue-600 font-bold">
                            {item.price.toLocaleString()}원
                          </p>
                          <button className="px-3 py-1 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 transition">
                            옷장 담기
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 페이지 표시 */}
                <div className="text-center text-gray-400 mt-4 text-sm">
                  {currentIndex + 1} / {filteredOutfits.length}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 옷장 플로팅 버튼 */}
      <button
        onClick={() => router.push("/closet")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-500 text-white rounded-full shadow-lg flex items-center justify-center text-xl hover:bg-blue-600 transition z-30"
      >
        👜
      </button>
    </div>
  );
}