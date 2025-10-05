// app/select-seat/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Zap } from 'lucide-react'; // 引入 Zap 图标

// 再次定义席位类型
interface MemberSeat {
  memberId: string;
  assignedQuestionBank: {
    id: string;
    name: string;
  };
}

export default function SelectSeatPage() {
  const router = useRouter();
  const [seats, setSeats] = useState<MemberSeat[]>([]);

  useEffect(() => {
    const storedSeats = localStorage.getItem('memberSeats');
    if (storedSeats) {
      try {
        setSeats(JSON.parse(storedSeats));
      } catch (error) {
        console.error('Failed to parse seats from localStorage', error);
        router.push('/team/login');
      }
    } else {
      console.log('No seat info found, redirecting to login.');
      router.push('/team/login');
    }
  }, [router]);

  const handleSeatSelection = (memberId: string, bankId: string) => {
    localStorage.setItem('selectedMemberId', memberId);
    router.push(`/quiz/${bankId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-2xl mx-auto p-4 sm:p-8 space-y-8">
        {/* [修改] 网站标题部分 */}
        <div className="text-center">
          <div className="flex justify-center items-center gap-2">
            <Zap className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
              Flash Squad Memo
            </h1>
          </div>
          <p className="mt-3 text-md text-gray-500 dark:text-gray-400">
            请选择你的题库，开始高效背题
          </p>
        </div>

        {/* 分割线 */}
        <div className="border-t border-gray-200 dark:border-gray-700"></div>

        {/* 席位选择区域 */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 sm:gap-6">
          {seats.length > 0 ? (
            seats.map((seat) => (
              <button
                key={seat.memberId}
                onClick={() => handleSeatSelection(seat.memberId, seat.assignedQuestionBank.id)}
                className="group flex flex-col items-center justify-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl dark:hover:shadow-indigo-500/20 hover:-translate-y-1 transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <div className="p-3 bg-indigo-100 dark:bg-gray-700 rounded-full transition-colors duration-300 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-600">
                  <BookOpen className="w-7 h-7 text-indigo-600 dark:text-indigo-300" />
                </div>
                <h3 className="mt-4 text-md font-semibold text-gray-700 dark:text-gray-200 text-center">
                  {seat.assignedQuestionBank.name}
                </h3>
              </button>
            ))
          ) : (
            // 加载状态的骨架屏
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-md animate-pulse">
                 <div className="w-14 h-14 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                 <div className="mt-4 h-4 w-3/4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
