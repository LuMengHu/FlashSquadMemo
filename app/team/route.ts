// app/team/route.ts

import { NextResponse } from 'next/server';
import { db } from '../../lib/db';         // 使用相对路径
import { teams } from '../../lib/schema';   // 使用相对路径
import { eq } from 'drizzle-orm';
import { verifyAuth } from '../../lib/auth'; // 已经修正为相对路径

export const GET = async (req: Request) => {
  // 1. 验证用户身份
  const result = await verifyAuth(req);
  if (!result.team) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ★★★ 核心修复点 ★★★
  // 将 teamId 提取到一个明确类型的常量中
  // 这样可以确保 TypeScript 知道 teamId 是一个确定的 'string'
  const teamId = result.team.teamId;

  try {
    // 2. 使用 Drizzle 的关联查询
    const teamWithMembers = await db.query.teams.findFirst({
      // 使用这个明确的常量作为查询条件
      where: eq(teams.id, teamId),
      with: {
        members: {
          with: {
            assignedQuestionBank: true,
          },
        },
      },
    });

    if (!teamWithMembers) {
      // 这里的错误信息可以更具体
      return NextResponse.json({ error: `Team with ID ${teamId} not found` }, { status: 404 });
    }

    // 3. 返回包含题库信息的成员列表
    return NextResponse.json(teamWithMembers.members);

  } catch (error) {
    console.error('Failed to fetch members:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
};
