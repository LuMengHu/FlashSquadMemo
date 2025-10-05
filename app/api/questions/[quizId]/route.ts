// app/api/questions/[quizId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questionBanks, questions, memberQuestionProgress } from '@/lib/schema';
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
    const bank = await db.query.questionBanks.findFirst({
      columns: { mode: true },
      where: eq(questionBanks.id, quizId),
    });

    if (!bank) {
      return NextResponse.json({ error: '题库未找到' }, { status: 404 });
    }

    let questionList;

    if (mode === 'all') {
      // "all" 模式的查询很简单，保持不变
      questionList = await db.query.questions.findMany({
        where: eq(questions.questionBankId, quizId),
      });
        
    } else { // mode === 'review'
      // [核心修正] 使用更稳健的查询和映射方法
      const joinedResult = await db.select() // 1. 直接 select() 获取两个完整的表对象
        .from(questions)
        .innerJoin(memberQuestionProgress, eq(questions.id, memberQuestionProgress.questionId))
        .where(
          and(
            eq(memberQuestionProgress.memberId, memberId),
            or(
              eq(memberQuestionProgress.status, 'incorrect'),
              eq(memberQuestionProgress.status, 'unanswered'),
              lte(memberQuestionProgress.nextReviewAt, new Date())
            )
          )
        );
      
      // 2. 使用 map 从结果中提取出 questions 对象
      questionList = joinedResult.map(row => row.questions);
    }

    return NextResponse.json({
      mode: bank.mode,
      questions: questionList,
    });

  } catch (error) {
    console.error(`Get questions API error (mode: ${mode}):`, error);
    return NextResponse.json({ error: '服务器内部错误。' }, { status: 500 });
  }
}
