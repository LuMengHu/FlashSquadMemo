'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, User } from 'lucide-react'; // 使用 lucide-react 图标库

// 再次定义席位类型，保持代码清晰
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
  const [teamName, setTeamName] = useState<string>('');

  useEffect(() => {
    // 这个 effect 只在组件加载到浏览器后运行一次
    // 这是从 localStorage 读取数据的安全位置
    const storedSeats = localStorage.getItem('memberSeats');
    const storedTeamInfo = localStorage.getItem('teamInfo');

    if (storedSeats && storedTeamInfo) {
      try {
        setSeats(JSON.parse(storedSeats));
        setTeamName(JSON.parse(storedTeamInfo).name);
      } catch (error) {
        console.error('Failed to parse data from localStorage', error);
        // 如果数据损坏，可以引导用户重新登录
        router.push('/team/login');
      }
    } else {
      // 如果 localStorage 中没有需要的数据，说明用户未登录或数据已丢失
      console.log('No seat or team info found, redirecting to login.');
      router.push('/team/login');
    }
  }, [router]); // 添加 router 作为依赖项

  const handleSeatSelection = (memberId: string, bankId: string) => {
    // 1. 将用户选择的 memberId 存入 localStorage，供后续页面使用
    localStorage.setItem('selectedMemberId', memberId);

    // 2. 跳转到具体的答题页面
    // 我们约定答题页面的路由是 /quiz/[quizId]
    // 现在，我们先跳转到一个统一的入口，例如 /quiz
    // 稍后我们会构建这个页面，它会根据选择的席位加载正确的题目
    router.push(`/quiz/${bankId}`);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <div className="w-full max-w-2xl p-8 space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800">欢迎，{teamName}！</h1>
          <p className="mt-2 text-lg text-gray-600">请选择你的学习席位进入背题</p>
        </div>
        <div className="text-center border-t border-b py-6 border-gray-200">
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {seats.length > 0 ? (
            seats.map((seat) => (
              <button
                key={seat.memberId}
                onClick={() => handleSeatSelection(seat.memberId, seat.assignedQuestionBank.id)}
                className="group flex flex-col items-center justify-center p-6 bg-white rounded-xl shadow-lg hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 ease-in-out cursor-pointer border-t-4 border-transparent hover:border-indigo-500"
              >
                <div className="p-4 bg-indigo-100 rounded-full">
                  <BookOpen className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-gray-800 text-center">
                  {seat.assignedQuestionBank.name}
                </h3>
              </button>
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500">正在加载席位信息...</p>
          )}
        </div>
      </div>
    </div>
  );
}
