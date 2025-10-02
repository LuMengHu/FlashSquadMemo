// app/page.tsx (完整替换)
'use client'; 

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    // 逻辑保持不变
    const token = localStorage.getItem('authToken'); 
    if (token) {
      router.replace('/team/select-seat'); 
    } else {
      router.replace('/team/login');
    }
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="flex items-center gap-3">
        <Zap className="w-10 h-10 text-indigo-500 animate-pulse" />
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100">
          Flash Squad Memo
        </h1>
      </div>
      <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
        正在加载，请稍候...
      </p>
    </div>
  );
}
