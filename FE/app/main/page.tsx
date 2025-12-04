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
  const [savedItems, setSavedItems] = useState<number[]>([]);
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

  // 데이터
  const allOutfits = [
    {
      id: 1,
      style: "캐주얼",
      season: "봄",
      description: "편안한 봄 캐주얼 룩",
      llmMessage: "화사한 봄날에 딱 맞는 코디예요! 린넨 셔츠가 시원한 느낌을 주고, 치노 팬츠가 깔끔한 인상을 줘요. 🌸",
      items: [
        { id: 101, name: "오버핏 린넨 셔츠", brand: "ZARA", category: "상의", price: 59000 },
        { id: 102, name: "와이드 치노 팬츠", brand: "UNIQLO", category: "하의", price: 39000 },
        { id: 103, name: "캔버스 스니커즈", brand: "CONVERSE", category: "신발", price: 75000 },
      ],
    },
    {
      id: 2,
      style: "미니멀",
      season: "여름",
      description: "시원한 여름 미니멀 룩",
      llmMessage: "더운 여름에도 스타일을 포기하지 않는 미니멀 룩이에요. 쿨맥스 소재가 땀 흡수를 도와줘요! ☀️",
      items: [
        { id: 201, name: "쿨맥스 반팔 티", brand: "COS", category: "상의", price: 45000 },
        { id: 202, name: "라이트 데님 쇼츠", brand: "LEVIS", category: "하의", price: 89000 },
        { id: 203, name: "레더 샌들", brand: "BIRKENSTOCK", category: "신발", price: 120000 },
      ],
    },
    {
      id: 3,
      style: "스트릿",
      season: "가을",
      description: "트렌디한 가을 스트릿 룩",
      llmMessage: "가을 감성 가득한 스트릿 룩! 후디와 카고 팬츠 조합이 트렌디하면서도 편안해요. 🍂",
      items: [
        { id: 301, name: "그래픽 후디", brand: "STUSSY", category: "상의", price: 149000 },
        { id: 302, name: "카고 조거 팬츠", brand: "NIKE", category: "하의", price: 99000 },
        { id: 303, name: "에어포스 1", brand: "NIKE", category: "신발", price: 139000 },
      ],
    },
    {
      id: 4,
      style: "스포티",
      season: "여름",
      description: "활동적인 여름 스포티 룩",
      llmMessage: "운동할 때도, 일상에서도 활용 가능한 스포티 룩이에요! 통기성 좋은 소재로 시원해요. 💪",
      items: [
        { id: 401, name: "드라이핏 티셔츠", brand: "NIKE", category: "상의", price: 45000 },
        { id: 402, name: "트레이닝 쇼츠", brand: "ADIDAS", category: "하의", price: 55000 },
        { id: 403, name: "러닝화", brand: "NEW BALANCE", category: "신발", price: 129000 },
      ],
    },
    {
      id: 5,
      style: "미니멀",
      season: "겨울",
      description: "따뜻한 겨울 미니멀 룩",
      llmMessage: "추운 겨울에도 깔끔한 미니멀 스타일! 코트와 니트의 조합이 세련돼요. ❄️",
      items: [
        { id: 501, name: "울 블렌드 코트", brand: "COS", category: "아우터", price: 290000 },
        { id: 502, name: "캐시미어 니트", brand: "UNIQLO", category: "상의", price: 79000 },
        { id: 503, name: "슬랙스", brand: "ZARA", category: "하의", price: 59000 },
      ],
    },
  ];

  // 필터링 로직
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

  // 필터 토글 함수
  const toggleSeason = (season: string) => {
    setSelectedSeasons(prev => 
      prev.includes(season) ? prev.filter(s => s !== season) : [...prev, season]
    );
  };

  const toggleStyle = (style: string) => {
    setSelectedStyles(prev => 
      prev.includes(style) ? prev.filter(s => s !== style) : [...prev, style]
    );
  };

  // 네비게이션 함수
  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentIndex < filteredOutfits.length - 1 && !isTransitioning) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleToggleLike = () => {
    if (!currentOutfit) return;
    if (isLiked) {
      setLikedOutfits(likedOutfits.filter((id) => id !== currentOutfit.id));
    } else {
      setLikedOutfits([...likedOutfits, currentOutfit.id]);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    router.push("/start");
  };

  // 로딩 상태 처리
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500 animate-pulse">Loading Swell...</p>
      </div>
    );
  }

  return (
    // 배경 그라디언트 적용
    <div className="h-screen bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)]flex flex-col overflow-hidden">
      
      {/* 상단 네비게이션 */}
      <nav className="bg-transparent px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h1 className="text-[20px] font-bold text-gray-900 flex items-center gap-2 cursor-pointer" onClick={() => window.location.reload()}>
          <span className="font-[Snippet]">Swell</span>
        </h1>
        
        {/* 프로필 드롭다운*/}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            {/* 유저 이름 표시 (Auth 연동) */}
            <span className="font-medium">{user?.name || "User"}</span>
            <span className={`transition-transform duration-200 ${showDropdown ? "rotate-180" : ""}`}>▼</span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50 animate-fadeIn">
               <button
                onClick={() => {
                  router.push("/favorites");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-[13px]"
              >
                ❤️ Liked Outfits
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-[13px]"
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* 메인 컨텐츠 영역 */}
      <div className="flex-1 relative flex justify-center items-center px-6 py-8">

        {/* 네비게이션 화살표 */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isTransitioning || filteredOutfits.length === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-500/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-white text-xl disabled:opacity-30 hover:bg-black transition-all hover:scale-105"
        >
          ←
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === filteredOutfits.length - 1 || isTransitioning || filteredOutfits.length === 0}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-500/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-white text-xl disabled:opacity-30 hover:bg-black transition-all hover:scale-105"
        >
          →
        </button>

        {/* 스와이프 컨텐츠 */}
        <div
          className={`max-w-[1400px] w-full flex gap-40 transition-opacity duration-300 ${
            isTransitioning ? "opacity-0" : "opacity-100"
          }`}
        >
          {/* 왼쪽: 코디 이미지 (5:6 비율) */}
          <div className="w-full md:w-[45%] flex items-center justify-center">
            {filteredOutfits.length > 0 && currentOutfit ? (
              <div className="relative w-full aspect-[3/4] max-h-[calc(100vh-200px)]">
                
                {/* 코디 이미지 카드 */}
                <div className="bg-white rounded-[16px] shadow-xl overflow-hidden h-full border border-gray-100">
                  <div className="h-full bg-gray-100 flex items-center justify-center relative group">
                    {/* 실제 이미지가 들어갈 곳 (현재는 placeholder) */}
                    <div className="text-center text-gray-400">
                      <p className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-500">👕</p>
                      <p className="text-lg font-medium text-gray-500">Swell Styling</p>
                      <p className="mt-2 text-sm bg-white px-3 py-1 rounded-full inline-block shadow-sm">
                        {currentOutfit.style} / {currentOutfit.season}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 좋아요 버튼 (우측 상단 플로팅) */}
                <button
                  onClick={handleToggleLike}
                  className={`absolute top-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border border-gray-100 ${
                    isLiked ? "bg-pink-50" : "bg-white"
                  }`}
                >
                  <span className={`text-3xl transition-transform ${isLiked ? "scale-110" : "scale-100"}`}>
                    {isLiked ? "❤️" : "🤍"}
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-lg">해당 조건의 코디가 없습니다.</p>
                <p className="text-sm mt-2">다른 필터를 선택해보세요!</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 필터 + 상품 정보 (5:6 비율) */}
          <div className="hidden md:flex flex-col overflow-hidden" style={{ width: '600px' }}>
            {/* 필터 영역 (상단 고정) */}
            <div className="mb-6 flex-shrink-0">
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Season</h3>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((season) => (
                    <button
                      key={season}
                      onClick={() => toggleSeason(season)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedSeasons.includes(season)
                          ? "bg-[#5697B0]/20 text-[#2c5261] ring-1 ring-[#5697B0]"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Style</h3>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleStyle(style)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedStyles.includes(style)
                          ? "bg-[#5697B0]/20 text-[#2c5261] ring-1 ring-[#5697B0]"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 상품 목록 (스크롤 영역) */}
            {currentOutfit && (
              <div className="flex-1 flex flex-col min-h-0">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>Items</span>
                  <span className="text-xs font-normal text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                    {currentOutfit.items.length}
                  </span>
                </h2>
                
                <div className="flex flex-col gap-2 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                  {currentOutfit.items.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-lg shadow-sm border border-gray-100 p-2.5 flex gap-3 hover:shadow-md transition-shadow group"
                    >
                      {/* 상품 이미지 */}
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors">
                        <span className="text-xl">👔</span>
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold tracking-wide">{item.brand}</p>
                          <p className="font-medium text-gray-800 text-xs truncate leading-tight">
                            {item.name}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          <p className="text-[#5697B0] font-bold text-xs">
                            {item.price.toLocaleString()}원
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (savedItems.includes(item.id)) {
                                setSavedItems(savedItems.filter(id => id !== item.id));
                              } else {
                                setSavedItems([...savedItems, item.id]);
                              }
                            }}
                            className={`px-2 py-1 text-[9px] rounded-md transition-all font-medium ${
                              savedItems.includes(item.id)
                                ? "bg-gray-800 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {savedItems.includes(item.id) ? "Saved ✓" : "+ Closet"}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 옷장 플로팅 버튼 (네비게이션 연동) */}
      <button
        onClick={() => router.push("/closet")}
        className="fixed bottom-10 right-12 w-18 h-18 bg-[#FFF4EA] text-[#5697B0] border-4 border-white rounded-full shadow-2xl flex items-center justify-center text-5xl hover:bg-[#ffeedb] hover:scale-105 transition-all z-30 group"
      >
        <span className="group-hover:rotate-12 transition-transform duration-300">👜</span>
      </button>
    </div>
  );
}