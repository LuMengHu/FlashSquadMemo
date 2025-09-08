// /middleware.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose'; // 这是一个更现代、更推荐的 JWT 验证库

// 定义我们期望从 JWT payload 中解码出的数据类型
interface UserJwtPayload {
  id: number;
  teamName: string;
  iat: number; // Issued at
  exp: number; // Expires at
}

export async function middleware(request: NextRequest) {
  // 1. 从请求头中获取 Authorization，通常格式为 "Bearer [token]"
  const authHeader = request.headers.get('Authorization');
  
  // 2. 检查是否存在，以及格式是否正确
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new NextResponse(
      JSON.stringify({ message: '未授权：缺少或格式错误的 Token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. 提取 Token 字符串
  const token = authHeader.split(' ')[1];

  // 4. 验证 Token
  try {
    // 从环境变量获取密钥，并将其编码为 Uint8Array
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);

    // 使用 jose 库的 jwtVerify 方法来验证 token
    // 这个方法会自动检查签名和过期时间
    const { payload } = await jwtVerify<UserJwtPayload>(token, secret);
    
    // 5. (可选但推荐) 将解码后的用户信息附加到请求头中
    // 这样，在最终的 API 路由处理函数中就可以直接获取用户信息，无需再次解码
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('X-User-Id', payload.id.toString());
    requestHeaders.set('X-User-TeamName', payload.teamName);
    
    // 将带有新头的请求继续传递下去
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });

  } catch (error) {
    // Token 验证失败（签名错误、过期等）
    console.error('JWT Verification Error:', error);
    return new NextResponse(
      JSON.stringify({ message: '未授权：无效的 Token' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
}

// 6. 配置 Middleware 的应用范围 (Matcher)
// 这个配置告诉 Next.js: 只有匹配到 '/api/protected/...' 路径的请求
// 才需要执行上面的 middleware 函数。
// 我们不希望登录、注册等公开接口也被它拦截。
export const config = {
  matcher: '/api/protected/:path*',
};
