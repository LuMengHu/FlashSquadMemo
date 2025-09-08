// app/quiz/[bankId]/page.tsx
'use client';

import { useState } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import FamiliarizeMode from '@/components/FamiliarizeMode';
import BuzzerMode from '@/components/BuzzerMode';
import { questionBanks } from '@/app/lib/questionBanks';

type QuizMode = 'familiarize' | 'buzzer';

const ArrowLeftIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5"><path fillRule="evenodd" d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z" clipRule="evenodd" /></svg>
);

export default function QuizPage({ params }: { params: { bankId: string } }) {
  const { bankId } = params;
  const selectedBank = questionBanks[bankId];
  if (!selectedBank) { notFound(); }

  const [mode, setMode] = useState<QuizMode>('familiarize');

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-2xl">
        <div className="relative flex justify-center items-center mb-6 h-10">
          <Link href="/" className="absolute left-0 inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors font-medium">
            <ArrowLeftIcon />
            所有题库
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">{selectedBank.name}</h1>
        </div>

        <div className="flex justify-center mb-6">
          <div className="p-1 bg-slate-200/60 rounded-lg flex space-x-1">
            <button
              onClick={() => setMode('familiarize')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-28 ${
                mode === 'familiarize' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              熟悉题库
            </button>
            <button
              onClick={() => setMode('buzzer')}
              className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-colors w-28 ${
                mode === 'buzzer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
              }`}
            >
              抢答体验
            </button>
          </div>
        </div>
        
        <div>
          {mode === 'familiarize' && <FamiliarizeMode questions={selectedBank.questions} />}
          {mode === 'buzzer' && <BuzzerMode questions={selectedBank.questions} />}
        </div>
      </div>
    </main>
  );
}
