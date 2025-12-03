// app/layout.tsx
import type { Metadata } from "next";
import { Snippet, Noto_Sans_KR, Abyssinica_SIL } from "next/font/google";
import "./globals.css";

// Snippet 폰트 (Swell 로고용)
const snippet = Snippet({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-snippet",
  display: "swap",
});

// Noto Sans KR (한글용 - 일반 텍스트)
const notoSansKr = Noto_Sans_KR({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-noto-sans",
  display: "swap",
});

// ✅ Abyssinica SIL 추가
const abyssinicaSil = Abyssinica_SIL({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-abyssinica",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Swell - 패션 코디 추천",
  description: "AI 기반 패션 코디 추천 및 가상 피팅 서비스",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${snippet.variable} ${notoSansKr.variable} ${abyssinicaSil.variable}`}
    >
      <body className={notoSansKr.className}>
        {children}
      </body>
    </html>
  );
}