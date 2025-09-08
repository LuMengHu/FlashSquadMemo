// app/page.tsx

"use client"; // 必须是客户端组件，因为需要用到 useRouter 和 useEffect

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 这个 effect 只会在客户端运行
    const token = localStorage.getItem('token');

    if (token) {
      // 如果 token 存在，我们认为用户已登录，重定向到团队主页
      router.replace('/team');
    } else {
      // 如果 token 不存在，重定向到登录页面
      router.replace('/team/login');
    }
  }, [router]); // 依赖项数组中包含 router

  // 在 useEffect 执行重定向前，页面上可以显示一个加载状态
  // 这可以防止页面闪烁，并为用户提供反馈
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <p className="text-lg text-gray-600">正在检查登录状态，请稍候...</p>
    </div>
  );
}
