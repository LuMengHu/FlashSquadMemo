'use client';

import { useState, useEffect } from 'react';
import type { Question } from '@/types/question';
import { Check, X, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface FamiliarizeModeProps {
  questions: Question[];
  onProgressUpdate: () => void;
  mode: 'all' | 'review';
}

export default function FamiliarizeMode({ questions: allQuestions, onProgressUpdate, mode }: FamiliarizeModeProps) {
  const router = useRouter();
  const [unmarkedQuestions, setUnmarkedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const initialQuestions = [...allQuestions];
    setUnmarkedQuestions(initialQuestions);

    if (initialQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * initialQuestions.length);
      setCurrentQuestion(initialQuestions[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
  }, [allQuestions]);

  const showNextQuestion = (currentQuestionIdToRemove: string) => {
    setIsAnswerShown(false);
    
    // 从列表中移除当前题目
    const remaining = unmarkedQuestions.filter(q => q.id !== currentQuestionIdToRemove);
    setUnmarkedQuestions(remaining);

    if (remaining.length > 0) {
      const randomIndex = Math.floor(Math.random() * remaining.length);
      setCurrentQuestion(remaining[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
  };

  const handleFeedback = async (isCorrect: boolean) => {
    if (!currentQuestion || isLoading) return;
    setIsLoading(true);

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
      
      onProgressUpdate();
      
      // ===== 需求2：逻辑变更 =====
      // 无论对错，都将题目从当前轮次移除，并显示下一题
      showNextQuestion(currentQuestion.id);
      // ==========================

    } catch (error) {
      console.error('Failed to update progress:', error);
      alert(`错误: ${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  const title = mode === 'review' ? '复习模式' : '熟悉题库模式';

  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">{title}</h2>
        <p className="text-sm text-slate-500 mt-1">
          剩余: <span className="font-bold text-blue-500">{unmarkedQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>
      {currentQuestion ? (
        <>
          <div className="mb-4 p-5 rounded-lg bg-slate-100/80 min-h-[120px]">
            <p className="text-sm font-medium text-slate-500 mb-2">问题:</p>
            <p className="text-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
              {currentQuestion.content}
            </p>
          </div>
          <div className="mb-8 p-5 rounded-lg bg-emerald-50 border border-emerald-200 min-h-[100px] flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-2">答案:</p>
            {isAnswerShown ? (
              // ===== 需求3：答案颜色修改 =====
              <p className="text-lg text-gray-900 whitespace-pre-wrap leading-relaxed">
                {currentQuestion.answer}
              </p>
            ) : (
              <div className="flex items-center justify-center h-full text-slate-400">点击下方“检查答案”按钮</div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => handleFeedback(true)} disabled={!isAnswerShown || isLoading} className="group flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"><Check size={20} /> 已掌握</button>
            <button onClick={() => setIsAnswerShown(true)} disabled={isAnswerShown || isLoading} className="rounded-lg bg-blue-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed">检查答案</button>
            <button onClick={() => handleFeedback(false)} disabled={!isAnswerShown || isLoading} className="group flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"><X size={20} /> 未掌握</button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-slate-800">太棒了!</h2>
          <p className="mt-2 text-base text-slate-600">你已经完成了本轮所有题目！</p>
          <button onClick={() => router.push('/team/select-seat')} className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"><Home size={18} /> 返回席位选择</button>
        </div>
      )}
    </div>
  );
}
