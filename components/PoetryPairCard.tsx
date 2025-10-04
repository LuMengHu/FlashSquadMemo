// app/components/PoetryPairCard.tsx (最终优化版)
'use client';

import { cn } from '@/lib/utils';
import type { Question } from '@/types/question';

interface PoetryPairCardProps {
  question: Question;
  isAnswerVisible: boolean;
  isContentPrompt: boolean; // 接收来自父组件的随机结果
}

export default function PoetryPairCard({ question, isAnswerVisible, isContentPrompt }: PoetryPairCardProps) {
  // [核心修正] 不再自己计算随机，而是直接使用父组件的决定
  const promptLine = isContentPrompt ? question.question : question.answer;
  const answerLine = isContentPrompt ? question.answer : question.question;
  const promptLabel = isContentPrompt ? '上句' : '下句';
  const answerLabel = isContentPrompt ? '下句' : '上句';
  
  const metadata = (question.metadata || {}) as { title?: string; author?: string };

  return (
    <div className="flex h-full w-full flex-col rounded-lg bg-gray-900/50 p-6 text-white shadow-lg border border-gray-800">
      <div className="flex flex-grow flex-col items-center justify-center text-center">
        <div className="space-y-4">
          {/* 题目行 (始终可见) */}
          <p className="text-2xl font-serif leading-loose text-gray-200 transition-opacity duration-300 sm:text-3xl">
            <span className="text-gray-500 text-xl">{promptLabel}：</span>
            {promptLine}
          </p>

          {/* 答案行 (根据 isAnswerVisible 决定是否可见) */}
          <p className={cn(
            "text-2xl font-serif leading-loose text-green-400 transition-opacity duration-300 sm:text-3xl",
            isAnswerVisible ? "opacity-100" : "opacity-0 h-0 invisible"
          )}>
            <span className="text-gray-500 text-xl">{answerLabel}：</span>
            {answerLine}
          </p>
        </div>
      </div>
      <div className={cn(
        "flex justify-end pt-4 transition-opacity duration-500",
        isAnswerVisible ? "opacity-100" : "opacity-0 invisible"
      )}>
        <p className="text-gray-400 font-serif text-lg">
          —— {metadata?.author || '佚名'}《{metadata?.title || '无题'}》
        </p>
      </div>
    </div>
  );
}
