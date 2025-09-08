import QuizClient from './QuizClient';

// 这是一个服务器组件，它的作用是把从URL中解析出的参数传递给客户端组件
export default function QuizPage({ params }: { params: { quizId: string } }) {
  return <QuizClient quizId={params.quizId} />;
}
