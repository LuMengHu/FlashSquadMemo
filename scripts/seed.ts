import 'dotenv/config';
import { db } from '../lib/db';
import { teams, members, questionBanks, questions, memberQuestionProgress } from '../lib/schema';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}

const sql = neon(databaseUrl);
const dbForSeed = drizzle(sql);


async function main() {
  console.log('Seeding started...');

  // -------------------- 1. 清空所有表 (顺序很重要，从依赖别人的表开始) --------------------
  console.log('Clearing existing data...');
  await dbForSeed.delete(memberQuestionProgress);
  await dbForSeed.delete(questions);
  await dbForSeed.delete(members);
  await dbForSeed.delete(questionBanks);
  await dbForSeed.delete(teams);
  console.log('Data cleared.');

  // -------------------- 2. 创建一个测试团队 --------------------
  const teamPassword = 'password123';
  const hashedPassword = await bcrypt.hash(teamPassword, 10);
  
  const [createdTeam] = await dbForSeed.insert(teams).values({
    name: '雷火队',
    passwordHash: hashedPassword,
  }).returning();

  console.log(`Created team: ${createdTeam.name} (password: ${teamPassword})`);

  // -------------------- 3. 创建三个题库 --------------------
  const [bankA, bankB, bankC] = await dbForSeed.insert(questionBanks).values([
    { name: '题库A (历史文化)', description: '关于中国历史和文化的题目' },
    { name: '题库B (科学技术)', description: '涵盖物理、化学、生物等科技知识' },
    { name: '题库C (文学艺术)', description: '涉及中外文学名著和艺术常识' },
  ]).returning();

  console.log('Created 3 question banks.');

  // -------------------- 4. 为每个题库创建一些示例题目 --------------------
  await dbForSeed.insert(questions).values([
    // 题库A的题目
    { questionBankId: bankA.id, content: '唐朝的开国皇帝是谁？', answer: '李渊' },
    { questionBankId: bankA.id, content: '《清明上河图》描绘的是哪个朝代的都城景象？', answer: '北宋' },
    // 题库B的题目
    { questionBankId: bankB.id, content: '水的化学式是什么？', answer: 'H₂O' },
    { questionBankId: bankB.id, content: '地球上最坚硬的天然物质是什么？', answer: '钻石' },
    // 题库C的题目
    { questionBankId: bankC.id, content: '《百年孤独》的作者是谁？', answer: '加夫列尔·加西亚·马尔克斯' },
    { questionBankId: bankC.id, content: '名画《蒙娜丽莎》是谁的作品？', answer: '列奥纳多·达·芬奇' },
  ]);

  console.log('Created sample questions for each bank.');

  // -------------------- 5. 创建三个“席位/成员”，并分别与团队和题库关联 --------------------
  const [member1, member2, member3] = await dbForSeed.insert(members).values([
    {
      teamId: createdTeam.id,
      assignedQuestionBankId: bankA.id,
      name: `席位-${bankA.name}`,
    },
    {
      teamId: createdTeam.id,
      assignedQuestionBankId: bankB.id,
      name: `席位-${bankB.name}`,
    },
    {
      teamId: createdTeam.id,
      assignedQuestionBankId: bankC.id,
      name: `席位-${bankC.name}`,
    },
  ]).returning();

  console.log('Created 3 member seats and linked them to the team and banks.');

  // -------------------- 6. (可选) 为每个成员预生成进度记录 --------------------
  const allQuestions = await dbForSeed.select().from(questions);
  // 明确定义 progressEntries 数组的类型，使其符合 memberQuestionProgress 表的插入要求
  const progressEntries: (typeof memberQuestionProgress.$inferInsert)[] = [];

  for (const q of allQuestions) {
    if (q.questionBankId === bankA.id) {
      progressEntries.push({ memberId: member1.id, questionId: q.id, status: 'unanswered' });
    } else if (q.questionBankId === bankB.id) {
      progressEntries.push({ memberId: member2.id, questionId: q.id, status: 'unanswered' });
    } else if (q.questionBankId === bankC.id) {
      progressEntries.push({ memberId: member3.id, questionId: q.id, status: 'unanswered' });
    }
  }

  if (progressEntries.length > 0) {
    await dbForSeed.insert(memberQuestionProgress).values(progressEntries);
    console.log('Pre-generated initial progress records for all members.');
  }

  console.log('Seeding finished successfully!');
}

main().catch((err) => {
  console.error('An error occurred during seeding:', err);
  process.exit(1);
});
