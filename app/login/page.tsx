//app/login/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, LogIn } from 'lucide-react'; // 引入图标

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || '登录失败，请重试');
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('teamInfo', JSON.stringify({ id: data.team.id, name: data.team.name }));
      localStorage.setItem('memberSeats', JSON.stringify(data.members));
      router.push('/team/select-seat');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md mx-auto p-6 sm:p-8">
        {/* 网站标题 */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2">
            <Zap className="w-8 h-8 text-indigo-500" />
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 dark:text-gray-100">
              Flash Squad Memo
            </h1>
          </div>
        </div>
        
        {/* 登录卡片 */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-semibold text-center text-gray-800 dark:text-gray-200">
            团队登录
          </h2>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="teamName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                比赛名称
              </label>
              <input
                id="teamName"
                name="teamName"
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                className="block w-full px-4 py-3 mt-1 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="例如：控烟"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                密码
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 mt-1 text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-700 border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <div className="p-3 text-sm font-semibold text-center text-red-800 bg-red-100 dark:text-red-100 dark:bg-red-500/30 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400 dark:focus:ring-offset-gray-800 transition-colors duration-200"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    登录中...
                  </>
                ) : (
                  <>
                    <LogIn size={18} /> 登 录
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
