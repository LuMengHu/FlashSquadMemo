// app/lib/questionBanks.ts

// 首先，定义 Question 类型，以便各处共享
export interface Question {
  id: number;
  question: string;
  answer: string;
}

// 定义每个题库的结构
interface QuestionBank {
  id: string; // 唯一标识符，用于 URL
  name: string; // 显示在选择页的名称
  description: string; // 描述
  questions: Question[]; // 题目数组
}

// 使用一个对象来管理所有题库，方便通过 id 查找
export const questionBanks: Record<string, QuestionBank> = {
  'smoking-control': {
    id: 'smoking-control',
    name: '控烟知识题库',
    description: '关于烟草控制和健康生活的相关问题。',
    questions: [
      // 这里是你之前的所有题目
      { id: 1, question: "中國內地2011年頒佈的《公共場所衛生管理條例實施細則》規定室外公共場所設置的吸煙區不得位於以下哪個位置？", answer: "行人必經的通道上" },
      { id: 2, question: "北京市於2015年11月全面啟動控煙志願行動，安排一週中哪天進行禁煙行動？", answer: "星期三" },
      // ... 粘贴你所有的137道题到这里
      { id: 137, question: "醉酒臨床上分三期，以下正確的是？", answer: "興奮期、共濟失調期及昏睡期" },
    ]
  },
  'history-trivia': {
    id: 'history-trivia',
    name: '历史知识小测',
    description: '测试你对世界历史事件的了解程度。',
    questions: [
      { id: 1, question: "第二次世界大战开始的标志性事件是什么？", answer: "1939年德国入侵波兰" },
      { id: 2, question: "古埃及文明主要发源于哪条河流域？", answer: "尼罗河" },
    ]
  },
  'tech-quiz': {
    id: 'tech-quiz',
    name: '科技常识问答',
    description: '从互联网到人工智能的基础知识。',
    questions: [
      { id: 1, question: "HTTP的全称是什么？", answer: "超文本传输协议 (HyperText Transfer Protocol)" },
      { id: 2, question: "在JavaScript中，用于声明一个常量使用的关键字是什么？", answer: "const" },
    ]
  }
};
