// app/quiz/[quizId]/page.tsx

import QuizClient from './QuizClient'; // 引入我们刚刚创建的组件

// 我们暂时不需要从这里获取题库 ID，因为数据是硬编码在 QuizClient 里的
// 未来我们会把 params.quizId 传给 QuizClient 来获取真实数据
export default function QuizPage({ params }: { params: { quizId: string } }) {
  
  // 直接渲染客户端组件
  return <QuizClient />;
}
