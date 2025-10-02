// app/components/FamiliarizeMode.tsx (完整替换)
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Question } from '@/types/question';
import { Check, X, Eye, RefreshCw } from 'lucide-react';

interface FamiliarizeModeProps {
  questions: Question[];
  onProgressUpdate: () => void;
  mode: 'all' | 'review';
}

export default function FamiliarizeMode({ questions: allQuestions, onProgressUpdate, mode }: FamiliarizeModeProps) {
  const [unmarkedQuestions, setUnmarkedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startRound = useCallback(() => {
    const initialQuestions = [...allQuestions];
    setUnmarkedQuestions(initialQuestions);
    if (initialQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * initialQuestions.length);
      setCurrentQuestion(initialQuestions[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
    setIsAnswerShown(false);
  }, [allQuestions]);

  useEffect(() => {
    startRound();
  }, [startRound]);

  const handleFeedback = async (isCorrect: boolean) => {
    if (!currentQuestion || isLoading) return;
    setIsLoading(true);

    // [关键修正] 先计算出下一轮的状态，再执行异步操作
    const remainingAfterThis = unmarkedQuestions.filter(q => q.id !== currentQuestion.id);

    // 更新下一题的状态
    if (remainingAfterThis.length > 0) {
      const randomIndex = Math.floor(Math.random() * remainingAfterThis.length);
      setCurrentQuestion(remainingAfterThis[randomIndex]);
      setUnmarkedQuestions(remainingAfterThis);
      setIsAnswerShown(false);
    } else {
      // 这是最后一题，直接进入完成状态
      setCurrentQuestion(null);
      setUnmarkedQuestions([]);
    }

    // 现在可以安全地执行异步 API 调用和父组件更新了
    // 因为它们不会再干扰当前组件的下一题逻辑
    const memberId = localStorage.getItem('selectedMemberId');
    const token = localStorage.getItem('authToken');
    if (!memberId || !token) {
      alert('用户身份信息丢失，请重新登录。');
      setIsLoading(false);
      return;
    }

    try {
      await fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ memberId, questionId: currentQuestion.id, isCorrect }),
      });
      // 在后台默默更新父组件，不影响当前 UI
      onProgressUpdate();
    } catch (error) {
      console.error('Failed to update progress:', error);
      alert(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const title = mode === 'review' ? '错题复习' : '熟悉题库';

  return (
    <div className="w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl text-center font-semibold text-gray-800 dark:text-gray-100">{title}</h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
          剩余题目: <span className="font-bold text-indigo-500">{unmarkedQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>
      {currentQuestion ? (
        <>
          <div className="space-y-4">
            <div className="p-5 rounded-lg bg-gray-100 dark:bg-gray-700/50 min-h-[120px]">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">问题:</p>
              <p className="text-lg text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {currentQuestion.content}
              </p>
            </div>
            <div className="p-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 min-h-[100px] flex flex-col justify-center">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">答案:</p>
              {isAnswerShown ? (
                <p className="text-lg text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed font-semibold">
                  {currentQuestion.answer}
                </p>
              ) : (
                <div className="text-center text-gray-400 dark:text-gray-500">点击 “显示答案” 查看</div>
              )}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3">
            <button onClick={() => handleFeedback(true)} disabled={!isAnswerShown || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"><Check size={20} /> 已掌握</button>
            <button onClick={() => setIsAnswerShown(true)} disabled={isAnswerShown || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-indigo-600 disabled:bg-indigo-300 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed"><Eye size={20} /> 显示答案</button>
            <button onClick={() => handleFeedback(false)} disabled={!isAnswerShown || isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed"><X size={20} /> 未掌握</button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">太棒了!</h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已经完成了本轮所有题目！</p>
          <button 
            onClick={startRound}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors">
            <RefreshCw size={18} /> 再来一轮
          </button>
        </div>
      )}
    </div>
  );
}
