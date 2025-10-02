// app/components/BuzzerMode.tsx (最终解决方案)
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { Question } from '@/types/question';
import { RefreshCw } from 'lucide-react';

type GameState = 'idle' | 'displaying' | 'answered' | 'finished';
interface BuzzerModeProps { questions: Question[] }

export default function BuzzerMode({ questions: allQuestions }: BuzzerModeProps) {
  // --- 逻辑部分保持不变 ---
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [displayedQuestionText, setDisplayedQuestionText] = useState('');
  const [remainingQuestions, setRemainingQuestions] = useState<Question[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startRound = useCallback(() => { setRemainingQuestions([...allQuestions]); setCurrentQuestion(null); setDisplayedQuestionText(''); setGameState('idle'); }, [allQuestions]);
  useEffect(() => { startRound(); }, [startRound]);
  const handleNextQuestion = () => { if (remainingQuestions.length === 0) { setGameState('finished'); setCurrentQuestion(null); return; } const randomIndex = Math.floor(Math.random() * remainingQuestions.length); const nextQuestion = remainingQuestions[randomIndex]; setCurrentQuestion(nextQuestion); setRemainingQuestions(prev => prev.filter(q => q.id !== nextQuestion.id)); setDisplayedQuestionText(''); setGameState('displaying'); };
  const handleBuzzer = () => { if (gameState === 'displaying' && currentQuestion) { if (intervalRef.current) clearInterval(intervalRef.current); setDisplayedQuestionText(currentQuestion.content); setGameState('answered'); } };
  useEffect(() => { if (gameState === 'displaying' && currentQuestion) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = setInterval(() => { setDisplayedQuestionText(prev => { if (prev.length >= currentQuestion.content.length) { if (intervalRef.current) clearInterval(intervalRef.current); setGameState('answered'); return prev; } return currentQuestion.content.substring(0, prev.length + 1); }); }, 100); } return () => { if (intervalRef.current) clearInterval(intervalRef.current) }; }, [gameState, currentQuestion]);

  // --- [FINAL FIX] 全新的布局 ---
  return (
    // 1. 根容器: 垂直 flex 布局，高度由内容决定
    <div className="flex w-full flex-col">
      {/* 头部 */}
      <div className="shrink-0">
        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
          抢答模式 | 已完成: 
          <span className="font-bold text-indigo-500"> {allQuestions.length - remainingQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {gameState !== 'finished' ? (
        // 2. 主体
        <div className="flex flex-col pt-4 sm:pt-6">
          {/* 3. 内容区 */}
          <div className="space-y-4">
            {/* 问题卡片 */}
            <div className="flex flex-col rounded-lg bg-gray-100 p-4 min-h-[120px] justify-center dark:bg-gray-700/50">
              <p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">问题:</p>
              <p className="text-center text-lg sm:text-xl text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                {gameState === 'idle' ? '点击“开始”按钮出题' : displayedQuestionText}
                {gameState === 'displaying' && <span className="ml-1 inline-block h-5 w-0.5 animate-pulse bg-gray-700 dark:bg-gray-300" />}
              </p>
            </div>
            {/* 答案卡片 */}
            <div className="flex flex-col rounded-lg border border-emerald-200 bg-emerald-50 p-4 min-h-[100px] justify-center dark:border-emerald-500/30 dark:bg-emerald-900/30">
              <p className="mb-2 shrink-0 text-sm font-medium text-gray-500 dark:text-gray-400">答案:</p>
              <div className="flex-grow flex items-center justify-center">
                {gameState === 'answered' && currentQuestion && (
                  <p className="text-center text-lg sm:text-xl font-semibold text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed">
                    {currentQuestion.answer}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* 4. 按钮区 */}
          <div className="mt-6 sm:mt-8 shrink-0">
            {gameState === 'displaying' ? ( <button onClick={handleBuzzer} className="w-full rounded-lg bg-red-500 px-4 py-3 text-xl font-bold text-white shadow-sm transition-all hover:bg-red-600 hover:scale-105 active:scale-100 animate-pulse">抢 答 !</button> ) : ( <button onClick={handleNextQuestion} className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-lg font-semibold text-white shadow-sm transition-all hover:bg-indigo-700">{gameState === 'idle' ? '开 始' : '下 一 题'}</button> )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center"><p className="mb-4 text-5xl">🎉</p><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">全部完成!</h2><p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已经挑战了本轮所有题目！</p><button onClick={startRound} className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white transition-colors hover:bg-indigo-700"><RefreshCw size={18} /> 再来一轮</button></div>
      )}
    </div>
  );
}
