// app/api/team/me/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams, members } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { jwtVerify } from 'jose';

// 定义从 JWT 中解码出的数据结构
interface TeamPayload {
  id: string; // <-- 修正为 string
  teamName: string;
  iat: number;
  exp: number;
}

// 获取当前登录团队信息的 GET 请求处理函数
export async function GET(request: NextRequest) {
  try {
    // 1. 从请求头或 Cookie 中获取 token
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: '未授权' }, { status: 401 });
    }

    // 2. 验证并解码 token
    const secret = new TextEncoder().encode(process.env.JWT_SECRET);
    const { payload } = await jwtVerify<TeamPayload>(token, secret);
    const teamId = payload.id;

    if (!teamId) {
      return NextResponse.json({ error: '无效的 Token' }, { status: 401 });
    }

    // 3. 使用 Drizzle 查询团队信息，并同时带出其所有成员
    // 这是 Drizzle ORM 强大的关系查询功能
    const teamWithMembers = await db.query.teams.findFirst({
      where: eq(teams.id, teamId),
      with: {
        members: true, // 关键！告诉 Drizzle 把关联的 members 也查询出来
      },
    });

    if (!teamWithMembers) {
      return NextResponse.json({ error: '战队不存在' }, { status: 404 });
    }
    
    // 4. 返回成功响应
    return NextResponse.json(teamWithMembers, { status: 200 });

  } catch (error) {
    console.error('获取团队信息失败:', error);
    // 如果是 JWT 验证错误，也返回 401
    if (error instanceof Error && (error.name === 'JWTExpired' || error.name === 'JWSInvalid')) {
        return NextResponse.json({ error: 'Token 无效或已过期' }, { status: 401 });
    }
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
