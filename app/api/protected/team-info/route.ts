// app/api/protected/team-info/route.ts

import { NextRequest, NextResponse } from 'next/server';

// 我们只允许 GET 请求访问这个路由
export async function GET(request: NextRequest) {
  // 从请求头中获取由 middleware 附加的用户信息
  // 如果请求能到达这里，就意味着 middleware 已经成功验证了 JWT
  const userId = request.headers.get('X-User-Id');
  const teamName = request.headers.get('X-User-TeamName');

  // 作为一个保险措施，我们再次检查这些头是否存在
  if (!userId || !teamName) {
    // 理论上，如果 middleware 配置正确，代码不会执行到这里
    return new NextResponse(
      JSON.stringify({ message: '在请求头中未找到用户信息' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 如果一切正常，返回一个成功的响应，包含从 token 中解析出的用户信息
  return NextResponse.json({
    message: '成功获取受保护的数据',
    team: {
      id: userId,
      teamName: teamName,
    },
  });
}
