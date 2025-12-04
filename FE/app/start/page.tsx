"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { login, signup } from "@/lib/auth";

export default function StartPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  
  // 폼 상태
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"male" | "female" | "">("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 설명서 페이지 내용 (4페이지)
  const guidePages = [
    { title: "Welcome to Swell", desc: "swell에 방문하신 모두를 환영합니다" },
    { title: "스와이프하며 코디 구경", desc: "마음에 드는 코디를 좌우로 넘기며 탐색해보세요!" },
    { title: "Find your Shell", desc: "이 뿐만 아니라, 당신이 고른 상품을 AI를 통해 입어볼 수도 있습니다. 매장에 방문하지 않고서도 말이죠!" },
    { title: "", desc: "swell에 가입하고, 이 놀라운 서비스를 직접 경험해보세요!" },
  ];

  // 로그인 처리
  const handleLogin = async () => {
    setError("");
    setLoading(true);
    
    try {
      const response = await login({ email, password });
      
      // 성공 시 온보딩 여부 확인
      if (response.data.user.hasCompletedOnboarding) {
        router.push("/main");
      } else {
        router.push("/onboarding");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "로그인에 실패했습니다";
      setError(errorMessage);
      console.error("로그인 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  // 회원가입 처리
  const handleSignup = async () => {
    setError("");

    if (!email || !password || !confirmPassword || !name || !gender) {
      setError("모든 항목을 입력해주세요");
      return;
    }

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다");
      return;
    }

    if (password !== confirmPassword) {
      setError("비밀번호가 일치하지 않습니다");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("올바른 이메일 형식이 아닙니다");
      return;
    }

    setLoading(true);

    try {
      await signup({ email, password, name, gender });

      setIsLogin(true);
      setError("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setName("");
      setGender("");
      alert("회원가입이 완료되었습니다! 로그인해주세요.");
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || "회원가입에 실패했습니다";
      setError(errorMessage);
      console.error("회원가입 에러:", err);
    } finally {
      setLoading(false);
    }
  };

  // Enter 키로 제출
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      if (isLogin) {
        handleLogin();
      } else {
        handleSignup();
      }
    }
  };

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/start_bg.png')" }}
    >
      <div className="flex gap-6 max-w-[1200px] mx-auto">
        
        {/* 왼쪽 영역 */}
        <div className="flex flex-col gap-6 w-[500px] h-[660px]">

          {/* 로그인/회원가입 카드 */}
          <div
            className={`rounded-[10px] p-8 flex flex-col transition-all duration-1000 ease-in-out ${
              isLogin ? 'flex-1' : 'h-[660px]'
            }`}
            style={{ backgroundColor: "rgba(86, 151, 176, 0.37)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-[32px] leading-[48px] text-black font-snippet">
                Swell
              </h1>
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setEmail("");
                  setPassword("");
                  setConfirmPassword("");
                  setName("");
                  setGender("");
                }}
                className="text-black text-[14px] leading-[20px] hover:opacity-70 transition-opacity"
              >
                {isLogin ? "sign up" : "login"}
              </button>
            </div>

            {isLogin ? (
              // 로그인 폼
              <div className="space-y-4">
                {error && (
                  <p className="text-red-500 text-sm text-left px-1">
                    {error}
                  </p>
                )}
                
                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <input
                    type="email"
                    placeholder="e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                    <input
                      type="password"
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                    />
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-9 h-[43.2px] bg-black rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-black mt-4 text-[14px] leading-[20px]">
                  Find your swell!
                </p>
              </div>
            ) : (
              // 회원가입 폼
              <div className="space-y-4">
                {error && (
                  <p className="text-red-500 text-sm text-left px-1">
                    {error}
                  </p>
                )}

                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <input
                    type="email"
                    placeholder="e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                  />
                </div>
                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                  />
                </div>
                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <input
                    type="password"
                    placeholder="confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                  />
                </div>
                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <input
                    type="text"
                    placeholder="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[14px] placeholder:text-[#6a7282]"
                  />
                </div>
                <div className="border border-black rounded-[4px] h-[43.2px] flex items-center px-4">
                  <div className="flex gap-8 w-full justify-center">
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[13px]">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
                      <input
                        type="radio"
                        name="gender"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                        className="w-4 h-4 cursor-pointer"
                      />
                      <span className="text-[13px]">Female</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-9 h-9 bg-black rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-50 transition-opacity"
                  >
                    {loading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-black text-[14px] leading-[20px]">
                  join your swell!
                </p>
              </div>
            )}
          </div>

          {/* 프로모 카드 - 로그인 시에만 표시 */}
          <div
            className={`rounded-[10px] flex items-center justify-center transition-all duration-500 ease-in-out overflow-hidden ${
              isLogin ? 'flex-1 min-h-[200px] opacity-100' : 'h-0 opacity-0'
            }`}
            style={{ backgroundColor: "rgba(255, 244, 234, 0.6)" }}
          >
            <p className="text-gray-400 text-sm">Promo Area</p>
          </div>
        </div>

        {/* 오른쪽 - 설명서 카드 */}
        <div className="w-[500px] h-[660px]">
          <div 
            className="rounded-[10px] h-full p-8 flex flex-col"
            style={{ backgroundColor: "rgba(255, 244, 234, 0.9)" }}
          >
            <p className="text-right text-[#6a7282] text-[12px] leading-[16px] mb-4">
              Page {currentPage + 1} of {guidePages.length}
            </p>
            
            <div
              className={`flex-1 flex flex-col items-center text-center ${
                currentPage === 3 ? "justify-center" : "justify-start pt-20"
              }`}
            >
              {currentPage === 1 ? (
                // 2페이지: 서비스 소개
                <>
                  {/* 제목 영역 - 높이 고정 */}
                  <div className="h-[36px] mb-10 flex items-center">
                    <h2 className="text-[20px] leading-[28px] text-[#1e2939]">
                      Find your Swell
                    </h2>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <p className="text-[14px] leading-[24px] text-[#4a5565]">
                      스윕과 함께 당신의 취향을 발견하고,
                    </p>
                    <Image
                      src="/images/finger.png"
                      alt="Swipe finger"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                    <p className="text-[14px] leading-[24px] text-[#4a5565]">
                      좋아요 버튼을 눌러 이것을 기록해보세요 !
                    </p>
                    <Image
                      src="/images/heart.png"
                      alt="Heart"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                  </div>
                </>
              ) : currentPage === 2 ? (
                // 3페이지
                <>
                  {/* 제목 영역 - 높이 고정 */}
                  <div className="h-[36px] mb-10 flex items-center">
                    <h2 className="text-[20px] leading-[28px] text-[#1e2939]">
                      Join your Swell
                    </h2>
                  </div>
                  <div className="flex flex-col items-center gap-6">
                    <p className="text-[14px] leading-[24px] text-[#4a5565]">
                      당신이 고른 상품을 AI를 통해 입어볼 수도 있습니다.
                    </p>
                    <p className="text-[14px] leading-[24px] text-[#4a5565]">
                      매장에 방문하지 않고서도 말이죠!
                    </p>
                    <Image
                      src="/images/mirror.png"
                      alt="Virtual fitting"
                      width={220}
                      height={160}
                      className="object-contain mt-4"
                    />
                  </div>
                </>
              ) : currentPage === 3 ? (
                // 4페이지: 가입 유도 문구만 중앙 배치 (한글이므로 기본 폰트 사용)
                <p className="text-[14px] leading-[24px] text-[#4a5565]">
                  {guidePages[currentPage].desc}
                </p>
              ) : (
                // 1페이지: 기본 인트로
                <>
                  {/* 제목 영역 - 높이 고정 */}
                  <div className="h-[36px] mb-10 flex items-center">
                    <h2 className="text-[20px] leading-[28px] text-[#1e2939]">
                      {guidePages[currentPage].title}
                    </h2>
                  </div>
                  <p className="text-[14px] leading-[24px] text-[#4a5565] mb-10">
                    {guidePages[currentPage].desc}
                  </p>
                  {currentPage === 0 && (
                    <div className="w-[230px] h-[230px] flex items-center justify-center">
                      <Image
                        src="/images/swell_wo_bg.png"
                        alt="Swell Logo"
                        width={230}
                        height={230}
                        className="object-contain"
                      />
                    </div>
                  )}
                </>
              )}
            </div>

            {/* 페이지 네비게이션 */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="w-9 h-9 bg-[#101828] rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-30 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M10 12L6 8L10 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="flex gap-2">
                {guidePages.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === currentPage ? "bg-[#101828]" : "bg-[#d1d5dc]"
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(guidePages.length - 1, currentPage + 1))}
                disabled={currentPage === guidePages.length - 1}
                className="w-9 h-9 bg-[#101828] rounded-full flex items-center justify-center hover:opacity-80 disabled:opacity-30 transition-opacity"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}