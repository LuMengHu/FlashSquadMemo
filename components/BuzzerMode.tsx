// app/components/BuzzerMode.tsx
'use client';
// (逻辑代码部分保持不变, 仅更新UI渲染部分)
import { useState, useEffect, useRef } from 'react';
import type { Question } from '@/types/question';

const ArrowPathIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201-4.42 5.5 5.5 0 011.663-1.44l-.805.805a.75.75 0 01-1.06-1.06l1.5-1.5a.75.75 0 011.06 0l1.5 1.5a.75.75 0 11-1.06 1.06l-.805-.805a4 4 0 00-1.22 3.224 4 4 0 006.682 2.825.75.75 0 11.962 1.13-5.5 5.5 0 01-9.201-4.42z" clipRule="evenodd" /><path fillRule="evenodd" d="M4.688 8.576a5.5 5.5 0 019.201 4.42 5.5 5.5 0 01-1.663 1.44l.805-.805a.75.75 0 111.06 1.06l-1.5 1.5a.75.75 0 01-1.06 0l-1.5-1.5a.75.75 0 011.06-1.06l.805.805a4 4 0 001.22-3.224 4 4 0 00-6.682-2.825.75.75 0 11-.962-1.13 5.5 5.5 0 019.201 4.42z" clipRule="evenodd" /></svg>
);
type GameState = 'idle' | 'displaying' | 'answered' | 'finished';
interface BuzzerModeProps { questions: Question[] }

export default function BuzzerMode({ questions: allQuestions }: BuzzerModeProps) {
  // 状态和逻辑部分保持不变
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
    <div className="w-full rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">抢答体验模式</h2>
        <p className="text-sm text-slate-500 mt-1">
          已完成: <span className="font-bold text-blue-500">{allQuestions.length - remainingQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {gameState === 'finished' ? (
        <div className="text-center py-10">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-slate-800">全部完成!</h2>
          <p className="mt-2 text-base text-slate-600">你已经挑战了本题库所有题目！</p>
          <button
            onClick={handleReset}
            className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
          >
            <ArrowPathIcon /> 再来一轮
          </button>
        </div>
      ) : (
        <>
          <div className="mb-4 p-5 rounded-lg bg-slate-100/80 min-h-[150px]">
            <p className="text-sm font-medium text-slate-500 mb-2">问题:</p>
            <p className="text-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
              {gameState === 'idle' ? '点击 "开始" 按钮出题' : displayedQuestionText}
              {gameState === 'displaying' && <span className="ml-1 inline-block h-5 w-0.5 bg-slate-700 animate-pulse" />}
            </p>
          </div>

          <div className="mb-8 p-5 rounded-lg bg-emerald-50 border border-emerald-200 min-h-[100px] flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-2">答案:</p>
            {gameState === 'answered' && currentQuestion && (
              <p className="text-lg text-emerald-700 whitespace-pre-wrap leading-relaxed">
                {currentQuestion.answer}
              </p>
            )}
          </div>
          
          <div className="w-full">
            {gameState === 'displaying' ? (
              <button
                onClick={handleBuzzer}
                className="w-full rounded-lg bg-red-500 px-4 py-3 text-white font-bold text-xl shadow-sm transition-all hover:bg-red-600 animate-pulse"
              >
                抢 答 !
              </button>
            ) : (
              <button
                onClick={handleNextQuestion}
                className="w-full rounded-lg bg-blue-500 px-4 py-3 text-white font-semibold text-lg shadow-sm transition-all hover:bg-blue-600"
              >
                {gameState === 'idle' ? '开 始' : '下 一 题'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
