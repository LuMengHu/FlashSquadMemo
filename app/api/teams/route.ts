// app/api/teams/route.ts

import { db } from '@/lib/db';
import { teams } from '@/lib/schema';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';

/**
 * @description 处理创建新团队（注册）的 POST 请求
 * @param request Request 对象
 * @returns 返回一个 JSON 响应
 */
export async function POST(request: Request) {
  try {
    // 1. 解析请求体
    const body = await request.json();
    const { teamName, password } = body;

    // 2. 数据校验
    if (!teamName || !password) {
      return NextResponse.json(
        { error: '团队名和密码不能为空' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
        return NextResponse.json(
            { error: '密码长度不能少于6位' },
            { status: 400 }
        );
    }

    // 3. 检查团队名是否已存在
    const existingTeam = await db.select().from(teams).where(eq(teams.name, teamName)).limit(1);
    if (existingTeam.length > 0) {
        return NextResponse.json(
            { error: '该团队名已被注册' },
            { status: 409 } // 409 Conflict 表示请求的资源与当前状态冲突
        );
    }

    // 4. 对密码进行哈希加密
    // 第二个参数是 "salt rounds"，数值越高越安全，但耗时也越长，10 是一个很好的默认值
    const passwordHash = await bcrypt.hash(password, 10);

    // 5. 数据库操作
    // 现在我们插入了 name 和 passwordHash，完全符合 schema 定义
    const newTeamResult = await db.insert(teams).values({
        name: teamName,
        passwordHash: passwordHash,
    }).returning({
        id: teams.id,
        name: teams.name,
        createdAt: teams.createdAt
    });

    // 6. 返回成功响应
    // .returning() 会返回一个数组，我们取第一个元素
    // 我们特意不返回 passwordHash，确保密码信息不会泄露到前端
    const newTeam = newTeamResult[0];
    return NextResponse.json(newTeam, { status: 201 });

  } catch (error) {
    // 7. 错误处理
    console.error("Error creating team:", error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
