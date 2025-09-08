// app/team/login/page.tsx

'use client'; // 标记这是一个客户端组件，因为它需要处理用户交互

import { useState } from 'react';

export default function TeamLoginPage() {
  // 使用 useState 来管理表单输入框的状态
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // 用于显示登录错误信息

  // 表单提交处理函数
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // 阻止表单默认的刷新页面行为
    setError(''); // 清空之前的错误信息

    // --- 临时占位 ---
    // 在下一步，我们将在这里添加调用 API 的逻辑
    console.log('准备提交的数据:', { teamName, password });
    // --- 临时占位结束 ---
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">战队登录</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label 
              htmlFor="teamName" 
              className="block text-sm font-medium text-gray-300"
            >
              战队名称
            </label>
            <input
              id="teamName"
              name="teamName"
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="请输入战队名称"
            />
          </div>
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium text-gray-300"
            >
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500"
              placeholder="请输入密码"
            />
          </div>
          {/* 如果有错误信息，就显示在这里 */}
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div>
            <button
              type="submit"
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              登录
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
