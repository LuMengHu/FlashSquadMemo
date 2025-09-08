// app/team/page.tsx

"use client";

import { useEffect, useState } from 'react';
import { UserIcon } from '@heroicons/react/24/solid';

// 定义更精确的类型，以匹配后端返回的新数据结构
interface QuestionBank {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface Member {
  id: string;
  name: string;
  teamId: string;
  assignedQuestionBankId: string | null;
  createdAt: string;
  assignedQuestionBank: QuestionBank | null; // <-- 新增！这里是完整的题库对象
}


export default function TeamPage() {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setLoading(true);
        const response = await fetch('/team');
        if (!response.ok) {
          throw new Error('Failed to fetch team members');
        }
        const data: Member[] = await response.json();
        setMembers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchMembers();
  }, []);

  if (loading) return <p className="text-center mt-8">Loading members...</p>;
  if (error) return <p className="text-center mt-8 text-red-500">Error: {error}</p>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center py-10">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-gray-800">欢迎, !</h1>
        <p className="text-lg text-gray-600 mt-2">请选择一位成员, 开始背题挑战。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
        {members.map((member) => (
          <div 
            key={member.id} 
            className="bg-white rounded-lg shadow-md p-6 w-72 text-center hover:shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer"
          >
            <div className="flex justify-center mb-4">
              <UserIcon className="h-16 w-16 text-indigo-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{member.name}</h2>
            
            {/* 核心改动在这里 */}
            <p className="text-gray-500 mt-2 text-sm">
              负责题库: {member.assignedQuestionBank?.name || '未分配'}
            </p>
            
          </div>
        ))}
      </div>
    </div>
  );
}
