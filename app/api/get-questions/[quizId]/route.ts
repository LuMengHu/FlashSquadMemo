// app/api/get-questions/[quizId]/route.ts (完整替换)
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questions, memberQuestionProgress } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth';
import { and, eq, or, lte } from 'drizzle-orm';
import { z } from 'zod';

const getQuestionsSchema = z.object({
  quizId: z.string().uuid(),
  memberId: z.string().uuid(),
  mode: z.enum(['all', 'review']),
});

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const authResult = await verifyAuth(req);
  if (!authResult.team) {
    return NextResponse.json({ error: `认证失败: ${authResult.error}` }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const validation = getQuestionsSchema.safeParse({
    quizId: params.quizId,
    memberId: searchParams.get('memberId'),
    mode: searchParams.get('mode'),
  });

  if (!validation.success) {
    return NextResponse.json({ error: '无效的请求参数', details: validation.error.flatten() }, { status: 400 });
  }

  const { quizId, memberId, mode } = validation.data;

  try {
    let query;

    if (mode === 'all') {
      // 获取全部题目的逻辑保持不变
      query = db.select({
          id: questions.id,
          content: questions.content,
          answer: questions.answer
        })
        .from(questions)
        .where(eq(questions.questionBankId, quizId));
        
    } else { // mode === 'review'
      
      // [核心修正] 这里是获取复习题目的新逻辑
      query = db.select({
          id: questions.id,
          content: questions.content,
          answer: questions.answer,
        })
        .from(questions)
        .innerJoin(memberQuestionProgress, eq(questions.id, memberQuestionProgress.questionId))
        .where(
          and(
            eq(memberQuestionProgress.memberId, memberId),
            // [关键] 使用 or 操作符，满足以下任一条件即可：
            or(
              // 1. 状态是 'incorrect' (答错了)
              eq(memberQuestionProgress.status, 'incorrect'),
              // 2. 状态是 'unanswered' (从未答过也算需要学习)
              eq(memberQuestionProgress.status, 'unanswered'),
              // 3. 下次复习时间已到或已过
              lte(memberQuestionProgress.nextReviewAt, new Date())
            )
          )
        );
    }

    const result = await query;
    return NextResponse.json(result);

  } catch (error) {
    console.error(`Get questions API error (mode: ${mode}):`, error);
    return NextResponse.json({ error: '服务器内部错误。' }, { status: 500 });
  }
}
