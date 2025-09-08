// app/team/login/page.tsx

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation'; // 用于页面跳转
import Cookies from 'js-cookie'; // 用于操作 Cookie

export default function TeamLoginPage() {
  const router = useRouter();
  
  // 表单状态
  const [teamName, setTeamName] = useState('');
  const [password, setPassword] = useState('');
  
  // UI 状态
  const [isLoading, setIsLoading] = useState(false); // 防止重复提交
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // 1. 发送请求到我们的 API
      const response = await fetch('/api/auth/team/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ teamName, password }),
      });

      // 2. 解析返回的 JSON 数据
      const data = await response.json();

      // 3. 处理 API 返回的错误
      if (!response.ok) {
        // 如果响应状态不是 2xx, 抛出错误，错误信息来自后端
        throw new Error(data.error || '登录时发生未知错误');
      }

      // 4. 处理成功逻辑
      setSuccess('登录成功！正在跳转...');
      
      // 将 token 存储到 Cookie 中，有效期为 7 天
      Cookies.set('token', data.token, { expires: 7, path: '/' });

      // 延迟 1 秒后跳转到成员选择页面
      setTimeout(() => {
        router.push('/'); // 暂时先跳转到首页，下一步我们再创建成员选择页
      }, 1000);

    } catch (err: any) {
      // 5. 捕获并显示任何发生的错误
      setError(err.message);
    } finally {
      // 6. 无论成功或失败，最后都结束加载状态
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-900 text-white">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-lg">
        <h1 className="mb-6 text-center text-3xl font-bold">战队登录</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ... 输入框部分代码和之前完全一样，这里省略以便聚焦 ... */}
          <div>
            <label htmlFor="teamName" className="block text-sm font-medium text-gray-300">战队名称</label>
            <input id="teamName" name="teamName" type="text" required value={teamName} onChange={(e) => setTeamName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="请输入战队名称" />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">密码</label>
            <input id="password" name="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full rounded-md border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-indigo-500" placeholder="请输入密码" />
          </div>
          
          {/* 状态信息显示区域 */}
          {error && <p className="text-sm text-red-500 text-center">{error}</p>}
          {success && <p className="text-sm text-green-500 text-center">{success}</p>}

          <div>
            <button
              type="submit"
              disabled={isLoading} // 当正在加载时，禁用按钮
              className="flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? '登录中...' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
