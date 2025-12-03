"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { submitOnboarding } from "@/lib/user";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading } = useAuth(true);
  
  const [step, setStep] = useState(1);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedCoordis, setSelectedCoordis] = useState<number[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // 임시 태그 목록 (나중에 API에서 받아옴)
  const tags = [
    { id: 1, name: "#캐주얼" },
    { id: 2, name: "#미니멀" },
    { id: 3, name: "#스트릿" },
    { id: 4, name: "#스포티" },
    { id: 5, name: "#빈티지" },
    { id: 6, name: "#모던" },
    { id: 7, name: "#클래식" },
    { id: 8, name: "#유니크" },
    { id: 9, name: "#심플" },
    { id: 10, name: "#화려한" },
    { id: 11, name: "#편안한" },
    { id: 12, name: "#세련된" },
    { id: 13, name: "#개성있는" },
    { id: 14, name: "#트렌디" },
    { id: 15, name: "#베이직" },
  ];

  // 임시 코디 목록 (나중에 API에서 받아옴)
  const coordis = [
    { id: 1, imageUrl: "/coordi-1.jpg" },
    { id: 2, imageUrl: "/coordi-2.jpg" },
    { id: 3, imageUrl: "/coordi-3.jpg" },
    { id: 4, imageUrl: "/coordi-4.jpg" },
    { id: 5, imageUrl: "/coordi-5.jpg" },
  ];

  // 태그 선택/해제
  const toggleTag = (tagId: number) => {
    if (selectedTags.includes(tagId)) {
      setSelectedTags(selectedTags.filter((id) => id !== tagId));
    } else if (selectedTags.length < 10) {
      setSelectedTags([...selectedTags, tagId]);
    }
  };

  // 코디 선택/해제
  const toggleCoordi = (coordiId: number) => {
    if (selectedCoordis.includes(coordiId)) {
      setSelectedCoordis(selectedCoordis.filter((id) => id !== coordiId));
    } else {
      setSelectedCoordis([...selectedCoordis, coordiId]);
    }
  };

  // 다음 단계
  const handleNext = () => {
    if (step === 1) {
      if (selectedTags.length < 3) {
        setError("최소 3개의 태그를 선택해주세요");
        return;
      }
      setError("");
      setStep(2);
    }
  };

  // 제출
  const handleSubmit = async () => {
    if (selectedCoordis.length !== 5) {
      setError("정확히 5개의 코디를 선택해주세요");
      return;
    }

    setSubmitting(true);
    try {
      const response = await submitOnboarding({
        tagIds: selectedTags,
        coordiIds: selectedCoordis,
      });

      if (response.success) {
        router.push("/main");
      } else {
        setError(response.error?.message || "제출에 실패했습니다");
      }
    } catch (err) {
      setError("제출에 실패했습니다");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-2xl p-8">
        
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">
            {step === 1 ? "당신의 스타일을 알려주세요!" : "어떤 코디가 마음에 드시나요?"}
          </h1>
          <p className="text-gray-500">
            {step === 1 
              ? `관심 있는 스타일 태그를 선택해주세요 (${selectedTags.length}/10, 최소 3개)`
              : `마음에 드는 코디를 선택해주세요 (${selectedCoordis.length}/5)`
            }
          </p>
          <p className="text-sm text-gray-400 mt-2">Step {step} / 2</p>
        </div>

        {/* Step 1: 태그 선택 */}
        {step === 1 && (
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                className={`px-4 py-2 rounded-full border transition ${
                  selectedTags.includes(tag.id)
                    ? "bg-blue-500 text-white border-blue-500"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-300"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}

        {/* Step 2: 코디 선택 */}
        {step === 2 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {coordis.map((coordi) => (
              <button
                key={coordi.id}
                onClick={() => toggleCoordi(coordi.id)}
                className={`aspect-[3/4] rounded-lg border-2 overflow-hidden transition ${
                  selectedCoordis.includes(coordi.id)
                    ? "border-blue-500 ring-2 ring-blue-200"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                {/* 임시 플레이스홀더 */}
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">코디 {coordi.id}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p className="text-red-500 text-center mb-4">{error}</p>
        )}

        {/* 버튼 */}
        <div className="flex justify-center gap-4">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="px-8 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              이전
            </button>
          )}
          <button
            onClick={step === 1 ? handleNext : handleSubmit}
            disabled={submitting}
            className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400"
          >
            {step === 1 ? "다음" : submitting ? "처리 중..." : "완료"}
          </button>
        </div>
      </div>
    </div>
  );
}