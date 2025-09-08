// app/page.tsx

'use client'; // 标记为客户端组件，因为我们需要使用 useEffect, useState, useRouter

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Cookies from 'js-cookie';

// 定义我们从 API 获取的数据类型，这对于 TypeScript 非常重要
interface Member {
  id: string; // <-- 修正
  name: string;
  assignedQuestionBankId: string | null; // <-- 修正 (在 schema 中它可能为 null)
}

interface TeamData {
  id:string; // <-- 修正
  teamName: string;
  members: Member[];
}

export default function DashboardPage() {
  const router = useRouter();

  // 状态管理
  const [teamData, setTeamData] = useState<TeamData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // 定义一个异步函数来获取数据
    const fetchTeamData = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await fetch('/api/team/me'); // 使用相对路径调用我们的 API

        if (!response.ok) {
          // 如果 token 失效或未登录，API 会返回 401
          if (response.status === 401) {
            // 清除可能存在的无效 cookie 并跳转到登录页
            Cookies.remove('token');
            router.push('/team/login');
            return; // 提前退出，避免后续操作
          }
          const errorData = await response.json();
          throw new Error(errorData.error || '获取团队数据失败');
        }

        const data: TeamData = await response.json();
        setTeamData(data);

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTeamData();
  }, [router]); // 依赖项数组中加入 router

  // 点击成员卡片的处理函数
  const handleMemberClick = (member: Member) => {
    // 存储选中的成员信息到 localStorage，以便下一个页面使用
    // localStorage 是一种浏览器本地存储，比 URL 参数更适合存储稍复杂的信息
    localStorage.setItem('selectedMember', JSON.stringify(member));
    
    // 跳转到背题页面，URL 中可以带上成员 ID 和题库 ID
    // 我们将在下一步创建这个页面
    router.push(`/practice?memberId=${member.id}&bankId=${member.assignedQuestionBankId}`);
  };

  // ----- UI 渲染部分 -----

  // 1. 加载中状态
  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-xl">正在加载团队数据...</p>
      </main>
    );
  }

  // 2. 错误状态
  if (error) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <p className="text-xl text-red-500">错误: {error}</p>
          <button 
            onClick={() => router.push('/team/login')}
            className="mt-4 rounded bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700"
          >
            返回登录
          </button>
        </div>
      </main>
    );
  }

  // 3. 成功获取数据状态
  if (teamData) {
    return (
      <main className="flex min-h-screen flex-col items-center bg-slate-100 p-8">
        <div className="w-full max-w-4xl text-center">
          <h1 className="mb-2 text-4xl font-bold text-gray-800">
            欢迎, {teamData.teamName}!
          </h1>
          <p className="mb-10 text-lg text-gray-600">
            请选择一位成员，开始背题挑战。
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {teamData.members.map((member) => (
              <div
                key={member.id}
                onClick={() => handleMemberClick(member)}
                className="transform cursor-pointer rounded-lg bg-white p-6 text-center shadow-md transition-all duration-300 hover:scale-105 hover:shadow-xl hover:bg-blue-50"
              >
                <div className="mb-4 text-5xl">👤</div> {/* 简单的成员图标 */}
                <h2 className="text-2xl font-semibold text-gray-900">{member.name}</h2>
                <p className="mt-2 text-sm text-gray-500">
                  负责题库: #{member.assignedQuestionBankId}
                </p>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  // 默认返回 null 或一个备用 UI
  return null;
}
