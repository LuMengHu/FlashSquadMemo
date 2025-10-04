// app/components/FamiliarizeMode.tsx (最终解决方案)
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

  const startRound = useCallback(() => { /* ... (逻辑不变) ... */
    const initialQuestions = [...allQuestions];
    setUnmarkedQuestions(initialQuestions);
    if (initialQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * initialQuestions.length);
      setCurrentQuestion(initialQuestions[randomIndex]);
    } else { setCurrentQuestion(null); }
    setIsAnswerShown(false);
  }, [allQuestions]);

  useEffect(() => { startRound(); }, [startRound]);
  const handleShowAnswer = () => { setIsAnswerShown(true); };
  const handleFeedback = useCallback(async (isCorrect: boolean) => { if (!currentQuestion || isLoading) return; setIsLoading(true); const questionToSend = currentQuestion; const memberId = localStorage.getItem('selectedMemberId'); const token = localStorage.getItem('authToken'); const remaining = unmarkedQuestions.filter(q => q.id !== questionToSend.id); setUnmarkedQuestions(remaining); setIsAnswerShown(false); if (remaining.length > 0) { const randomIndex = Math.floor(Math.random() * remaining.length); setCurrentQuestion(remaining[randomIndex]); } else { setCurrentQuestion(null); } if (memberId && token) { try { await fetch('/api/progress', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ memberId, questionId: questionToSend.id, isCorrect }), }); onProgressUpdate(); } catch (error) { console.error('Failed to update progress:', error); } } setIsLoading(false); }, [currentQuestion, isLoading, unmarkedQuestions, onProgressUpdate]);
  
  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {mode === 'review' ? '错题复习' : '练习模式'} | 剩余: 
          <span className="font-bold text-indigo-500"> {unmarkedQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {currentQuestion ? (
        <div className="flex min-h-0 flex-grow flex-col pt-4 sm:pt-6">
          <div className="flex min-h-0 flex-grow flex-col space-y-4">
            <div className="flex flex-grow flex-col rounded-lg bg-gray-100 p-4 dark:bg-gray-700/50">
              <p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">问题:</p>
              <div className="flex flex-grow items-center justify-center">
                <p className="text-center text-lg sm:text-xl text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {currentQuestion.question}
                </p>
              </div>
            </div>
            <div className="flex flex-grow flex-col rounded-lg border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-500/30 dark:bg-emerald-900/30">
              <p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">答案:</p>
              <div className="flex flex-grow items-center justify-center">
                {isAnswerShown ? ( <p className="text-center text-lg sm:text-xl font-semibold text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">{currentQuestion.answer}</p> ) : ( <div className="text-center text-gray-400 dark:text-gray-500">...</div> )}
              </div>
            </div>
          </div>
          
          <div className="mt-6 shrink-0 sm:mt-8">
            {isAnswerShown ? ( 
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleFeedback(false)} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><X size={20} /> 未掌握</button>
                <button onClick={() => handleFeedback(true)} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><Check size={20} /> 已掌握</button>
              </div> 
            ) : ( 
              // --- [核心修正] 只关心 isAnswerShown, 不再关心 isLoading ---
              <button onClick={handleShowAnswer} disabled={isAnswerShown} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 disabled:bg-indigo-300">
                <Eye size={20} /> 显示答案
              </button> 
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-grow flex-col items-center justify-center py-10 text-center"><p className="mb-4 text-5xl">🎉</p><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">太棒了!</h2><p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已经完成了本轮所有题目！</p><button onClick={startRound} className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"><RefreshCw size={18} /> 再来一轮</button></div>
      )}
    </div>
  );
}
