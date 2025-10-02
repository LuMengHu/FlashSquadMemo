// app/quiz/[quizId]/page.tsx (完整替换)
import QuizClient from './QuizClient'; // [修正] 使用正确的默认导入

// 这是一个服务器组件，它的作用是把从URL中解析出的参数传递给客户端组件
export default function QuizPage({ params }: { params: { quizId: string } }) {
  return <QuizClient quizId={params.quizId} />; // [修正] 这里的 props 完全匹配，不再报错
}
