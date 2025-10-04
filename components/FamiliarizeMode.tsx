// app/components/FamiliarizeMode.tsx (最终优化版)
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
  
  // [核心修正 1] 移除 isLoading 状态
  // const [isLoading, setIsLoading] = useState(false);

  // 封装一个函数来处理显示下一题的逻辑
  const showNextQuestion = useCallback((questionsToShow: Question[]) => {
    if (questionsToShow.length > 0) {
      const randomIndex = Math.floor(Math.random() * questionsToShow.length);
      setCurrentQuestion(questionsToShow[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
    setIsAnswerShown(false);
  }, []);

  const startRound = useCallback(() => {
    const initialQuestions = [...allQuestions];
    setUnmarkedQuestions(initialQuestions);
    showNextQuestion(initialQuestions);
  }, [allQuestions, showNextQuestion]);

  useEffect(() => { startRound(); }, [startRound]);
  
  const handleShowAnswer = () => { setIsAnswerShown(true); };

  // [核心修正 2] 采用“乐观 UI”模式重构 handleFeedback
  const handleFeedback = useCallback((isCorrect: boolean) => {
    if (!currentQuestion) return;

    const questionToSend = currentQuestion;

    // 1. 立即更新 UI，切换到下一题
    const remaining = unmarkedQuestions.filter(q => q.id !== questionToSend.id);
    setUnmarkedQuestions(remaining);
    showNextQuestion(remaining);

    // 2. 在后台“默默地”发送 API 请求
    const memberId = localStorage.getItem('selectedMemberId');
    const token = localStorage.getItem('authToken');
    if (memberId && token) {
      fetch('/api/progress', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ memberId, questionId: questionToSend.id, isCorrect }),
      })
      .then(response => {
        if (response.ok) {
          onProgressUpdate(); // API 成功后，在后台刷新复习列表
        } else {
          console.error('Failed to update progress on server');
          // 可选：在这里实现一个错误提示，告诉用户同步失败
        }
      })
      .catch(error => {
        console.error('Fetch error for /api/progress:', error);
      });
    }
  }, [currentQuestion, unmarkedQuestions, onProgressUpdate, showNextQuestion]);
  
  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0"><p className="text-center text-sm text-gray-500 dark:text-gray-400">{mode === 'review' ? '错题复习' : '练习模式'} | 剩余: <span className="font-bold text-indigo-500"> {unmarkedQuestions.length}</span> / {allQuestions.length}</p></div>
      {currentQuestion ? (
        <div className="flex min-h-0 flex-grow flex-col pt-4 sm:pt-6">
          <div className="flex min-h-0 flex-grow flex-col space-y-4">
            <div className="flex flex-grow flex-col rounded-lg bg-gray-100 p-4 dark:bg-gray-700/50"><p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">问题:</p><div className="flex flex-grow items-center justify-center"><p className="text-center text-lg sm:text-xl text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">{currentQuestion.question}</p></div></div>
            <div className="flex flex-grow flex-col rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-900/30"><p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">答案:</p><div className="flex flex-grow items-center justify-center">{isAnswerShown ? ( <p className="text-center text-lg sm:text-xl font-semibold text-gray-900 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">{currentQuestion.answer}</p> ) : ( <div className="text-center text-gray-400 dark:text-gray-500">...</div> )}</div></div>
          </div>
          <div className="mt-6 shrink-0 sm:mt-8">
            {isAnswerShown ? ( 
              <div className="grid grid-cols-2 gap-4">
                {/* [核心修正 3] 移除 disabled={isLoading} */}
                <button onClick={() => handleFeedback(false)} className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><X size={20} /> 未掌握</button>
                <button onClick={() => handleFeedback(true)} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><Check size={20} /> 已掌握</button>
              </div> 
            ) : ( 
              <button onClick={handleShowAnswer} disabled={isAnswerShown} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 disabled:bg-indigo-300"><Eye size={20} /> 显示答案</button> 
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-grow flex-col items-center justify-center py-10 text-center"><p className="mb-4 text-5xl">🎉</p><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">太棒了!</h2><p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已经完成了本轮所有题目！</p><button onClick={startRound} className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"><RefreshCw size={18} /> 再来一轮</button></div>
      )}
    </div>
  );
}
