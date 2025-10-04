// types/question.ts (最终修正版)

export type Question = {
  id: string;
  question: string; // <-- [核心修正] 将 'content' 改回 'question'
  answer: string;
  metadata?: Record<string, any> | null;
};
