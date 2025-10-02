// app/components/BuzzerMode.tsx (完整替换)
'use client';
import { useState, useEffect, useRef } from 'react';
import type { Question } from '@/types/question';
import { ArrowPathIcon as SolidArrowPathIcon } from '@heroicons/react/24/solid'; // 使用Heroicons的Solid版本

type GameState = 'idle' | 'displaying' | 'answered' | 'finished';
interface BuzzerModeProps { questions: Question[] }

export default function BuzzerMode({ questions: allQuestions }: BuzzerModeProps) {
  // --- 逻辑部分保持不变 ---
  const [gameState, setGameState] = useState<GameState>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [displayedQuestionText, setDisplayedQuestionText] = useState('');
  const [remainingQuestions, setRemainingQuestions] = useState<Question[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => { setRemainingQuestions([...allQuestions]); setGameState('idle'); }, [allQuestions]);
  const handleNextQuestion = () => { if (remainingQuestions.length === 0) { setGameState('finished'); setCurrentQuestion(null); return; } const randomIndex = Math.floor(Math.random() * remainingQuestions.length); const nextQuestion = remainingQuestions[randomIndex]; setCurrentQuestion(nextQuestion); setRemainingQuestions(prev => prev.filter(q => q.id !== nextQuestion.id)); setDisplayedQuestionText(''); setGameState('displaying'); };
  const handleBuzzer = () => { if (gameState === 'displaying' && currentQuestion) { if (intervalRef.current) clearInterval(intervalRef.current); setDisplayedQuestionText(currentQuestion.content); setGameState('answered'); } };
  useEffect(() => { if (gameState === 'displaying' && currentQuestion) { if (intervalRef.current) clearInterval(intervalRef.current); intervalRef.current = setInterval(() => { setDisplayedQuestionText(prev => { if (prev.length >= currentQuestion.content.length) { if (intervalRef.current) clearInterval(intervalRef.current); setGameState('answered'); return prev; } return currentQuestion.content.substring(0, prev.length + 1); }); }, 150); } return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, [gameState, currentQuestion]);
  const handleReset = () => { setRemainingQuestions([...allQuestions]); setCurrentQuestion(null); setDisplayedQuestionText(''); setGameState('idle'); };

  // --- 全新的 UI 渲染部分 ---
  return (
    <div className="w-full rounded-xl bg-white dark:bg-gray-800 p-6 shadow-lg">
      <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl text-center font-semibold text-gray-800 dark:text-gray-100">抢答体验模式</h2>
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mt-1">
          已完成: <span className="font-bold text-indigo-500">{allQuestions.length - remainingQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {gameState === 'finished' ? (
        <div className="text-center py-10">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">全部完成!</h2>
          <p className="mt-2 text-base text-gray-600 dark:text-gray-400">你已经挑战了本题库所有题目！</p>
          <button
            onClick={handleReset}
            className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            <SolidArrowPathIcon className="w-5 h-5" /> 再来一轮
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 问题卡片 */}
          <div className="p-5 rounded-lg bg-gray-100 dark:bg-gray-700/50 min-h-[150px]">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">问题:</p>
            <p className="text-lg text-gray-800 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
              {gameState === 'idle' ? '点击 “开始” 按钮出题' : displayedQuestionText}
              {gameState === 'displaying' && <span className="ml-1 inline-block h-5 w-0.5 bg-gray-700 dark:bg-gray-300 animate-pulse" />}
            </p>
          </div>

          {/* 答案卡片 */}
          <div className="p-5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 min-h-[100px] flex flex-col justify-center">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">答案:</p>
            {gameState === 'answered' && currentQuestion && (
              <p className="text-lg text-emerald-800 dark:text-emerald-200 whitespace-pre-wrap leading-relaxed font-semibold">
                {currentQuestion.answer}
              </p>
            )}
          </div>
          
          {/* 操作按钮 */}
          <div className="pt-4">
            {gameState === 'displaying' ? (
              <button
                onClick={handleBuzzer}
                className="w-full rounded-lg bg-red-500 px-4 py-3 text-white font-bold text-xl shadow-sm transition-all hover:bg-red-600 hover:scale-105 active:scale-100 animate-pulse"
              >
                抢 答 !
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-white font-semibold text-lg shadow-sm transition-all hover:bg-indigo-700"
              >
                {gameState === 'idle' ? '开 始' : '下 一 题'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
