'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface MemberSeat {
  memberId: string;
  assignedQuestionBank: {
    id: string;
    name: string;
  };
}

export default function LoginPage() {
  const router = useRouter();
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/team/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed. Please try again.');
      }

      localStorage.setItem('authToken', data.token);
      localStorage.setItem('teamInfo', JSON.stringify({ id: data.team.id, name: data.team.name }));
      localStorage.setItem('memberSeats', JSON.stringify(data.members));

      router.push('/team/select-seat');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // UI Change: 更柔和的背景色
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      {/* UI Change: 增加圆角和阴影 */}
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-2xl shadow-lg">
        <h2 className="text-3xl font-bold text-center text-gray-900">
          团队登录
        </h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="teamName"
              className="block text-sm font-medium text-gray-700"
            >
              团队名称
            </label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              // UI Change: 增加圆角、调整边框和文字颜色
              className="block w-full px-4 py-3 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如：雷火队"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              团队密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              // UI Change: 统一输入框样式
              className="block w-full px-4 py-3 mt-1 text-gray-900 placeholder-gray-400 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="例如：password123"
            />
          </div>

          {error && (
            <div className="p-3 text-sm font-semibold text-red-800 bg-red-100 rounded-lg">
              {error}
            </div>
          )}

          <div>
            {/* UI Change: 调整按钮样式，增加过渡效果 */}
            <button
              type="submit"
              disabled={isLoading}
              className="flex justify-center w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 transition-colors duration-200"
            >
              {isLoading ? '登录中...' : '登 录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
