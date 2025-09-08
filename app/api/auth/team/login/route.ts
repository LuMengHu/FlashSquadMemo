// app/api/auth/team/login/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams } from '@/lib/schema'; 
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { teamName, password } = body;

    if (!teamName || !password) {
      // 保持你之前的中文提示
      return new NextResponse('团队名和密码不能为空', { status: 400 });
    }

    // 1. 根据团队名查询数据库
    // 修正: 使用 teams.name 字段进行查询
    const teamResult = await db.select().from(teams).where(eq(teams.name, teamName)).limit(1);

    if (teamResult.length === 0) {
      // 保持你之前的中文提示
      return new NextResponse('团队不存在', { status: 404 });
    }

    const foundTeam = teamResult[0];

    // 2. 验证密码
    // 修正: 从 foundTeam.passwordHash 中获取密码哈希
    const isPasswordCorrect = await bcrypt.compare(password, foundTeam.passwordHash);

    if (!isPasswordCorrect) {
      // 保持你之前的中文提示
      return new NextResponse('密码错误', { status: 401 });
    }

    // 3. 密码验证成功，生成 JWT
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.error('JWT_SECRET is not defined in .env file');
      // 保持你之前的中文提示
      return new NextResponse('服务器内部错误', { status: 500 });
    }

    // JWT Payload 中使用 teamName 是正确的，但来源是 foundTeam.name
    const payload = {
      id: foundTeam.id,
      teamName: foundTeam.name, // 修正: 使用 foundTeam.name
    };

    const token = jwt.sign(payload, jwtSecret, {
      expiresIn: '7d', 
    });

    // 4. 将 JWT 和一些团队信息一起返回给前端
    return NextResponse.json({
      message: '登录成功',
      team: {
        id: foundTeam.id,
        teamName: foundTeam.name, // 修正: 使用 foundTeam.name
        createdAt: foundTeam.createdAt,
      },
      token: token,
    });

  } catch (error) {
    console.error('[TEAM_LOGIN_API]', error);
    // 保持你之前的中文提示
    return new NextResponse('服务器内部错误', { status: 500 });
  }
}
