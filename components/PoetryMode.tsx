// app/components/PoetryMode.tsx (最终优化版)
'use client';

import { useState, useEffect, useCallback } from 'react';
import type { Question } from '@/types/question';
import { Check, X, Eye, RefreshCw } from 'lucide-react';
import PoetryPairCard from '@/components/PoetryPairCard'; // 使用别名路径

interface PoetryModeProps {
  questions: Question[];
  onProgressUpdate: () => void;
  mode: 'all' | 'review';
}

export default function PoetryMode({ questions: allQuestions, onProgressUpdate, mode }: PoetryModeProps) {
  const [unmarkedQuestions, setUnmarkedQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAnswerShown, setIsAnswerShown] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // [核心修正] 将随机化状态提升到父组件
  const [isContentThePrompt, setIsContentThePrompt] = useState(true);

  // 封装一个函数来处理显示下一题的逻辑
  const showNextQuestion = useCallback((questionsToShow: Question[]) => {
    if (questionsToShow.length > 0) {
      const randomIndex = Math.floor(Math.random() * questionsToShow.length);
      setCurrentQuestion(questionsToShow[randomIndex]);
      // 在题目切换时，决定本次的出题方式
      setIsContentThePrompt(Math.random() < 0.5);
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

  const handleFeedback = useCallback(async (isCorrect: boolean) => {
    if (!currentQuestion || isLoading) return;
    setIsLoading(true);

    const questionToSend = currentQuestion;
    const remaining = unmarkedQuestions.filter(q => q.id !== questionToSend.id);
    setUnmarkedQuestions(remaining);
    
    // 立即显示下一题
    showNextQuestion(remaining);

    const memberId = localStorage.getItem('selectedMemberId');
    const token = localStorage.getItem('authToken');
    if (memberId && token) {
      try {
        await fetch('/api/progress', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ memberId, questionId: questionToSend.id, isCorrect }),
        });
        onProgressUpdate();
      } catch (error) { console.error('Failed to update progress:', error); }
    }
    setIsLoading(false);
  }, [currentQuestion, isLoading, unmarkedQuestions, onProgressUpdate, showNextQuestion]);
  
  return (
    <div className="flex h-full w-full flex-col">
      <div className="shrink-0">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          {mode === 'review' ? '诗词回顾' : '诗词配对'} | 剩余: 
          <span className="font-bold text-indigo-500"> {unmarkedQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {currentQuestion ? (
        <div className="flex min-h-0 flex-grow flex-col pt-4 sm:pt-6">
          <div className="flex min-h-0 flex-grow flex-col">
            {/* 将随机结果作为 prop 传递下去 */}
            <PoetryPairCard 
              question={currentQuestion} 
              isAnswerVisible={isAnswerShown}
              isContentPrompt={isContentThePrompt} 
            />
          </div>
          <div className="mt-6 shrink-0 sm:mt-8">
            {isAnswerShown ? (
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => handleFeedback(false)} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-red-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><X size={20} /> 未记熟</button>
                <button onClick={() => handleFeedback(true)} disabled={isLoading} className="flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold shadow-sm transition-all hover:bg-green-600 disabled:bg-gray-300 dark:disabled:bg-gray-600"><Check size={20} /> 已记熟</button>
              </div>
            ) : (
              <button onClick={handleShowAnswer} disabled={isAnswerShown} className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-500 px-4 py-3 font-semibold text-white shadow-sm transition-all hover:bg-indigo-600 disabled:bg-indigo-300">
                <Eye size={20} /> 显示下句/上句
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-grow flex-col items-center justify-center py-10 text-center"><p className="mb-4 text-5xl">🎉</p><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">太棒了!</h2><p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已完成本轮所有诗词配对！</p><button onClick={startRound} className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"><RefreshCw size={18} /> 再来一轮</button></div>
      )}
    </div>
  );
}
