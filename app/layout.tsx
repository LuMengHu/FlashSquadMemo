import type { Metadata } from "next";
// ===== 核心修正：从 next/font/google 导入 Inter 字体 =====
import { Inter } from "next/font/google";
// =======================================================
import "./globals.css";

// 使用 Inter 字体，这是 Next.js 14 项目的标配
const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "智能背题网站", // 你可以自定义网站标题
  description: "一个帮助你高效记忆题库的网站", // 你可以自定义网站描述
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      {/* ===== 核心修正：将字体应用到 body ===== */}
      <body className={inter.className}>
        {children}
      </body>
      {/* ======================================= */}
    </html>
  );
}
