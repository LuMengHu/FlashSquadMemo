'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Gamepad2, Loader, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { Question } from '@/types/question';
import FamiliarizeMode from '@/components/FamiliarizeMode';
import BuzzerMode from '@/components/BuzzerMode';

type MainMode = 'practice' | 'buzzer';
type PracticeSubMode = 'all' | 'review';

export default function QuizClient({ quizId }: { quizId: string }) {
  const router = useRouter();
  const [mainMode, setMainMode] = useState<MainMode>('practice');
  const [practiceSubMode, setPracticeSubMode] = useState<PracticeSubMode>('all');
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
      if (!allRes.ok || !reviewRes.ok) throw new Error('获取题目列表失败');
      const allData = await allRes.json();
      const reviewData = await reviewRes.json();
      setAllQuestions(allData);
      setReviewQuestions(reviewData);
      setLoadingState('success');
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      setError(msg);
      setLoadingState('error');
    }
  }, [quizId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  const handleProgressUpdate = useCallback(() => {
    const token = localStorage.getItem('authToken');
    const memberId = localStorage.getItem('selectedMemberId');
    if (!token || !memberId) return;
    fetch(`/api/get-questions/${quizId}?memberId=${memberId}&mode=review`, { headers: { 'Authorization': `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setReviewQuestions(data))
      .catch(err => console.error("刷新复习列表失败:", err));
  }, [quizId]);
  
  const handleSubModeChange = (newMode: PracticeSubMode) => {
    if (newMode !== practiceSubMode) setPracticeSubMode(newMode);
  };

  const currentQuestions = practiceSubMode === 'all' ? allQuestions : reviewQuestions;

  const renderContent = () => {
    if (loadingState === 'loading') return <div className="flex flex-col items-center justify-center h-64"><Loader className="w-12 h-12 animate-spin text-blue-500" /><p className="mt-4 text-gray-500">正在加载题目...</p></div>;
    if (loadingState === 'error') return <div className="flex flex-col items-center justify-center h-64 text-center"><AlertTriangle className="w-12 h-12 text-red-500" /><p className="mt-4 font-semibold text-red-600">加载失败</p><p className="mt-2 text-sm text-gray-500">{error}</p></div>;
    if (mainMode === 'practice') {
      if (currentQuestions.length === 0) {
        const message = practiceSubMode === 'review' ? "当前没有需要复习的题目，太棒了！" : "该题库还没有题目。";
        return <div className="text-center py-10"><h2 className="text-2xl font-bold">{message}</h2></div>;
      }
      return <FamiliarizeMode questions={currentQuestions} onProgressUpdate={handleProgressUpdate} mode={practiceSubMode} />;
    }
    if (mainMode === 'buzzer') return <BuzzerMode questions={allQuestions} />;
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-100 p-4">
      <button onClick={() => router.push('/team/select-seat')} className="fixed top-6 left-6 z-20 flex h-12 w-12 items-center justify-center rounded-full bg-white text-gray-700 shadow-lg transition-transform hover:scale-110 hover:bg-gray-50" aria-label="返回席位选择"><ChevronLeft className="h-7 w-7" /></button>
      <div className="w-full max-w-3xl rounded-xl bg-white p-6 md:p-8 shadow-2xl">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200 pb-4">
          <div className="flex items-center space-x-2 mb-4 sm:mb-0">
            <button onClick={() => setMainMode('practice')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${mainMode === 'practice' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>练习模式</button>
            <button onClick={() => setMainMode('buzzer')} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors duration-200 ${mainMode === 'buzzer' ? 'bg-indigo-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100'}`}>抢答模式</button>
          </div>
          {mainMode === 'practice' && (
            <div className="relative flex w-full sm:w-auto shrink-0 items-center rounded-full bg-gray-200 p-1">
              {/* ===== 需求1：UI 修正 ===== */}
              <span className="absolute top-1 bottom-1 left-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out"
                    style={{ transform: practiceSubMode === 'review' ? 'translateX(100%)' : 'translateX(0)' }}>
              </span>
              <button onClick={() => handleSubModeChange('all')} className={`relative z-10 w-1/2 rounded-full py-1 px-2 text-sm font-semibold text-center transition-colors duration-300 ${practiceSubMode === 'all' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>题目</button>
              <button onClick={() => handleSubModeChange('review')} className={`relative z-10 w-1/2 rounded-full py-1 px-2 text-sm font-semibold text-center transition-colors duration-300 ${practiceSubMode === 'review' ? 'text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
                <div className="flex items-center justify-center">
                  <span>复习</span>
                  {reviewQuestions.length > 0 && (
                    <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">{reviewQuestions.length}</span>
                  )}
                </div>
              </button>
            </div>
          )}
        </div>
        <div className="min-h-[400px]">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
