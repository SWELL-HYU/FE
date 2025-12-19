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
      className="relative min-h-[100dvh] flex items-center justify-center p-4 md:p-8 bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/start_bg.png')" }}
    >
      {/* 데스크톱 레이아웃 */}
      <div className="hidden md:flex gap-6 max-w-[1200px] mx-auto">

        {/* 왼쪽 영역 */}
        <div className="flex flex-col gap-6 w-[500px] h-[660px]">

          {/* 로그인/회원가입 카드 */}
          <div
            className={`rounded-[10px] p-8 flex flex-col transition-all duration-1000 ease-in-out backdrop-blur-xl shadow-2xl border border-white/40 ${isLogin ? 'flex-1' : 'h-[660px]'
              }`}
            style={{ backgroundColor: "rgba(235, 235, 230, 0.6)" }}
          >
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-[32px] leading-[48px] text-gray-900 font-outfit">
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
                className="text-gray-800 font-manrope font-semibold text-[14px] leading-[20px] hover:opacity-70 transition-opacity"
              >
                {isLogin ? "Sign up" : "Login"}
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

                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                  <input
                    type="email"
                    placeholder="e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                  />
                </div>
                <div className="flex gap-3">
                  <div className="flex-1 bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                    <input
                      type="password"
                      placeholder="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                    />
                  </div>
                  <button
                    onClick={handleLogin}
                    disabled={loading}
                    className="w-[52px] h-[52px] bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 hover:scale-105 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-gray-600 mt-6 text-[14px] leading-[20px] font-manrope opacity-80">
                  Find your swell!
                </p>
              </div>
            ) : (
              // 회원가입 폼
              <div className="space-y-3 h-[660px]">
                {error && (
                  <p className="text-red-500 text-sm text-left px-1">
                    {error}
                  </p>
                )}

                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                  <input
                    type="email"
                    placeholder="e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                  />
                </div>
                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                  <input
                    type="password"
                    placeholder="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                  />
                </div>
                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                  <input
                    type="password"
                    placeholder="confirm password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                  />
                </div>
                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6 transition-all hover:bg-white/80 focus-within:bg-white focus-within:shadow-md border border-white/20">
                  <input
                    type="text"
                    placeholder="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-transparent outline-none text-[15px] placeholder:text-gray-500/70 text-gray-800 font-manrope"
                  />
                </div>
                <div className="bg-white/60 rounded-2xl h-[52px] flex items-center px-6">
                  <div className="flex gap-8 w-full justify-center">
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                      <div className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center ${gender === "male" ? "border-black" : ""}`}>
                        {gender === "male" && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                      </div>
                      <input
                        type="radio"
                        name="gender"
                        className="hidden"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                      />
                      <span className="text-[14px] text-gray-800 font-manrope">Male</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                      <div className={`w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center ${gender === "female" ? "border-black" : ""}`}>
                        {gender === "female" && <div className="w-2.5 h-2.5 bg-black rounded-full" />}
                      </div>
                      <input
                        type="radio"
                        name="gender"
                        className="hidden"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                      />
                      <span className="text-[14px] text-gray-800 font-manrope">Female</span>
                    </label>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleSignup}
                    disabled={loading}
                    className="w-[52px] h-[52px] bg-black text-white rounded-2xl flex items-center justify-center hover:bg-gray-800 hover:scale-105 disabled:opacity-50 transition-all shadow-lg"
                  >
                    {loading ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                </div>
                <p className="text-center text-gray-600 text-[14px] leading-[20px] font-medium opacity-80 font-manrope">
                  join your swell!
                </p>
              </div>
            )}
          </div>

          {/* 프로모 카드 - Dark Glass for Contrast */}
          <div
            className={`rounded-[10px] flex flex-col p-6 transition-all duration-500 ease-in-out overflow-hidden backdrop-blur-2xl shadow-2xl border border-white/10 ${isLogin ? 'flex-1 min-h-[200px] opacity-100' : 'h-0 opacity-0'
              }`}
            style={{ backgroundColor: "rgba(20, 24, 28, 0.9)" }}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-white/60 font-outfit text-sm">New In</span>
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            </div>
            <h3 className="text-white font-outfit text-2xl font-bold mb-1">
              Swell<br />Archive
            </h3>
            <p className="text-white/40 text-xs font-manrope mt-auto">
              Discover the latest collection &rarr;
            </p>
          </div>
        </div>

        {/* 오른쪽 - 설명서 카드 (Soft Champagne) */}
        <div className="w-[500px] h-[660px]">
          <div
            className="rounded-[10px] h-full p-10 flex flex-col backdrop-blur-3xl shadow-2xl border border-white/50 justify-between"
            style={{ backgroundColor: "rgba(253, 249, 247, 0.9)" }}
          >
            {/* Background Decor - Massive Number */}
            <div className="absolute top-0 right-0 p-4 overflow-hidden pointer-events-none select-none">
              <span className="text-[180px] leading-none font-bold font-outfit text-black/[0.03] tracking-tighter -mr-10 -mt-10 block">
                0{currentPage + 1}
              </span>
            </div>

            {/* Background Decor - Soft Gradient Blob */}
            <div className={`absolute top-1/3 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-gradient-to-tr from-orange-100/60 to-rose-100/40 blur-3xl pointer-events-none transition-all duration-700 ${currentPage % 2 === 0 ? 'scale-100 opacity-70' : 'scale-110 opacity-50'}`} />

            {/* 상단 페이지 표시 - Minimal */}
            <div className="flex justify-between items-start relative z-10">
              <div className="h-1 w-10 bg-black rounded-full" />
              {/* Decorative line instead of just text */}
            </div>

            {/* 메인 컨텐츠 영역 - Left Aligned & Asymmetric */}
            <div className="flex-1 flex flex-col justify-center relative z-10 pl-4">
              {currentPage === 0 && (
                <div className="flex flex-col animate-fadeIn">
                  <h2 className="text-[56px] leading-[1.1] font-bold text-gray-900 font-outfit mb-6 tracking-tight">
                    Welcome<br />
                    <span className="text-gray-400">to Swell.</span>
                  </h2>
                  <p className="text-[16px] text-gray-600 font-manrope leading-relaxed max-w-[280px] mb-10 pl-1 border-l-2 border-gray-200">
                    당신의 취향을 발견하세요<br />
                    Start your fashion journey.
                  </p>
                  <div className="w-[120px] h-[120px] relative drop-shadow-2xl self-end mr-8">
                    <Image
                      src="/images/swell_wo_bg.png"
                      alt="Swell Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              )}

              {currentPage === 1 && (
                <div className="flex flex-col animate-fadeIn w-full relative">
                  <div className="absolute -right-4 top-0 w-32 h-32 bg-gray-100 rounded-full -z-10" />

                  <h2 className="text-[42px] font-bold text-gray-900 font-outfit mb-2">
                    Swipe<br />
                    <span className="font-light italic">& Like</span>
                  </h2>

                  <div className="flex gap-4 mb-4 mt-8">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg transform -rotate-3 hover:rotate-0 transition-transform">
                      <Image src="/images/finger.png" alt="Swipe" width={32} height={32} className="object-contain" />
                    </div>
                    <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center shadow-lg transform translate-y-4 hover:translate-y-2 transition-transform">
                      <Image src="/images/heart.png" alt="Like" width={32} height={32} className="object-contain invert brightness-0" />
                    </div>
                  </div>

                  <p className="text-[15px] text-gray-600 font-manrope leading-relaxed max-w-[260px] mt-8">
                    스왑으로 코디를 구경하며,<br />
                    마음에 드는 코디를 저장하세요!

                  </p>
                </div>
              )}

              {currentPage === 2 && (
                <div className="flex flex-col animate-fadeIn">
                  <h2 className="text-[42px] font-bold text-gray-900 font-outfit mb-4 text-right pr-4">
                    Virtual<br />Fitting
                  </h2>

                  <div className="relative w-full h-[220px] mb-6">
                    <div className="absolute right-10 top-10 w-40 h-40 border-2 border-gray-200 rounded-full" />
                    <div className="absolute left-4 top-0 w-[240px] h-[200px] drop-shadow-2xl transform hover:scale-105 transition-transform duration-500">
                      <Image
                        src="/images/mirror.png"
                        alt="Virtual Fitting"
                        fill
                        className="object-contain"
                      />
                    </div>
                  </div>

                  <p className="text-[15px] text-gray-600 font-manrope leading-relaxed text-right pr-4">
                    swell의 가상 피팅 AI로<br />
                    매장 방문 없이도 옷을 입어보세요!
                  </p>
                </div>
              )}

              {currentPage === 3 && (
                <div className="flex flex-col animate-fadeIn pl-2">
                  <div className="w-12 h-12 bg-black rounded-full flex items-center justify-center mb-6 shadow-xl">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h2 className="text-[48px] font-bold text-gray-900 font-outfit mb-4 leading-tight">
                    Ready<br />to Start?
                  </h2>
                  <p className="text-[16px] text-gray-500 font-manrope leading-relaxed mb-10">
                    <br />

                  </p>
                  <button
                    onClick={() => setIsLogin(false)}
                    className="w-fit px-8 py-4 bg-black text-white rounded-full font-manrope font-bold text-sm hover:scale-105 transition-all shadow-xl flex items-center gap-3 group"
                  >
                    Join to swell
                    <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M1 11L11 1M11 1H3M11 1V9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* 하단 네비게이션 - Minimal Dots */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200/30 relative z-10">
              <div className="flex gap-4">
                {guidePages.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i)}
                    className={`transition-all duration-300 ${i === currentPage ? "w-8 h-1.5 bg-black rounded-full" : "w-1.5 h-1.5 bg-gray-300 rounded-full hover:bg-gray-400"
                      }`}
                  />
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 hover:bg-black hover:text-white hover:border-black disabled:opacity-0 transition-all text-gray-600"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18L9 12L15 6" />
                  </svg>
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(guidePages.length - 1, currentPage + 1))}
                  disabled={currentPage === guidePages.length - 1}
                  className="w-10 h-10 rounded-full flex items-center justify-center border border-gray-200 hover:bg-black hover:text-white hover:border-black disabled:opacity-0 transition-all text-gray-600"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18L15 12L9 6" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 모바일 레이아웃 */}
      <div className="md:hidden absolute inset-0 flex flex-col justify-center px-6 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        <div className="w-full max-w-[300px] mx-auto animate-fadeIn">
          {/* 헤더 */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-[28px] font-bold text-gray-900 font-outfit tracking-tight drop-shadow-md">
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
              className="text-gray-900 font-semibold text-[13px] hover:opacity-70 transition-opacity"
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </div>

          {isLogin ? (
            // 모바일 로그인 폼
            <div className="space-y-4">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 backdrop-blur-sm">
                  <p className="text-red-700 text-[11px] font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[44px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] focus:ring-2 focus:ring-[#5697B0]/30 transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[44px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] focus:ring-2 focus:ring-[#5697B0]/30 transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />
              </div>

              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full h-[44px] bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-900 disabled:opacity-50 transition-all shadow-lg text-[14px] font-bold mt-3 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Login"
                )}
              </button>

              <p className="text-center text-gray-800 mt-5 text-[12px] font-medium tracking-wide drop-shadow-sm">
                Find your swell!
              </p>
            </div>
          ) : (
            // 모바일 회원가입 폼
            <div className="space-y-3">
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-2 backdrop-blur-sm">
                  <p className="text-red-700 text-[11px] font-medium text-center">
                    {error}
                  </p>
                </div>
              )}

              <div className="space-y-2.5">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[42px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />

                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[42px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />

                <input
                  type="password"
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[42px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />

                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full h-[42px] px-4 bg-white/70 border border-white/40 rounded-xl outline-none text-gray-900 placeholder:text-gray-500/80 focus:bg-white/90 focus:scale-[1.02] transition-all shadow-md backdrop-blur-sm font-medium text-[13px]"
                />

                <div className="h-[42px] px-4 bg-white/50 border border-white/30 rounded-xl flex items-center justify-center backdrop-blur-sm shadow-sm">
                  <div className="flex gap-6">
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${gender === 'male' ? 'border-gray-900' : 'border-gray-500'}`}>
                        {gender === 'male' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                      </div>
                      <input
                        type="radio"
                        name="gender-mobile"
                        className="hidden"
                        checked={gender === "male"}
                        onChange={() => setGender("male")}
                      />
                      <span className={`text-[12px] font-medium transition-colors ${gender === 'male' ? 'text-gray-900' : 'text-gray-700'}`}>Male</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer group">
                      <div className={`w-3.5 h-3.5 rounded-full border-[1.5px] flex items-center justify-center transition-colors ${gender === 'female' ? 'border-gray-900' : 'border-gray-500'}`}>
                        {gender === 'female' && <div className="w-2 h-2 bg-gray-900 rounded-full" />}
                      </div>
                      <input
                        type="radio"
                        name="gender-mobile"
                        className="hidden"
                        checked={gender === "female"}
                        onChange={() => setGender("female")}
                      />
                      <span className={`text-[12px] font-medium transition-colors ${gender === 'female' ? 'text-gray-900' : 'text-gray-700'}`}>Female</span>
                    </label>
                  </div>
                </div>
              </div>

              <button
                onClick={handleSignup}
                disabled={loading}
                className="w-full h-[44px] bg-black text-white rounded-xl flex items-center justify-center hover:bg-gray-900 disabled:opacity-50 transition-all shadow-lg text-[14px] font-bold mt-3 active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </button>

              <p className="text-center text-gray-800 mt-4 text-[12px] font-medium tracking-wide drop-shadow-sm">
                join your swell!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}