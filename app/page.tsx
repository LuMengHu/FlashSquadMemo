// app/page.tsx
import Link from 'next/link';

// 定义我们的题库数据
const quizBanks = [
  {
    id: 'smoking-control',
    title: '控烟知识题库',
    description: '关于烟草控制和健康生活的相关问题。',
  },
  {
    id: 'history-quiz',
    title: '历史知识小测',
    description: '测试你对世界历史事件的了解程度。',
  },
  {
    id: 'tech-qa',
    title: '科技常识问答',
    description: '从互联网到人工智能的基础知识。',
  },
];

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div className="text-center w-full max-w-2xl">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800">智能背题挑战</h1>
        <p className="mt-4 text-lg text-gray-600">选择一个题库，开始你的学习之旅！</p>
        
        <div className="mt-10 space-y-6">
          {quizBanks.map((quiz) => (
            <Link 
              key={quiz.id}
              href={`/quiz/${quiz.id}`} // <-- 关键！链接到我们的动态路由
              className="block p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
            >
              <h2 className="text-2xl font-semibold text-blue-600">{quiz.title}</h2>
              <p className="mt-2 text-gray-500">{quiz.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
