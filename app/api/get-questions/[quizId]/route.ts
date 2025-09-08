import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { questions, memberQuestionProgress } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth';
import { and, eq, or, lte, inArray } from 'drizzle-orm';

export async function GET(
  req: NextRequest,
  { params }: { params: { quizId: string } }
) {
  const authResult = await verifyAuth(req);
  if (!authResult.team) {
    return NextResponse.json({ error: `认证失败: ${authResult.error}` }, { status: 401 });
  }
  
  const { quizId } = params;
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('mode') || 'all';
  const memberId = searchParams.get('memberId');

  if (!quizId) {
    return NextResponse.json({ error: '题库ID (quizId) 缺失。' }, { status: 400 });
  }

  try {
    let questionList: { id: string; content: string; answer: string; }[] = [];

    if (mode === 'review') {
      // ===== 核心修正：增加一个明确的类型守卫 =====
      if (!memberId) {
        return NextResponse.json({ error: '复习模式需要成员ID (memberId)。' }, { status: 400 });
      }
      // 在这个 if 块之后，TypeScript 就知道 memberId 一定是个 string
      // =============================================
      
      const now = new Date();
      const progressRecordsToReview = await db.query.memberQuestionProgress.findMany({
          where: and(
              eq(memberQuestionProgress.memberId, memberId), // <--- 现在这里是安全的
              or(
                  eq(memberQuestionProgress.status, 'incorrect'),
                  lte(memberQuestionProgress.nextReviewAt, now)
              )
          ),
          columns: { questionId: true }
      });
      
      if (progressRecordsToReview.length === 0) {
          return NextResponse.json([]);
      }

      const questionIdsToReview = progressRecordsToReview.map(p => p.questionId);

      questionList = await db.query.questions.findMany({
          where: (questions, { and, eq, inArray }) => and(
              eq(questions.questionBankId, quizId),
              inArray(questions.id, questionIdsToReview)
          ),
          columns: { id: true, content: true, answer: true }
      });
    } else {
      // 'all' 模式逻辑
      questionList = await db.query.questions.findMany({
        where: eq(questions.questionBankId, quizId),
        columns: {
          id: true,
          content: true,
          answer: true,
        },
      });
    }
    
    return NextResponse.json(questionList);
  } catch (error) {
    console.error(`获取题目 API 错误 (mode: ${mode}):`, error);
    return NextResponse.json({ error: '服务器内部错误。' }, { status: 500 });
  }
}
