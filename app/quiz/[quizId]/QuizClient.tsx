// app/quiz/[quizId]/QuizClient.tsx
'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { Question } from '@/types/question'; // 引入我们统一的类型
import BuzzerMode from '@/components/BuzzerMode'; // 引入抢答模式组件

// 定义模式类型
type QuizMode = 'study' | 'buzzer';

// 临时的、硬编码的题库数据
const questions: Question[] = [
  { id: 1, question: 'HTTP 的全称是什么？', answer: '超文本传输协议 (HyperText Transfer Protocol)' },
  { id: 2, question: 'React 是一个库还是一个框架？', answer: '官方定义它为一个用于构建用户界面的 JavaScript 库。' },
  { id: 3, question: 'Tailwind CSS 的核心思想是什么？', answer: 'Utility-First (功能优先)，通过组合原子化的 CSS 类来构建界面。' },
];

// “熟悉题库”模式的UI组件
const StudyMode = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isQuizFinished, setIsQuizFinished] = useState(false);

  const handleNextQuestion = () => {
    setShowAnswer(false);
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsQuizFinished(true);
    }
  };
  
  const handleRestartQuiz = () => {
    setCurrentIndex(0);
    setShowAnswer(false);
    setIsQuizFinished(false);
  };

  if (isQuizFinished) {
    return (
      <div className="text-center">
        <h2 className="text-3xl font-bold text-green-500">恭喜你，完成了所有题目！</h2>
        <p className="mt-4 text-gray-600">温故而知新，可以再来一遍加深记忆哦。</p>
        <button 
          onClick={handleRestartQuiz}
          className="mt-8 inline-flex items-center justify-center space-x-2 rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
        >
          <RefreshCw size={20} />
          <span>再来一次</span>
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <div>
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-800">熟悉题库模式</h2>
        <p className="mt-2 text-sm text-gray-500">
          题目进度: {currentIndex + 1} / {questions.length}
        </p>
      </div>
      <div className="mt-8 space-y-6">
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-5">
          <h3 className="font-semibold text-gray-600">问题:</h3>
          <p className="mt-2 text-lg text-gray-900">{currentQuestion.question}</p>
        </div>
        <div className={`rounded-lg border-l-4 p-5 transition-all duration-300 ${
            showAnswer ? 'border-green-500 bg-green-50' : 'border-gray-300 bg-gray-100'
          }`}
        >
          <h3 className="font-semibold text-gray-600">答案:</h3>
          {showAnswer ? (
            <p className="mt-2 text-lg text-gray-900">{currentQuestion.answer}</p>
          ) : (
            <p className="mt-2 text-lg text-gray-400 italic">点击“检查答案”查看</p>
          )}
        </div>
      </div>
      <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
        <button 
          onClick={handleNextQuestion}
          disabled={!showAnswer} // 关键改动：当答案未显示时禁用
          className={`flex items-center justify-center space-x-2 rounded-lg py-3 font-semibold text-white transition ${
            showAnswer ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <CheckCircle size={20} />
          <span>已掌握</span>
        </button>
        <button 
          onClick={() => setShowAnswer(true)}
          disabled={showAnswer} // 关键改动：当答案已显示时禁用
          className={`rounded-lg py-3 font-semibold transition ${
            showAnswer ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          检查答案
        </button>
        <button 
          onClick={handleNextQuestion}
          disabled={!showAnswer} // 关键改动：当答案未显示时禁用
          className={`flex items-center justify-center space-x-2 rounded-lg py-3 font-semibold text-white transition ${
            showAnswer ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          <XCircle size={20} />
          <span>未掌握</span>
        </button>
      </div>
    </div>
  );
}

// 主组件
export default function QuizClient() {
  const [mode, setMode] = useState<QuizMode>('study');

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl">
        {/* 顶部标签页，现在可以切换模式了 */}
        <div className="mb-8 flex justify-center space-x-4 border-b pb-4">
          <button 
            onClick={() => setMode('study')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'study' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            熟悉题库
          </button>
          <button 
            onClick={() => setMode('buzzer')}
            className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
              mode === 'buzzer' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
            }`}
          >
            抢答体验
          </button>
        </div>

        {/* 根据模式显示不同的组件 */}
        {mode === 'study' ? <StudyMode /> : <BuzzerMode questions={questions} />}
      </div>
    </div>
  );
}
