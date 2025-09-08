// app/components/FamiliarizeMode.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Question } from '@/app/lib/questionBanks';

// 图标组件保持不变
const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.052-.143z" clipRule="evenodd" /></svg>
);
const XMarkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>
);

interface FamiliarizeModeProps {
  questions: Question[];
}

export default function FamiliarizeMode({ questions: allQuestions }: FamiliarizeModeProps) {
  // 状态和逻辑部分保持不变
  const [unmarkedIds, setUnmarkedIds] = useState<number[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [isAnswerShown, setIsAnswerShown] = useState(false);

  const resetQuiz = () => {
    setUnmarkedIds(allQuestions.map(q => q.id));
    setIsAnswerShown(false);
  };
  
  useEffect(() => { resetQuiz(); }, [allQuestions]);

  const unmarkedQuestions = useMemo(() => {
    return allQuestions.filter(q => unmarkedIds.includes(q.id));
  }, [unmarkedIds, allQuestions]);

  const showNextQuestion = () => {
    setIsAnswerShown(false);
    if (unmarkedQuestions.length > 0) {
      const randomIndex = Math.floor(Math.random() * unmarkedQuestions.length);
      setCurrentQuestion(unmarkedQuestions[randomIndex]);
    } else {
      setCurrentQuestion(null);
    }
  };

  const handleShowAnswer = () => { if (currentQuestion) setIsAnswerShown(true); };
  const handleMarkAsKnown = () => { if (!currentQuestion) return; setUnmarkedIds(prevIds => prevIds.filter(id => id !== currentQuestion.id)); };
  const handleMarkAsUnknown = () => { showNextQuestion(); };
  useEffect(() => { showNextQuestion(); }, [unmarkedIds]);

  // --- 全新的 UI 渲染部分 ---
  return (
    <div className="w-full rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 text-center">
        <h2 className="text-xl font-semibold text-slate-800">熟悉题库模式</h2>
        <p className="text-sm text-slate-500 mt-1">
          剩余: <span className="font-bold text-blue-500">{unmarkedQuestions.length}</span> / {allQuestions.length}
        </p>
      </div>

      {currentQuestion ? (
        <>
          <div className="mb-4 p-5 rounded-lg bg-slate-100/80">
            <p className="text-sm font-medium text-slate-500 mb-2">问题:</p>
            <p className="text-lg text-slate-800 whitespace-pre-wrap leading-relaxed">
              {currentQuestion.question}
            </p>
          </div>

          <div className="mb-8 p-5 rounded-lg bg-emerald-50 border border-emerald-200 min-h-[100px] flex flex-col justify-center">
            <p className="text-sm font-medium text-slate-500 mb-2">答案:</p>
            {isAnswerShown ? (
              <p className="text-lg text-emerald-700 whitespace-pre-wrap leading-relaxed">
                {currentQuestion.answer}
              </p>
            ) : (
              <div 
                  className="flex items-center justify-center h-full text-slate-400" 
              >
                  点击下方“检查答案”按钮
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* 按钮1: 已掌握 */}
            <button
              onClick={handleMarkAsKnown}
              disabled={!isAnswerShown}
              className="group flex items-center justify-center gap-2 rounded-lg bg-green-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-green-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <CheckIcon /> 已掌握
            </button>
            
            {/* 按钮2: 检查答案 */}
            <button
              onClick={handleShowAnswer}
              disabled={isAnswerShown}
              className="rounded-lg bg-blue-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              检查答案
            </button>
            
            {/* 按钮3: 未掌握 */}
            <button
              onClick={handleMarkAsUnknown}
              disabled={!isAnswerShown}
              className="flex items-center justify-center gap-2 rounded-lg bg-red-500 px-4 py-3 text-white font-semibold text-base shadow-sm transition-all duration-200 ease-in-out hover:bg-red-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <XMarkIcon /> 未掌握
            </button>
          </div>
        </>
      ) : (
        <div className="text-center py-10">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-slate-800">太棒了!</h2>
          <p className="mt-2 text-base text-slate-600">你已经掌握了本题库所有题目！</p>
          <button
            onClick={resetQuiz}
            className="mt-8 rounded-lg bg-indigo-600 px-6 py-3 text-white font-semibold hover:bg-indigo-700 transition-colors"
          >
            再来一轮
          </button>
        </div>
      )}
    </div>
  );
}

