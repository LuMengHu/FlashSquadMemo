import * as schema from '@/lib/schema'; // 导入所有 schema 定义
import { teams, members, questionBanks, questions, memberQuestionProgress } from '@/lib/schema';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import 'dotenv/config'; // 确保可以加载 .env 文件

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set");

const sql = neon(databaseUrl);

// ===== 核心修正：将 schema 注入到 drizzle 实例中 =====
const dbForSeed = drizzle(sql, { schema });
// ========================================================

// ===== 在这里定义你的题库、题目和团队 =====
const SEED_TEAMS = ['雷火队', '闪电队'];
const SEED_QUESTION_BANKS = [
  {
    name: '题库A：历史与文化',
    description: '涵盖中国古代历史及传统文化知识。',
    questions: [
      { content: '中国的四大发明是什么？', answer: '造纸术、印刷术、指南针、火药' },
      { content: '唐朝的开国皇帝是谁？', answer: '李渊（唐高祖）' },
    ]
  },
  {
    name: '题库B：地理与自然',
    description: '关于中国地理风貌和自然知识的题目。',
    questions: [
      { content: '中国的最长的河流是什么？', answer: '长江' },
    ]
  },
  {
    name: '题库C：科技与生活',
    description: '现代科技常识及生活小知识。',
    questions: [
      { content: 'HTTP协议的全称是什么？', answer: '超文本传输协议' },
    ]
  }
];
// ============================================

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 1. 清理旧数据 (顺序很重要)
  console.log('🗑️  正在清理旧数据...');
  await dbForSeed.delete(memberQuestionProgress);
  await dbForSeed.delete(questions);
  await dbForSeed.delete(members);
  await dbForSeed.delete(questionBanks);
  await dbForSeed.delete(teams);
  console.log('✅ 清理完成');

  // 2. 创建团队
  console.log('🧑‍🤝‍🧑 正在创建测试团队...');
  const password = 'password123';
  const passwordHash = await bcrypt.hash(password, 10);
  const createdTeams = await dbForSeed.insert(teams).values(
    SEED_TEAMS.map(name => ({ name, passwordHash }))
  ).returning();
  console.log(`✅ 成功创建 ${createdTeams.length} 个测试团队。默认密码是: ${password}`);

  // 3. 创建题库和题目
  console.log('🏦 正在创建题库和题目...');
  const createdBanks = [];
  for (const bankData of SEED_QUESTION_BANKS) {
    const [insertedBank] = await dbForSeed.insert(questionBanks).values({
      name: bankData.name,
      description: bankData.description,
    }).returning();
    
    if (bankData.questions.length > 0) {
      await dbForSeed.insert(questions).values(
        bankData.questions.map(q => ({
          content: q.content,
          answer: q.answer,
          questionBankId: insertedBank.id,
        }))
      );
    }
    createdBanks.push(insertedBank);
  }
  console.log(`✅ 成功创建 ${createdBanks.length} 个题库及其题目。`);

  // 4. 为每个团队创建3个成员，并分配题库
  console.log('👤 正在创建成员并分配席位...');
  for (const team of createdTeams) {
    for (let i = 0; i < createdBanks.length; i++) {
      const bank = createdBanks[i];
      const memberName = `席位-${i + 1} (${bank.name.substring(0, 4)})`;
      
      const [createdMember] = await dbForSeed.insert(members).values({
        teamId: team.id,
        assignedQuestionBankId: bank.id,
        name: memberName,
      }).returning();
      
      // 5. 为新创建的成员初始化所有对应题目的进度
      // ---- 这里使用了 db.query，所以 dbForSeed 必须知道 schema ----
      const bankQuestions = await dbForSeed.query.questions.findMany({
          where: (questions, { eq }) => eq(questions.questionBankId, bank.id)
      });
      
      if (bankQuestions.length > 0) {
        await dbForSeed.insert(memberQuestionProgress).values(
          bankQuestions.map(q => ({
            memberId: createdMember.id,
            questionId: q.id,
            // 我们可以在这里初始化 correctStreak
            correctStreak: 0,
          }))
        );
      }
    }
  }
  console.log('✅ 成员和学习进度初始化完成。');
  console.log('🎉 种子数据填充完成！');
}

main().catch((err) => {
  console.error('❌ 填充种子数据时发生错误:', err);
  process.exit(1);
});
