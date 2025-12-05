"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getRecommendations, addFavorite, removeFavorite, recordViewLog, skipOutfit } from "@/lib/outfits";
import { saveClosetItem } from "@/lib/closet";
import { logout } from "@/lib/auth";
import type { Outfit, Season, Style } from "@/types/api";

export default function MainPage() {
  const router = useRouter();
  
  // 상태 관리
  const [allOutfits, setAllOutfits] = useState<Outfit[]>([]); // 전체 추천 코디
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [userName, setUserName] = useState("User");
  const [savedItems, setSavedItems] = useState<number[]>([]);

  // 필터 상태
  const [selectedSeason, setSelectedSeason] = useState<Season | undefined>(undefined);
  const [selectedStyle, setSelectedStyle] = useState<Style | undefined>(undefined);

  // 무한 스크롤 관련 상태
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [viewStartTime, setViewStartTime] = useState<number>(Date.now());

  // 필터링된 코디 목록 (클라이언트 사이드 필터링)
  const outfits = allOutfits.filter(outfit => {
    if (selectedSeason && outfit.season !== selectedSeason) return false;
    if (selectedStyle && outfit.style !== selectedStyle) return false;
    return true;
  });
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 필터 옵션 (백엔드 API 기반)
  const seasons: { label: string; value: Season }[] = [
    { label: "봄", value: "spring" },
    { label: "여름", value: "summer" },
    { label: "가을", value: "fall" },
    { label: "겨울", value: "winter" },
  ];

  const styles: { label: string; value: Style }[] = [
    { label: "캐주얼", value: "casual" },
    { label: "미니멀", value: "minimal" },
    { label: "스트릿", value: "street" },
    { label: "스포티", value: "sporty" },
  ];

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

  // 사용자 정보 가져오기
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/start");
      return;
    }

    const storedName = sessionStorage.getItem("userName");
    if (storedName) {
      setUserName(storedName);
    }
  }, [router]);

  // 코디 데이터 가져오기 (개인화 추천)
  const fetchOutfits = async () => {
    setLoading(true);
    setError("");

    try {
      // 새로고침 감지: sessionStorage 플래그 확인
      const isNavigating = sessionStorage.getItem("mainPageNavigating");

      // 로컬 스토리지에서 저장된 상태 확인
      const savedOutfitsStr = localStorage.getItem("mainPageOutfits");
      const savedOutfitId = localStorage.getItem("mainPageCurrentOutfitId");
      const savedPage = localStorage.getItem("mainPageCurrentPage");

      // 페이지 이동(네비게이션)인 경우에만 저장된 상태 복원
      if (isNavigating && savedOutfitsStr && savedOutfitId) {
        // 저장된 코디 목록 복원
        const savedOutfits = JSON.parse(savedOutfitsStr);
        setAllOutfits(savedOutfits);
        setCurrentPage(parseInt(savedPage || "1", 10));

        // 저장된 코디 ID로 인덱스 찾기
        const outfitId = parseInt(savedOutfitId, 10);
        const foundIndex = savedOutfits.findIndex((outfit: any) => outfit.id === outfitId);

        console.log("복원 시도: 저장된 ID =", outfitId, "찾은 인덱스 =", foundIndex);
        console.log("전체 코디 수:", savedOutfits.length);
        console.log("첫 3개 코디 ID:", savedOutfits.slice(0, 3).map((o: any) => o.id));

        if (foundIndex !== -1) {
          setCurrentIndex(foundIndex);
          console.log("✅ 복원 성공: 인덱스", foundIndex, "로 이동");
        } else {
          setCurrentIndex(0);
          console.log("❌ 복원 실패: 코디 ID 못 찾음, 0번부터 시작");
        }

        setViewStartTime(Date.now());
        setLoading(false);
      } else {
        // 새로고침이거나 저장된 데이터가 없는 경우 → 새로운 추천 받기
        console.log(isNavigating ? "저장된 데이터 없음: 새로운 추천 요청" : "🔄 새로고침 감지: 새로운 추천 요청");

        const response = await getRecommendations({
          page: 1,
          limit: 20,
        });

        setAllOutfits(response.data.outfits);
        setCurrentIndex(0);
        setCurrentPage(1);
        setViewStartTime(Date.now());

        // 로컬 스토리지에 저장
        localStorage.setItem("mainPageOutfits", JSON.stringify(response.data.outfits));
        localStorage.setItem("mainPageCurrentPage", "1");

        console.log("새로운 추천 받음:", response.data.outfits.length, "개 코디");
      }

      // 플래그 설정: 이 페이지에 있음을 표시
      sessionStorage.setItem("mainPageNavigating", "true");
    } catch (err: any) {
      console.error("코디 로딩 실패:", err);
      setError("코디를 불러오는데 실패했습니다");
    } finally {
      setLoading(false);
    }
  };

  // 추가 코디 로딩 (백그라운드)
  const loadMoreOutfits = async () => {
    if (isLoadingMore) return; // 중복 호출 방지

    setIsLoadingMore(true);
    try {
      const response = await getRecommendations({
        page: currentPage + 1,
        limit: 20,
      });

      const newOutfits = [...allOutfits, ...response.data.outfits];
      setAllOutfits(newOutfits);
      setCurrentPage(currentPage + 1);

      // 로컬 스토리지 업데이트
      localStorage.setItem("mainPageOutfits", JSON.stringify(newOutfits));
      localStorage.setItem("mainPageCurrentPage", (currentPage + 1).toString());
    } catch (err: any) {
      console.error("추가 코디 로딩 실패:", err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // 초기 로딩만 (필터는 클라이언트 사이드에서 처리)
  useEffect(() => {
    fetchOutfits();
  }, []);

  // 필터 변경 추적용 ref
  const prevSeasonRef = useRef<Season | undefined>(selectedSeason);
  const prevStyleRef = useRef<Style | undefined>(selectedStyle);
  const isFirstRenderRef = useRef(true);

  // 필터 변경 시 인덱스 리셋 (초기 렌더링 제외)
  useEffect(() => {
    // 첫 렌더링은 건너뛰기
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false;
      prevSeasonRef.current = selectedSeason;
      prevStyleRef.current = selectedStyle;
      return;
    }

    // 실제로 필터가 변경되었을 때만 리셋
    if (prevSeasonRef.current !== selectedSeason || prevStyleRef.current !== selectedStyle) {
      setCurrentIndex(0);
      console.log("필터 변경: 인덱스 0으로 리셋");
      prevSeasonRef.current = selectedSeason;
      prevStyleRef.current = selectedStyle;
    }
  }, [selectedSeason, selectedStyle]);

  const currentOutfit = outfits[currentIndex];

  // 현재 위치를 로컬 스토리지에 저장 (코디 ID 기준)
  useEffect(() => {
    if (currentOutfit) {
      localStorage.setItem("mainPageCurrentOutfitId", currentOutfit.id.toString());
      console.log("저장: 코디 ID =", currentOutfit.id, "인덱스 =", currentIndex);
    }
  }, [currentOutfit, currentIndex]);

  // View log 기록 함수
  const recordCurrentView = async () => {
    if (!currentOutfit) return;

    const durationSeconds = Math.floor((Date.now() - viewStartTime) / 1000);

    try {
      await recordViewLog(currentOutfit.id, durationSeconds);
    } catch (err: any) {
      console.error("View log 기록 실패:", err);
      // 에러가 나도 사용자 경험에 영향 없도록 무시
    }
  };

  // 네비게이션 함수
  const handlePrev = () => {
    if (currentIndex > 0 && !isTransitioning) {
      // 현재 코디의 view log 기록 (백그라운드, await 없이)
      recordCurrentView();

      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
        setViewStartTime(Date.now());
        setIsTransitioning(false);
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentIndex < outfits.length - 1 && !isTransitioning) {
      // 현재 코디의 view log 기록 (백그라운드, await 없이)
      recordCurrentView();

      // 좋아요가 없으면 skip 기록 (백그라운드)
      if (currentOutfit && !currentOutfit.isFavorite) {
        skipOutfit(currentOutfit.id).catch(err => {
          console.error("Skip 기록 실패:", err);
        });
      }

      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
        setViewStartTime(Date.now());
        setIsTransitioning(false);
      }, 300);

      // 15번째 인덱스에서 백그라운드로 다음 페이지 로드
      const actualIndex = allOutfits.findIndex(o => o.id === outfits[currentIndex + 1]?.id);
      if (actualIndex === 14 && !isLoadingMore) { // 0-based index이므로 14 = 15번째
        loadMoreOutfits();
      }
    }
  };

  // 좋아요 토글
  const handleToggleLike = async () => {
    if (!currentOutfit) return;

    try {
      if (currentOutfit.isFavorite) {
        await removeFavorite(currentOutfit.id);
        const updatedOutfits = allOutfits.map(outfit =>
          outfit.id === currentOutfit.id
            ? { ...outfit, isFavorite: false }
            : outfit
        );
        setAllOutfits(updatedOutfits);
        // 로컬 스토리지 업데이트
        localStorage.setItem("mainPageOutfits", JSON.stringify(updatedOutfits));
      } else {
        await addFavorite(currentOutfit.id);
        const updatedOutfits = allOutfits.map(outfit =>
          outfit.id === currentOutfit.id
            ? { ...outfit, isFavorite: true }
            : outfit
        );
        setAllOutfits(updatedOutfits);
        // 로컬 스토리지 업데이트
        localStorage.setItem("mainPageOutfits", JSON.stringify(updatedOutfits));
      }
    } catch (err: any) {
      console.error("좋아요 실패:", err);
      alert("좋아요 처리에 실패했습니다");
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      // 로컬 스토리지 클리어
      localStorage.removeItem("mainPageOutfits");
      localStorage.removeItem("mainPageCurrentOutfitId");
      localStorage.removeItem("mainPageCurrentPage");

      await logout();
      router.push("/start");
    } catch (err) {
      router.push("/start");
    }
  };

  // 계절 필터 토글
  const toggleSeason = (season: Season) => {
    if (selectedSeason === season) {
      setSelectedSeason(undefined);
    } else {
      setSelectedSeason(season);
    }
  };

  // 스타일 필터 토글
  const toggleStyle = (style: Style) => {
    if (selectedStyle === style) {
      setSelectedStyle(undefined);
    } else {
      setSelectedStyle(style);
    }
  };

  // 옷장에 아이템 저장
  const handleSaveToCloset = async (itemId: number) => {
    if (savedItems.includes(itemId)) {
      alert("이미 옷장에 저장된 아이템입니다");
      return;
    }
    
    try {
      await saveClosetItem(itemId);
      setSavedItems([...savedItems, itemId]);
      alert("✅ 옷장에 저장되었습니다!");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "저장에 실패했습니다";
      alert(errorMessage);
    }
  };

  // 로딩 상태
  if (loading && outfits.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#5697B0] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Swell이 당신의 취향을 찾고 있어요..</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error && outfits.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)]">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchOutfits}
            className="px-6 py-2 bg-[#5697B0] text-white rounded-lg hover:opacity-80"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)] flex flex-col overflow-hidden">
      
      {/* 상단 네비게이션 */}
      <nav className="bg-transparent px-6 py-4 flex justify-between items-center flex-shrink-0">
        <h1
          className="text-[20px] font-bold text-gray-900 flex items-center gap-2 cursor-pointer font-snippet"
          onClick={() => {
            // 플래그 제거 후 새로고침 (새로운 추천 받기)
            sessionStorage.removeItem("mainPageNavigating");
            window.location.reload();
          }}
        >
          Swell
        </h1>
        
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
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50 animate-fadeIn">
              <button
                onClick={() => {
                  router.push("/favorites");
                  setShowDropdown(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-[13px]"
              >
                ❤️ 좋아요한 코디
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
          disabled={currentIndex === 0 || isTransitioning || outfits.length === 0}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-gray-500/80 backdrop-blur-sm shadow-lg flex items-center justify-center text-white text-xl disabled:opacity-30 hover:bg-black transition-all hover:scale-105"
        >
          ←
        </button>

        <button
          onClick={handleNext}
          disabled={currentIndex === outfits.length - 1 || isTransitioning || outfits.length === 0}
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
          {/* 왼쪽: 코디 이미지 */}
          <div className="w-full md:w-[45%] flex items-center justify-center">
            {outfits.length > 0 && currentOutfit ? (
              <div className="relative w-full aspect-[3/4] max-h-[calc(100vh-200px)]">
                
                {/* 코디 이미지 카드 */}
                <div className="bg-white rounded-[16px] shadow-xl overflow-hidden h-full border border-gray-100">
                  <div className="h-full bg-gray-100 flex items-center justify-center relative group">
                    {currentOutfit.imageUrl ? (
                      <img
                        src={currentOutfit.imageUrl}
                        alt={currentOutfit.description || "코디 이미지"}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center text-gray-400">
                        <p className="text-8xl mb-4 group-hover:scale-110 transition-transform duration-500">👕</p>
                        <p className="text-lg font-medium text-gray-500">Swell Styling</p>
                        <p className="mt-2 text-sm bg-white px-3 py-1 rounded-full inline-block shadow-sm">
                          {currentOutfit.style} / {currentOutfit.season}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 좋아요 버튼 */}
                <button
                  onClick={handleToggleLike}
                  className={`absolute top-4 right-4 w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:scale-110 transition-all duration-300 border border-gray-100 ${
                    currentOutfit.isFavorite ? "bg-pink-50" : "bg-white"
                  }`}
                >
                  <span className={`text-3xl transition-transform ${currentOutfit.isFavorite ? "scale-110" : "scale-100"}`}>
                    {currentOutfit.isFavorite ? "❤️" : "🤍"}
                  </span>
                </button>

                {/* LLM 메시지 */}
                {currentOutfit.llmMessage && (
                  <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded-lg p-4 shadow-lg border border-gray-100">
                    <p className="text-sm text-gray-700 leading-relaxed">
                      💬 {currentOutfit.llmMessage}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <p className="text-6xl mb-4">🔍</p>
                <p className="text-lg">해당 조건의 코디가 없습니다.</p>
                <p className="text-sm mt-2">다른 필터를 선택해보세요!</p>
              </div>
            )}
          </div>

          {/* 오른쪽: 필터 + 상품 정보 */}
          <div className="hidden md:flex flex-col overflow-hidden" style={{ width: '600px' }}>
            {/* 필터 영역 */}
            <div className="mb-6 flex-shrink-0">
              {/* 계절 필터 */}
              <div className="mb-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Season</h3>
                <div className="flex flex-wrap gap-2">
                  {seasons.map((season) => (
                    <button
                      key={season.value}
                      onClick={() => toggleSeason(season.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedSeason === season.value
                          ? "bg-[#5697B0]/20 text-[#2c5261] ring-1 ring-[#5697B0]"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {season.label}
                    </button>
                  ))}
                  {selectedSeason && (
                    <button
                      onClick={() => setSelectedSeason(undefined)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      전체 보기
                    </button>
                  )}
                </div>
              </div>

              {/* 스타일 필터 */}
              <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Style</h3>
                <div className="flex flex-wrap gap-2">
                  {styles.map((style) => (
                    <button
                      key={style.value}
                      onClick={() => toggleStyle(style.value)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
                        selectedStyle === style.value
                          ? "bg-[#5697B0]/20 text-[#2c5261] ring-1 ring-[#5697B0]"
                          : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                  {selectedStyle && (
                    <button
                      onClick={() => setSelectedStyle(undefined)}
                      className="px-4 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      전체 보기
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 상품 목록 */}
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
                      <div className="w-16 h-16 bg-gray-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gray-100 transition-colors overflow-hidden">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xl">👔</span>
                        )}
                      </div>

                      {/* 상품 정보 */}
                      <div className="flex-1 flex flex-col justify-between min-w-0">
                        <div>
                          <p className="text-[10px] text-gray-400 font-bold tracking-wide">
                            {item.brand || "BRAND"}
                          </p>
                          {/* ✅ 상품명 클릭 시 구매 링크 이동 */}
                          {item.purchaseUrl ? (
                            <a
                              href={item.purchaseUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-medium text-gray-800 text-xs truncate leading-tight hover:text-[#5697B0] hover:underline cursor-pointer"
                            >
                              {item.name}
                            </a>
                          ) : (
                            <p className="font-medium text-gray-800 text-xs truncate leading-tight">
                              {item.name}
                            </p>
                          )}
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            {item.category}
                          </p>
                        </div>

                        <div className="flex items-center justify-between mt-1">
                          {item.price ? (
                            <p className="text-[#5697B0] font-bold text-xs">
                              {item.price.toLocaleString()}원
                            </p>
                          ) : (
                            <p className="text-gray-400 text-xs">가격 문의</p>
                          )}
                          {/* ✅ Add Closet 버튼 */}
                          <button
                            onClick={() => handleSaveToCloset(item.id)}
                            className={`px-2 py-1 text-[9px] rounded-md transition-all font-medium ${
                              savedItems.includes(item.id)
                                ? "bg-gray-800 text-white"
                                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            }`}
                          >
                            {savedItems.includes(item.id) ? "Saved ✓" : "Add Closet"}
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

      {/* 옷장 플로팅 버튼 */}
      <button
        onClick={() => router.push("/closet")}
        className="fixed bottom-10 right-12 w-18 h-18 bg-[#FFF4EA] text-[#5697B0] border-4 border-white rounded-full shadow-2xl flex items-center justify-center text-5xl hover:bg-[#ffeedb] hover:scale-105 transition-all z-30 group"
      >
        <span className="group-hover:rotate-12 transition-transform duration-300">👜</span>
      </button>

      {/* 진행 표시 */}
      {outfits.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg text-sm text-gray-600">
          {currentIndex + 1} / {outfits.length}
        </div>
      )}
    </div>
  );
}