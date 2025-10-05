// app/api/progress/route.ts 
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memberQuestionProgress } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

// 定义请求体验证的 schema
const updateProgressSchema = z.object({
  memberId: z.string().uuid(),
  questionId: z.string().uuid(),
  isCorrect: z.boolean(),
});

// 遗忘曲线算法 (SM-2 简化版)
function calculateSpacedRepetition({
  isCorrect,
  oldInterval,
  oldEaseFactor,
}: {
  isCorrect: boolean;
  oldInterval: number;
  oldEaseFactor: number;
}) {
  if (!isCorrect) {
    // 如果回答错误，重置间隔
    return {
      newInterval: 0,
      newEaseFactor: Math.max(1.3, oldEaseFactor - 0.2), // 降低熟悉度
      nextReviewDate: new Date(), // 立即需要复习
    };
  }

  // 如果回答正确
  let newInterval: number;
  if (oldInterval === 0) newInterval = 1;
  else if (oldInterval === 1) newInterval = 6;
  else newInterval = Math.round(oldInterval * oldEaseFactor);

  const newEaseFactor = oldEaseFactor + 0.1;
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);

  return { newInterval, newEaseFactor, nextReviewDate };
}


// 导出的 PATCH 函数，处理 PATCH 请求
export async function PATCH(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (!authResult.team) {
    return NextResponse.json({ error: `认证失败: ${authResult.error}` }, { status: 401 });
  }

  try {
    const body = await req.json();
    const validation = updateProgressSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ error: '无效的请求体', details: validation.error.flatten() }, { status: 400 });
    }
    
    const { memberId, questionId, isCorrect } = validation.data;

    const currentProgress = await db.query.memberQuestionProgress.findFirst({
        where: and(
            eq(memberQuestionProgress.memberId, memberId),
            eq(memberQuestionProgress.questionId, questionId)
        )
    });

    // 如果找不到进度记录，这是一个客户端错误，返回 404
    if (!currentProgress) {
        return NextResponse.json({ error: `进度记录未找到 (memberId: ${memberId}, questionId: ${questionId})` }, { status: 404 });
    }

    // 更新状态和遗忘曲线参数
    const newStatus = isCorrect ? 'correct' : 'incorrect';
    
    const sm2Result = calculateSpacedRepetition({
        isCorrect: isCorrect,
        oldInterval: currentProgress.interval ?? 0,
        oldEaseFactor: currentProgress.easeFactor ?? 2.5,
    });

    await db.update(memberQuestionProgress)
      .set({
        status: newStatus,
        lastReviewedAt: new Date(),
        nextReviewAt: sm2Result.nextReviewDate,
        interval: sm2Result.newInterval,
        easeFactor: sm2Result.newEaseFactor,
      })
      .where(and(
        eq(memberQuestionProgress.memberId, memberId),
        eq(memberQuestionProgress.questionId, questionId)
      ));
    
    return NextResponse.json({ message: 'Progress updated successfully' });

  } catch (error) {
    console.error('Update progress API error:', error);
    return NextResponse.json({ error: '服务器内部错误。' }, { status: 500 });
  }
}
