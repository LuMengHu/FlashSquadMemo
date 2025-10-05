// app/quiz/[quizId]/QuizClient.tsx (完整替换)
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader, AlertTriangle, ChevronLeft, BookCopy } from 'lucide-react';
import type { Question } from '@/types/question';
import FamiliarizeMode from '@/components/FamiliarizeMode';
import BuzzerMode from '@/components/BuzzerMode';
import PoetryMode from '@/components/PoetryMode'; // 引入新模式

type MainMode = 'practice' | 'buzzer';
type PracticeSubMode = 'all' | 'review';
type QuestionBankMode = 'standard' | 'poetry-pair';

export default function QuizClient({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [mainMode, setMainMode] = useState<MainMode>('practice');
  const [practiceSubMode, setPracticeSubMode] = useState<PracticeSubMode>('all');
  const [questionBankMode, setQuestionBankMode] = useState<QuestionBankMode>('standard');
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [reviewQuestions, setReviewQuestions] = useState<Question[]>([]);
  const [loadingState, setLoadingState] = useState('loading');
  const [error, setError] = useState<string | null>(null);

  const fetchLists = useCallback(async () => {
    setLoadingState('loading');
    setError(null);
    const token = localStorage.getItem('authToken');
    const memberId = localStorage.getItem('selectedMemberId');
    if (!token || !memberId) {
      setError("认证信息丢失，请重新登录。");
      setLoadingState('error');
      return;
    }
    try {
      const [allRes, reviewRes] = await Promise.all([
        fetch(`/api/get-questions/${quizId}?memberId=${memberId}&mode=all`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetch(`/api/get-questions/${quizId}?memberId=${memberId}&mode=review`, { headers: { 'Authorization': `Bearer ${token}` } })
      ]);
      if (!allRes.ok || !reviewRes.ok) {
        const errorData = !allRes.ok ? await allRes.json() : await reviewRes.json();
        throw new Error(errorData.error || '获取题目列表失败');
      }
      const allData = await allRes.json();
      const reviewData = await reviewRes.json();
      
      setQuestionBankMode(allData.mode);
      setAllQuestions(allData.questions);
      setReviewQuestions(reviewData.questions);
      
      setLoadingState('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : "未知错误");
      setLoadingState('error');
    }
  }, [quizId]);

  useEffect(() => { fetchLists(); }, [fetchLists]);

  const handleProgressUpdate = useCallback(() => {
    const token = localStorage.getItem('authToken');
    const memberId = localStorage.getItem('selectedMemberId');
    if (!token || !memberId) return;
    fetch(`/api/get-questions/${quizId}?memberId=${memberId}&mode=review`, { 
      headers: { 'Authorization': `Bearer ${token}` } 
    })
      .then(res => res.json())
      .then(data => {
        // 后台只更新题目列表，不更新 mode
        setReviewQuestions(data.questions);
      })
      .catch(err => console.error("后台刷新复习列表失败:", err));
  }, [quizId]);
  
  const currentQuestions = practiceSubMode === 'all' ? allQuestions : reviewQuestions;

  const renderContent = () => {
    if (loadingState === 'loading') return <div className="flex h-full flex-col items-center justify-center"><Loader className="h-12 w-12 animate-spin text-indigo-500" /><p className="mt-4 text-gray-500 dark:text-gray-400">正在加载题目...</p></div>;
    if (loadingState === 'error') return <div className="flex h-full flex-col items-center justify-center text-center"><AlertTriangle className="h-12 w-12 text-red-500" /><p className="mt-4 font-semibold text-red-600 dark:text-red-400">加载失败</p><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{error}</p></div>;
    
    if (mainMode === 'practice') {
      if (practiceSubMode === 'review' && reviewQuestions.length === 0) { return <div className="flex h-full flex-col items-center justify-center text-center"><BookCopy size={48} className="mx-auto mb-4 text-green-500" /><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">太棒了！</h2><p className="mt-2 text-gray-600 dark:text-gray-400">当前没有需要复习的题目。</p></div>; }
      if (currentQuestions.length === 0) { return <div className="flex h-full flex-col items-center justify-center text-center"><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">该题库还没有题目。</h2></div>; }
      
      // 根据 questionBankMode 动态选择渲染的组件
      if (questionBankMode === 'poetry-pair') {
        return <PoetryMode questions={currentQuestions} onProgressUpdate={handleProgressUpdate} mode={practiceSubMode} />;
      }
      return <FamiliarizeMode questions={currentQuestions} onProgressUpdate={handleProgressUpdate} mode={practiceSubMode} />;
    }
    
    if (mainMode === 'buzzer') {
      if (allQuestions.length === 0) { return <div className="flex h-full flex-col items-center justify-center text-center"><h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">题库为空，无法开始抢答。</h2></div>; }
      return <BuzzerMode questions={allQuestions} />;
    }
  };
  
  return (
    <div className="h-[100dvh] w-full bg-gray-50 p-4 dark:bg-gray-900 flex flex-col sm:items-center sm:justify-center">
      <button 
        onClick={() => router.push('/team/select-seat')} 
        className="fixed top-4 left-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 shadow-lg transition-transform hover:scale-110 sm:h-12 sm:w-12 sm:top-6 sm:left-6" 
        aria-label="返回席位选择">
        <ChevronLeft className="h-6 w-6 sm:h-7 sm:w-7" />
      </button>

      <div className="m-auto flex w-full max-w-3xl flex-col rounded-xl bg-white p-4 shadow-2xl dark:bg-gray-800 sm:p-6 md:p-8 max-h-full overflow-y-auto">
        <div className="mb-6 flex shrink-0 flex-col border-b border-gray-200 pb-4 dark:border-gray-700 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0"><button onClick={() => setMainMode('practice')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${mainMode === 'practice' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>练习模式</button><button onClick={() => setMainMode('buzzer')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${mainMode === 'buzzer' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>抢答模式</button></div>
          {mainMode === 'practice' && (<div className="relative grid grid-cols-2 w-full sm:w-auto shrink-0 items-center rounded-full bg-gray-200 dark:bg-gray-700 p-1">
            <span className="absolute top-0 h-[calc(100%)] w-[calc(50%-4px)] rounded-full bg-white dark:bg-gray-800 shadow-md transition-transform duration-300 ease-in-out" style={{ transform: practiceSubMode === 'review' ? 'translateX(calc(100% + 8px))' : 'translateX(0)' }}>
            </span><button onClick={() => setPracticeSubMode('all')} className="relative z-10 flex items-center justify-center rounded-full py-1 px-2 text-sm font-semibold text-center transition-colors duration-300">
            <span className={practiceSubMode === 'all' ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}>题目</span></button>
            <button onClick={() => setPracticeSubMode('review')} className="relative z-10 flex items-center justify-center rounded-full py-1 px-2 text-sm font-semibold text-center transition-colors duration-300">
              <div className={`flex items-center justify-center ${practiceSubMode === 'review' ? 'text-gray-900 dark:text-gray-50' : 'text-gray-500 dark:text-gray-400'}`}><span>复习</span>{reviewQuestions.length > 0 && <span className="ml-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {reviewQuestions.length > 9 ? '9+' : reviewQuestions.length}</span>}</div></button></div>)}
        </div>
        
        <div className="min-h-0 flex-grow flex flex-col">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
