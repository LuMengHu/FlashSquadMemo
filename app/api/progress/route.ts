import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { memberQuestionProgress } from '@/lib/schema';
import { verifyAuth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';

const updateProgressSchema = z.object({
  memberId: z.string().uuid(),
  questionId: z.string().uuid(),
  isCorrect: z.boolean(),
});

function calculateSpacedRepetition({
  quality,
  oldInterval,
  oldEaseFactor,
}: {
  quality: number;
  oldInterval: number;
  oldEaseFactor: number;
}) {
  if (quality < 3) {
    return {
      newInterval: 0,
      newEaseFactor: oldEaseFactor,
      nextReviewDate: new Date(),
    };
  }
  let newInterval: number;
  if (oldInterval === 0) newInterval = 1;
  else if (oldInterval === 1) newInterval = 6;
  else newInterval = Math.round(oldInterval * oldEaseFactor);
  const newEaseFactor = Math.max(1.3, oldEaseFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + newInterval);
  return { newInterval, newEaseFactor, nextReviewDate };
}

export async function PATCH(req: NextRequest) {
  const authResult = await verifyAuth(req);
  if (!authResult.team) {
    return NextResponse.json({ error: `认证失败: ${authResult.error}` }, { status: 401 });
  }

  const body = await req.json();
  const validation = updateProgressSchema.safeParse(body);
  
  // ===== 核心修正：使用 TypeScript 更认可的类型守卫 =====
  if (!validation.success) {
    return NextResponse.json({ error: '无效的请求体', details: validation.error.flatten() }, { status: 400 });
  }
  // 在这个 if 判断之后，TypeScript 就知道 validation.success 一定是 true
  // 并且 validation.data 一定存在且类型正确。
  const { memberId, questionId, isCorrect } = validation.data;
  // ========================================================

  try {
    const currentProgress = await db.query.memberQuestionProgress.findFirst({
        where: and(
            eq(memberQuestionProgress.memberId, memberId),
            eq(memberQuestionProgress.questionId, questionId)
        )
    });

    if (!currentProgress) {
        return NextResponse.json({ error: `进度记录未找到` }, { status: 404 });
    }

    let newStatus = currentProgress.status;
    let newCorrectStreak = currentProgress.correctStreak ?? 0;
    let newNextReviewAt = currentProgress.nextReviewAt ?? new Date();
    let newInterval = currentProgress.interval ?? 0;
    let newEaseFactor = currentProgress.easeFactor ?? 2.5;

    if (isCorrect) {
        newCorrectStreak++;
        if (newCorrectStreak >= 2 && currentProgress.status !== 'correct') {
            newStatus = 'correct';
            const sm2Result = calculateSpacedRepetition({
                quality: 5,
                oldInterval: newInterval,
                oldEaseFactor: newEaseFactor,
            });
            newNextReviewAt = sm2Result.nextReviewDate;
            newInterval = sm2Result.newInterval;
            newEaseFactor = sm2Result.newEaseFactor;
        }
    } else {
        newCorrectStreak = 0;
        newStatus = 'incorrect';
        newNextReviewAt = new Date();
        newInterval = 0;
    }

    await db.update(memberQuestionProgress)
      .set({
        status: newStatus,
        correctStreak: newCorrectStreak,
        lastReviewedAt: new Date(),
        nextReviewAt: newNextReviewAt,
        interval: newInterval,
        easeFactor: newEaseFactor,
      })
      .where(and(
        eq(memberQuestionProgress.memberId, memberId),
        eq(memberQuestionProgress.questionId, questionId)
      ));
    
    return NextResponse.json({ 
        message: 'Progress updated successfully',
        newState: { status: newStatus, correctStreak: newCorrectStreak }
    });

  } catch (error) {
    console.error('Update progress API error:', error);
    return NextResponse.json({ error: '服务器内部错误。' }, { status: 500 });
  }
}
