"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getClosetItems, deleteClosetItem } from "@/lib/closet";
import { uploadProfilePhoto } from "@/lib/profile";
import { getMe, logout } from "@/lib/auth";
import { startFitting, pollFittingStatus, getFittingHistory } from "@/lib/fitting";
import { API_BASE_URL } from "@/lib/api";

import ItemSelector from "@/components/closet/ItemSelector";
import ProgressBar from "@/components/common/ProgressBar";
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
  const [progressValue, setProgressValue] = useState(0); // 0~100
  const [estimatedSeconds, setEstimatedSeconds] = useState<number>(0); // 예상 소요 시간 (초)
  const [llmMessage, setLlmMessage] = useState<string | null>(null);

  // Fake Progress Bar Logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (fittingStatus === "processing") {
      setProgressValue(0);

      // 예상 시간이 설정되지 않았으면 기본값 30초 (혹은 아이템 개수 기반 추정 불가 시)
      const duration = estimatedSeconds > 0 ? estimatedSeconds : 45;

      // 100ms마다 업데이트
      const updateInterval = 100;
      const totalSteps = (duration * 1000) / updateInterval;
      const increment = 90 / totalSteps; // 90%까지 도달

      let p = 0;
      interval = setInterval(() => {
        p += increment;
        if (p > 90) p = 90; // 최대 90%에서 대기
        setProgressValue(p);
      }, updateInterval);

    } else if (fittingStatus === "completed") {
      setProgressValue(100);
    } else {
      setProgressValue(0);
      setEstimatedSeconds(0);
    }

    return () => clearInterval(interval);
  }, [fittingStatus, estimatedSeconds]);

  // UI 상태
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 모바일 탭 상태 ('fitting' | 'items')
  const [activeTab, setActiveTab] = useState<'fitting' | 'items'>('fitting');

  // 모바일 아이템 오버레이 상태
  const [mobileSelectedItemId, setMobileSelectedItemId] = useState<number | null>(null);

  // 아이템 선택 모달 상태
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [activeSlot, setActiveSlot] = useState<"상의" | "하의" | "아우터" | null>(null);

  const handleSlotClick = (slot: "상의" | "하의" | "아우터") => {
    setActiveSlot(slot);
    setIsSelectorOpen(true);
  };

  const handleSelectorSelect = (item: ClosetItem) => {
    if (!activeSlot) return;

    setFittingSlots(prev => ({
      ...prev,
      [activeSlot]: item.id
    }));

    // 피팅 완료 상태였다면 초기화 (바로 '피팅 확인하기' 활성화)
    if (fittingStatus === "completed") {
      setFittingStatus("idle");
      setFittingResult(null);
      setLlmMessage(null);
    }

    setIsSelectorOpen(false);
  };

  // 카메라 상태 (웹 전용)
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  // 카메라 컨테이너 Ref (캡처 시 보이는 영역 기준점)
  const containerRef = useRef<HTMLDivElement>(null);

  const startCamera = async () => {
    // 1. 보안 컨텍스트 확인 (HTTP에서는 navigator.mediaDevices가 undefined일 수 있음)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      alert(
        "카메라를 실행할 수 없습니다.\n\n브라우저 보안 정책상 HTTPS 또는 localhost 환경에서만 카메라 접근이 가능합니다.\n현재 접속 주소를 확인해주세요."
      );
      return;
    }

    try {
      setIsRequestingCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });

      // 권한 허용 후 상태 변경
      setIsCameraOpen(true);

      // 상태 업데이트 후 DOM 렌더링 대기
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setIsRequestingCamera(false);
      }, 100);
    } catch (err) {
      console.error("카메라 접근 실패:", err);
      // 권한 거부 또는 취소 시
      alert("카메라 권한이 차단되었습니다.\n\n브라우저 주소창 옆의 '자물쇠' 또는 '설정' 아이콘을 눌러 카메라 권한을 '허용'으로 변경해주세요.");
      setIsRequestingCamera(false);
      setIsCameraOpen(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsCameraOpen(false);
  };

  const [countdown, setCountdown] = useState<number | null>(null);
  const [showFlash, setShowFlash] = useState(false);

  const startInternalCapture = () => {
    setCountdown(3);
  };

  useEffect(() => {
    if (countdown === null) return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // 카운트다운 0 도달 시 촬영
      triggerCapture();
      setCountdown(null);
    }
  }, [countdown]);

  const triggerCapture = () => {
    // 플래시 효과
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 150);

    capturePhoto();
  };

  // 실제 캡처 로직 (화면에 보이는 영역과 1:1 매칭되도록 정밀 크롭)
  const capturePhoto = () => {
    if (!videoRef.current || !containerRef.current) return;

    const video = videoRef.current;
    const container = containerRef.current;

    // 1. 비디오 원본 해상도 Check
    const vWidth = video.videoWidth;
    const vHeight = video.videoHeight;

    if (!vWidth || !vHeight) {
      console.error("비디오 메타데이터가 아직 로드되지 않았습니다.");
      return;
    }

    // 2. 실제 화면에 보이는 컨테이너 크기 (테두리 제외 등 정밀 측정)
    const containerRect = container.getBoundingClientRect();
    const cWidth = containerRect.width;
    const cHeight = containerRect.height;

    // 3. 비율 계산 (소수점 정밀도 유지)
    const videoAspect = vWidth / vHeight;
    const containerAspect = cWidth / cHeight;

    let sx = 0, sy = 0, sWidth = vWidth, sHeight = vHeight;

    if (videoAspect > containerAspect) {
      // 비디오가 컨테이너보다 더 와이드함 -> 좌우를 잘라내야 함
      // videoHeight는 꽉 채우고, videoWidth 중 일부만 사용
      sWidth = vHeight * containerAspect;
      sx = (vWidth - sWidth) / 2;
    } else if (videoAspect < containerAspect) {
      // 비디오가 컨테이너보다 더 길쭉함 (또는 모바일 세로) -> 위아래를 잘라내야 함
      // videoWidth는 꽉 채우고, videoHeight 중 일부만 사용
      sHeight = vWidth / containerAspect;
      sy = (vHeight - sHeight) / 2;
    }

    // 4. 캔버스 생성 (잘라낼 영역의 원본 해상도 크기 사용)
    const canvas = document.createElement("canvas");
    canvas.width = Math.floor(sWidth);
    canvas.height = Math.floor(sHeight);

    const ctx = canvas.getContext("2d");

    if (ctx) {
      // 배경을 검은색으로 채우기 (투명 픽셀 방지)
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // 거울 모드 (좌우 반전) 유지
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);

      // 정밀 크롭하여 그리기
      ctx.drawImage(
        video,
        sx, sy, sWidth, sHeight,  // 소스 영역 (실수 좌표 허용)
        0, 0, canvas.width, canvas.height // 타겟 영역
      );

      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const file = new File([blob], "camera_capture.jpg", { type: "image/jpeg" });

        try {
          console.log("📸 카메라 캡처 업로드 시작 (Precision Crop)");
          stopCamera();

          const response = await uploadProfilePhoto(file);

          const fullPhotoUrl = response.data.photoUrl.startsWith("http")
            ? response.data.photoUrl
            : `${API_BASE_URL}${response.data.photoUrl}`;

          setUserPhoto(fullPhotoUrl);
          setFittingResult(null);
          setFittingStatus("idle");

        } catch (err) {
          const error = err as any;
          alert(error.response?.data?.error?.message || "사진 업로드 실패");
        }
      }, "image/jpeg", 0.95);
    }
  };

  // 컴포넌트 언마운트 시 카메라 정리
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);


  // 초기화
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) {
      router.push("/start");
      return;
    }

    const storedName = sessionStorage.getItem("userName");
    if (storedName) setUserName(storedName);

    // 0. 로컬 저장소에서 선택된 아이템 복원 (우선순위 낮음 - 실제 피팅 상태가 있으면 덮어씌워짐)
    const savedSlots = sessionStorage.getItem("fittingSlots");
    if (savedSlots) {
      try {
        setFittingSlots(JSON.parse(savedSlots));
      } catch (e) {
        console.error("Failed to parse saved fitting slots", e);
      }
    }

    loadClosetItems();

    // 1. 프로필 사진 및 사용자 이름 복원
    getMe().then((res) => {
      // 사용자 이름 업데이트 (세션에 없었을 경우 대비)
      if (res.data.user.name) {
        setUserName(res.data.user.name);
        sessionStorage.setItem("userName", res.data.user.name);
      }

      if (res.data.user.profileImageUrl) {
        // 백엔드 URL을 절대 경로로 변환
        const fullPhotoUrl = res.data.user.profileImageUrl.startsWith("http")
          ? res.data.user.profileImageUrl
          : `${API_BASE_URL}${res.data.user.profileImageUrl}`;
        setUserPhoto(fullPhotoUrl);
      }
    });

    // 2. 가상 피팅 상태 복원
    restoreFittingStatus();

    setLoading(false);
  }, [router]);

  // 피팅 아이템 변경 시 저장
  useEffect(() => {
    sessionStorage.setItem("fittingSlots", JSON.stringify(fittingSlots));
  }, [fittingSlots]);

  // 가상 피팅 상태 복원 함수
  const restoreFittingStatus = async () => {
    try {
      // 최신 1개만 조회
      const history = await getFittingHistory({ page: 1, limit: 1 });
      const latestFitting = history.data.fittings[0]; // 최신 피팅

      if (!latestFitting) return;

      if (latestFitting.status === "processing") {
        // 진행 중이면 상태 설정 후 폴링 시작
        setFittingStatus("processing");
        setFittingProgress("이전 작업을 계속 진행 중입니다...");

        // 진행 중인 아이템 슬롯에 복원
        if (latestFitting.items && latestFitting.items.length > 0) {
          const restoredSlots = { ...fittingSlots };
          latestFitting.items.forEach(item => {
            // item.category는 'top', 'bottom', 'outer' 형태이므로 한글로 변환
            const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
            if (koreanCategory) {
              restoredSlots[koreanCategory as "상의" | "하의" | "아우터"] = item.itemId;
            }
          });
          setFittingSlots(restoredSlots);

          // 복원 시 예상 시간 설정
          const count = latestFitting.items.length;
          setEstimatedSeconds(count * 15);
        }

        // 폴링 재개
        pollFittingStatus(latestFitting.jobId)
          .then((result) => {
            if (result.data.status === "completed") {
              setFittingResult(result.data.resultImageUrl || null);
              setLlmMessage(result.data.llmMessage || null);
              setFittingStatus("completed");
              setFittingProgress("");
            } else if (result.data.status === "failed") {
              // 조용히 실패 처리 (또는 알림)
              setFittingStatus("idle");
            } else if (result.data.status === "timeout") {
              setFittingStatus("idle");
            }
          })
          .catch(() => {
            setFittingStatus("idle");
          });

      } else if (latestFitting.status === "completed") {
        // 완료된 상태면 결과 표시
        setFittingResult(latestFitting.resultImageUrl);

        // 완료된 아이템 슬롯에 복원 (선택사항: 완료된 결과의 아이템을 보여줄지 여부)
        // 사용자가 "다시 피팅"을 누르기 전까지는 완료된 피팅의 아이템을 보여주는 것이 자연스러움
        if (latestFitting.items && latestFitting.items.length > 0) {
          const restoredSlots = { ...fittingSlots };
          latestFitting.items.forEach(item => {
            const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
            if (koreanCategory) {
              restoredSlots[koreanCategory as "상의" | "하의" | "아우터"] = item.itemId;
            }
          });
          setFittingSlots(restoredSlots);
        }
        // LLM 메시지는 history에 없으므로 (FittingHistoryItem 정의 확인 필요) 
        // 상세 조회 API를 호출하거나, history에 포함되어 있다면 사용.
        // 현재 FittingHistoryItem에는 llmMessage가 없음.
        // 따라서 getFittingStatus(jobId)를 호출해서 가져오거나 해야 함.
        // 여기서는 상세 조회를 추가로 호출하여 확실하게 데이터를 가져오도록 개선.

        // 상세 정보 조회하여 LLM 메시지까지 복원
        // (import getFittingStatus 필요하지만 pollFittingStatus 내부적으로 사용하므로 
        //  pollFittingStatus를 불러도 되지만, 이미 완료된 건이라 바로 리턴될 것임)

        pollFittingStatus(latestFitting.jobId).then(result => {
          if (result.data.status === "completed") {
            setFittingResult(result.data.resultImageUrl || null);
            setLlmMessage(result.data.llmMessage || null);
            setFittingStatus("completed");
          }
        });
      }
      // failed/timeout은 무시 (idle 상태 유지)
    } catch (err) {
      console.error("피팅 상태 복원 실패:", err);
    }
  };

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
    } catch (err) {
      const error = err as any;
      console.error("옷장 로딩 실패:", error);
      console.error("에러 메시지:", error.response?.data?.error?.message);
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

    // 피팅 완료 상태였다면 초기화
    if (fittingStatus === "completed") {
      setFittingStatus("idle");
      setFittingResult(null);
      setLlmMessage(null);
    }
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
      console.log("📤 업로드 시작:", file.name, file.type, file.size);
      const response = await uploadProfilePhoto(file);
      console.log("✅ 업로드 응답:", response);
      console.log("📷 photoUrl:", response.data.photoUrl);

      // 백엔드 URL을 절대 경로로 변환
      const fullPhotoUrl = response.data.photoUrl.startsWith("http")
        ? response.data.photoUrl
        : `${API_BASE_URL}${response.data.photoUrl}`;

      console.log("🌐 전체 URL:", fullPhotoUrl);

      setUserPhoto(fullPhotoUrl);
      setFittingResult(null);
      setFittingStatus("idle");
      alert("사진이 업로드되었습니다!");
    } catch (err) {
      const error = err as any;
      console.error("❌ 업로드 에러 전체:", error);
      console.error("❌ 에러 메시지:", error.message);
      console.error("❌ 에러 코드:", error.code);
      console.error("❌ 응답 데이터:", error.response?.data);
      console.error("❌ 응답 상태:", error.response?.status);

      const errorMessage = error.response?.data?.error?.message || error.message || "사진 업로드 실패";
      alert(`업로드 실패: ${errorMessage}`);
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

    // 피팅 소요 시간: 약 45초 고정 (사용자 요청 40-50초)
    const estimated = 45;
    setEstimatedSeconds(estimated);

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
    } catch (err) {
      const error = err as any;
      console.error("피팅 실패:", error);
      alert(error.response?.data?.error?.message || "피팅 요청 실패");
      setFittingStatus("idle");
      setFittingProgress("");
    }
  };

  // 로그아웃

  const handleLogout = async () => {
    try {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("userName");
      sessionStorage.removeItem("fittingSlots");
      sessionStorage.removeItem("mainPageNavigating");
      localStorage.removeItem("mainPageToken"); // Also clear explicit token if possible

      await logout(); // Call API logout
      router.push("/start");
    } catch (_err) {
      router.push("/start");
    }
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
    <div className="h-[100dvh] bg-gradient-to-b from-[rgba(86,151,176,0.45)] via-[rgba(255,244,234,0.65)] to-[rgba(255,244,234,1)] flex flex-col overflow-hidden">
      {/* 상단 네비게이션 */}
      <nav className="bg-transparent px-6 pb-4 pt-[calc(1rem+env(safe-area-inset-top))] flex justify-between items-center flex-shrink-0 w-full">
        {/* 모바일: Swell 로고 / 데스크톱: ← Main + 페이지 제목 */}
        <div className="flex items-center gap-4">
          {/* 데스크톱 전용 */}
          <button
            onClick={() => {
              sessionStorage.setItem("mainPageNavigating", "true");
              router.push("/main");
            }}
            className="hidden md:block text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Main
          </button>
          <h1 className="hidden md:block text-xl font-bold text-gray-800">My Closet</h1>

          {/* 모바일 전용: Swell 로고 */}
          <h1
            className="md:hidden text-[20px] font-bold text-gray-900 flex items-center gap-2 cursor-pointer font-snippet"
            onClick={() => {
              sessionStorage.setItem("mainPageNavigating", "true");
              router.push("/main");
            }}
          >
            Swell
          </h1>
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

      {/* 데스크톱: 기존 레이아웃 */}
      <div className="hidden md:flex flex-1 overflow-hidden">

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
                  <div className="w-full px-8 mb-2">
                    <ProgressBar progress={progressValue} />
                  </div>
                  <p className="text-gray-600 text-center font-medium">{fittingProgress}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    잠시만 기다려주세요...
                    {estimatedSeconds > 0 && `(약 ${estimatedSeconds}초 소요 예정)`}
                  </p>
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
                    <div className="absolute bottom-4 left-4 right-4 bg-[#B7C9E2]/80 backdrop-blur-sm rounded-xl p-4 shadow-xl border border-white/20 animate-fadeIn">
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
                isCameraOpen ? (
                  // 향상된 카메라 뷰 UI
                  // 향상된 카메라 뷰 UI
                  <div ref={containerRef} className="h-full bg-gray-900 relative flex flex-col items-center justify-center overflow-hidden rounded-2xl">
                    {/* 비디오 스트림 */}
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover transform scale-x-[-1]"
                    />

                    {/* 가이드 오버레이 (사람 실루엣) */}
                    <div className="absolute inset-0 pointer-events-none flex items-end justify-center opacity-30">
                      <svg viewBox="0 0 200 400" className="h-[90%] w-auto fill-none stroke-white stroke-[2] border-dashed">
                        {/* 단순화된 사람 형태 가이드 */}
                        <path d="M100,60 C115,60 125,75 125,90 C125,105 115,115 100,115 C85,115 75,105 75,90 C75,75 85,60 100,60 Z" /> {/* 머리 */}
                        <path d="M 70,120 Q 50,140 40,200 L 40,300 M 130,120 Q 150,140 160,200 L 160,300" /> {/* 몸통 외곽 */}
                      </svg>
                      <p className="absolute top-10 text-white/80 text-sm font-medium bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                        가이드라인에 맞춰주세요
                      </p>
                    </div>

                    {/* 카운트다운 오버레이 */}
                    {countdown !== null && (
                      <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                        <span className="text-white text-9xl font-bold animate-ping opacity-90">{countdown}</span>
                      </div>
                    )}

                    {/* 플래시 효과 */}
                    {showFlash && (
                      <div className="absolute inset-0 z-30 bg-white animate-[fadeOut_0.2s_ease-out]"></div>
                    )}

                    {/* 컨트롤 바 */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent flex justify-between items-center z-10">
                      <button
                        onClick={stopCamera}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition"
                        title="닫기"
                      >
                        ✕
                      </button>

                      <button
                        onClick={startInternalCapture}
                        disabled={countdown !== null}
                        className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center bg-transparent hover:bg-white/10 transition active:scale-95"
                      >
                        <div className="w-16 h-16 rounded-full bg-white"></div>
                      </button>

                      <div className="w-12"></div> {/* 균형 맞추기용 빈 공간 */}
                    </div>
                  </div>
                ) : (
                  // Premium Upload/Camera Selection UI
                  <div className="h-full flex flex-col items-center justify-center p-8 relative overflow-hidden bg-gray-50/30">

                    {/* Decorative Background Elements */}
                    <div className="absolute top-10 right-10 w-64 h-64 bg-blue-100/40 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-10 left-10 w-48 h-48 bg-orange-100/40 rounded-full blur-3xl pointer-events-none" />

                    <div className="z-10 w-full max-w-sm flex flex-col gap-6">
                      <div className="text-center mb-2">
                        <h3 className="text-xl font-bold text-gray-800">사진 준비하기</h3>
                        <p className="text-sm text-gray-500 mt-1">지금 입고 있는 옷을 가상으로 입어보세요</p>
                      </div>

                      {/* Option 1: File Upload */}
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative bg-white border border-gray-100 p-5 rounded-2xl shadow-sm hover:shadow-md hover:border-[#5697B0]/50 transition-all duration-300 cursor-pointer flex items-center gap-5 overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-gray-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="w-14 h-14 bg-blue-50 text-[#5697B0] rounded-2xl flex items-center justify-center shadow-inner group-hover:scale-105 transition-transform duration-300">
                          {/* Icon: Image */}
                          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800 group-hover:text-[#5697B0] transition-colors">사진 업로드</h4>
                          <p className="text-xs text-gray-400 mt-1 group-hover:text-gray-500">내 앨범에서 선택하기</p>
                        </div>
                        <div className="text-gray-300 group-hover:text-[#5697B0] group-hover:translate-x-1 transition-all">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>

                      {/* Option 2: Camera */}
                      <button
                        onClick={startCamera}
                        disabled={isRequestingCamera}
                        className="group relative bg-gradient-to-br from-[#5697B0] to-[#3d7a91] p-5 rounded-2xl shadow-lg shadow-blue-200/50 hover:shadow-xl hover:shadow-blue-300/60 hover:-translate-y-0.5 transition-all duration-300 text-left flex items-center gap-5 overflow-hidden"
                      >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />

                        {isRequestingCamera ? (
                          <div className="w-full flex flex-col items-center justify-center py-2 gap-2 text-white/90">
                            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span className="text-sm font-medium">카메라 준비 중...</span>
                          </div>
                        ) : (
                          <>
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-inner group-hover:rotate-6 transition-transform duration-300">
                              {/* Icon: Camera */}
                              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <div className="flex-1">
                              <h4 className="font-bold text-white">카메라 촬영</h4>
                              <p className="text-xs text-blue-100 mt-1 opacity-80 group-hover:opacity-100">지금 바로 찍어서 입어보기</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white/80 group-hover:bg-white group-hover:text-[#5697B0] transition-colors">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </div>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="mt-8 flex items-center gap-2 px-4 py-2 bg-white/60 backdrop-blur-md rounded-full border border-white/50 text-xs text-gray-500 shadow-sm">
                      <span className="text-[#5697B0]">💡</span>
                      전신이 잘 나오는 사진을 사용해주세요
                    </div>
                  </div>
                )
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
                  onClick={() => setUserPhoto(null)}
                  className="px-6 py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium"
                >
                  사진/카메라 변경
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
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${selectedCategory === category
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
                    className={`bg-white rounded-xl p-3 transition-all group relative ${isInSlot
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
                              } catch (err) {
                                const error = err as any;
                                alert(error.response?.data?.error?.message || '삭제 실패');
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

      {/* 모바일: 탭 기반 레이아웃 */}
      <div className="md:hidden flex-1 flex flex-col overflow-hidden pb-[calc(3.5rem+env(safe-area-inset-bottom))]">
        {/* 탭 헤더 */}
        <div className="flex border-b border-gray-200 bg-transparent backdrop-blur-sm flex-shrink-0">
          <button
            onClick={() => setActiveTab('fitting')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'fitting'
              ? 'text-[#5697B0] border-b-2 border-[#5697B0]'
              : 'text-gray-500'
              }`}
          >
            가상 피팅
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`flex-1 py-3 text-sm font-medium transition-all ${activeTab === 'items'
              ? 'text-[#5697B0] border-b-2 border-[#5697B0]'
              : 'text-gray-500'
              }`}
          >
            아이템 목록
          </button>
        </div>

        {/* 피팅 탭 */}
        {activeTab === 'fitting' && (
          <div className="flex-1 flex flex-col p-4 overflow-auto">
            {/* 사진 영역 - 더 크게 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden relative mb-3 min-h-[400px]">
              {fittingStatus === "processing" ? (
                <div className="h-full flex flex-col items-center justify-center p-8 min-h-[400px]">
                  <video
                    src="/videos/logo_animation.mp4"
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-32 h-32 object-contain mb-4"
                  />
                  <div className="w-full px-8 mb-2">
                    <ProgressBar progress={progressValue} />
                  </div>
                  <p className="text-gray-600 text-center font-medium text-sm">{fittingProgress}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    잠시만 기다려주세요...
                    {estimatedSeconds > 0 && `(약 ${estimatedSeconds}초 소요 예정)`}
                  </p>
                </div>
              ) : fittingResult ? (
                <div className="relative w-full">
                  <img
                    src={fittingResult}
                    alt="피팅 결과"
                    className="w-full h-auto object-contain max-h-[70vh]"
                  />
                  <button
                    onClick={() => {
                      setFittingResult(null);
                      setLlmMessage(null);
                      setFittingStatus("idle");
                    }}
                    className="absolute top-3 right-3 px-3 py-1.5 bg-white/90 rounded-lg shadow hover:bg-white transition text-xs font-medium"
                  >
                    다시 피팅
                  </button>

                </div>
              ) : userPhoto ? (
                <div className="relative w-full">
                  <img
                    src={userPhoto}
                    alt="내 사진"
                    className="w-full h-auto object-contain max-h-[70vh]"
                  />
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition min-h-[400px]"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="text-5xl mb-3">📷</div>
                  <p className="text-gray-600 font-medium text-sm">사진을 업로드하세요</p>
                  <p className="text-xs text-gray-400 mt-1">클릭하여 파일 선택</p>
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

            {/* LLM 메시지 (모바일: 이미지 하단으로 이동 - 잘림 방지) */}
            {fittingResult && llmMessage && (
              <div className="bg-[#B7C9E2] rounded-xl p-4 shadow-md border border-white/20 mb-3 animate-fadeIn">
                <p className="text-gray-800 text-sm leading-relaxed font-medium">
                  💬 {llmMessage}
                </p>
              </div>
            )}

            {/* 옷걸이 슬롯 (가로 3개) - 더 작게 */}
            <div className="flex gap-2 mb-3">
              {(["상의", "하의", "아우터"] as const).map((slotCategory) => (
                <div
                  key={slotCategory}
                  onClick={() => handleSlotClick(slotCategory)}
                  className="flex-1 bg-white rounded-lg shadow border border-dashed border-gray-300 p-1.5 relative cursor-pointer active:scale-95 transition-transform"
                >
                  <p className="text-[9px] text-gray-400 text-center mb-0.5">{slotCategory}</p>
                  {getSlotItem(slotCategory) ? (
                    <div className="relative">
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
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFromSlot(slotCategory);
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center hover:bg-red-600 transition shadow-md"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center">
                      <span className="text-gray-300 text-xl">+</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* 버튼 영역 */}
            <div className="flex gap-2">
              {userPhoto && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2.5 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition font-medium text-sm"
                >
                  사진 변경
                </button>
              )}
              <button
                onClick={handleFitting}
                disabled={!canFit || fittingStatus === "processing"}
                className="flex-1 py-2.5 bg-[#5697B0] text-white rounded-xl font-medium hover:opacity-90 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
              >
                {fittingStatus === "processing" ? "피팅 중..." : "피팅 확인하기"}
              </button>
            </div>

            {/* 아이템 선택 모달 - 이동됨 */}
          </div>
        )}

        {/* 아이템 탭 */}
        {activeTab === 'items' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* 카테고리 필터 */}
            <div className="flex flex-wrap gap-2 p-4 pb-3 flex-shrink-0">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selectedCategory === category
                    ? "bg-[#5697B0] text-white"
                    : "bg-white text-gray-600 hover:bg-gray-50 border border-gray-200"
                    }`}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* 아이템 그리드 (2열) */}
            <div className="flex-1 overflow-auto px-4 pb-4">
              <div className="grid grid-cols-2 gap-3">
                {filteredItems.map((item) => {
                  const koreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
                  const isInSlot =
                    fittingSlots.상의 === item.id ||
                    fittingSlots.하의 === item.id ||
                    fittingSlots.아우터 === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => setMobileSelectedItemId(mobileSelectedItemId === item.id ? null : item.id)}
                      className={`bg-white rounded-xl p-2.5 transition-all ${isInSlot
                        ? "ring-2 ring-[#5697B0] bg-blue-50"
                        : "shadow hover:shadow-md"
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

                        {/* 모바일 오버레이 */}
                        {mobileSelectedItemId === item.id && (
                          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-2 p-2 animate-fadeIn">
                            {/* 피팅에 추가/제거 버튼 */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleItemClick(item);
                                setMobileSelectedItemId(null);
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
                                  setMobileSelectedItemId(null);
                                }}
                                className="w-full px-3 py-2 bg-white text-gray-800 rounded-lg text-xs font-medium hover:bg-gray-100 transition"
                              >
                                구매 링크 방문
                              </button>
                            )}
                          </div>
                        )}

                        {isInSlot && mobileSelectedItemId !== item.id && (
                          <div className="absolute top-1 right-1 w-6 h-6 bg-[#5697B0] rounded-full flex items-center justify-center text-white text-xs">
                            ✓
                          </div>
                        )}
                      </div>

                      {/* 아이템 정보 */}
                      <p className="text-[10px] text-gray-400 mb-0.5">{item.brand || "BRAND"}</p>
                      <p className="font-medium text-gray-800 text-xs truncate leading-tight">{item.name}</p>
                      {item.price && (
                        <p className="text-[#5697B0] font-bold text-xs mt-1">
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
                    <p className="text-4xl mb-2">📦</p>
                    <p className="text-sm">이 카테고리에 저장된 아이템이 없어요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* 아이템 선택 모달 (전역 배치) */}
      <ItemSelector
        isOpen={isSelectorOpen}
        onClose={() => setIsSelectorOpen(false)}
        category={activeSlot || ""}
        items={closetItems.filter(item => {
          if (!activeSlot) return false;
          const itemKoreanCategory = CATEGORY_MAP_REVERSE[item.category as FittingCategory];
          return itemKoreanCategory === activeSlot;
        })}
        onSelect={handleSelectorSelect}
      />
    </div>
  );
}