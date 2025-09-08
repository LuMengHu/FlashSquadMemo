import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { teams, members, questionBanks } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';

// 从环境变量获取 JWT 密钥
function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set in the environment variables.');
  }
  return new TextEncoder().encode(secret);
}

// 定义 API 的 POST 方法
export async function POST(req: NextRequest) {
  try {
    const { teamName, password } = await req.json();

    if (!teamName || !password) {
      return NextResponse.json(
        { error: 'Team name and password are required.' },
        { status: 400 }
      );
    }

    // 1. 根据 teamName 查找团队
    const team = await db.query.teams.findFirst({
      where: eq(teams.name, teamName),
    });

    if (!team) {
      return NextResponse.json({ error: 'Invalid team name or password.' }, { status: 401 });
    }

    // 2. 比较密码
    const isPasswordCorrect = await bcrypt.compare(password, team.passwordHash);

    if (!isPasswordCorrect) {
      return NextResponse.json({ error: 'Invalid team name or password.' }, { status: 401 });
    }

    // 3. 密码正确，查找该团队的所有成员（席位）及其关联的题库
    // 这是 Drizzle ORM 关联查询的强大之处
    const teamMembers = await db.query.members.findMany({
      where: eq(members.teamId, team.id),
      with: {
        assignedQuestionBank: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      columns: {
        id: true, // 这是我们需要的 memberId
      }
    });

    // 格式化返回的成员数据，使其更清晰
    const memberSeats = teamMembers.map(m => ({
      memberId: m.id,
      assignedQuestionBank: m.assignedQuestionBank,
    }));


    // 4. 创建 JWT
    const token = await new SignJWT({ teamId: team.id, teamName: team.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d') // token 有效期 1 天
      .sign(getJwtSecretKey());

    // 5. 返回成功响应
    return NextResponse.json({
      message: 'Login successful!',
      token,
      team: {
        id: team.id,
        name: team.name,
      },
      members: memberSeats,
    });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'An internal server error occurred.' }, { status: 500 });
  }
}
