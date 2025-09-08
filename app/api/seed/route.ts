// app/api/seed/route.ts

import { db } from '@/lib/db';
import { teams, questionBanks, questions } from '@/lib/schema';
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';

// ... (类型定义和 SEED_DATA 保持不变)
type SeedDataItem = {
  bank: {
    name: string;
    description: string;
  };
  questions: {
    question: string;
    answer: string;
  }[];
};

const SEED_DATA: SeedDataItem[] = [
  {
    bank: {
      name: '题库A：历史与文化',
      description: '涵盖中国古代历史及传统文化知识。'
    },
    questions: [
      { question: '中国的四大发明是什么？', answer: '造纸术、印刷术、指南针、火药' },
      { question: '唐朝的开国皇帝是谁？', answer: '李渊（唐高祖）' },
      { question: '“卧薪尝胆”这个成语与哪位历史人物有关？', answer: '越王勾践' },
    ]
  },
  {
    bank: {
      name: '题库B：地理与自然',
      description: '关于中国地理风貌和自然知识的题目。'
    },
    questions: [
      { question: '中国的最长的河流是什么？', answer: '长江' },
      { question: '哪个省份的简称是“湘”？', answer: '湖南省' },
    ]
  },
  {
    bank: {
      name: '题库C：科技与生活',
      description: '现代科技常识及生活小知识。'
    },
    questions: [
      { question: 'HTTP协议的全称是什么？', answer: '超文本传输协议 (HyperText Transfer Protocol)' },
      { question: '构成物质的基本单位是什么？', answer: '原子' },
    ]
  }
];

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development mode.' },
      { status: 403 }
    );
  }

  try {
    console.log('🌱 开始填充种子数据...');

    // 1. 清理旧数据
    console.log('🗑️  正在清理旧数据...');
    await db.delete(teams);
    await db.delete(questionBanks);
    console.log('✅ 清理完成');
    
    // 创建测试团队 (已修正为循环插入)
    console.log('🧑‍🤝‍🧑 正在创建测试团队...');
    const password = 'password123';
    const passwordHash = await bcrypt.hash(password, 10);
    const seedTeamsData = [
        { name: '一号战队', passwordHash: passwordHash },
        { name: '二号战队', passwordHash: passwordHash },
    ];
    for (const teamData of seedTeamsData) {
        await db.insert(teams).values(teamData);
    }
    console.log(`✅ 成功创建 ${seedTeamsData.length} 个测试团队。`);
    console.log(`🔑 默认密码是: ${password}`);

    // 2. 插入题库
    console.log('🏦 正在插入题库...');
    const bankData = SEED_DATA.map(item => item.bank);
    const insertedBanks = await db.insert(questionBanks).values(bankData).returning();
    console.log(`✅ 成功插入 ${insertedBanks.length} 个题库`);

    // 3. 准备并插入题目
    console.log('❓ 正在准备题目数据...');
    const allQuestions = [];
    for (const item of SEED_DATA) {
      const currentBank = insertedBanks.find(b => b.name === item.bank.name);
      if (!currentBank) continue;
      for (const q of item.questions) {
        allQuestions.push({ content: q.question, answer: q.answer, questionBankId: currentBank.id });
      }
    }

    if (allQuestions.length > 0) {
      console.log(`📚 正在插入 ${allQuestions.length} 道题目...`);
      // =================================================================
      // 核心修正：同样将题目的批量插入改为循环单条插入
      // =================================================================
      for (const questionData of allQuestions) {
        await db.insert(questions).values(questionData);
      }
      console.log('✅ 题目插入成功');
    }

    console.log('🎉 种子数据填充完成！');
    return NextResponse.json({
      message: '🎉 种子数据填充成功!',
      insertedTeams: seedTeamsData.length,
      insertedBanks: insertedBanks.length,
      insertedQuestions: allQuestions.length,
    });

  } catch (e) {
    console.error('❌ 填充种子数据时发生错误:', e);
    const errorMessage = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: '填充种子数据时发生错误', details: errorMessage },
      { status: 500 }
    );
  }
}
