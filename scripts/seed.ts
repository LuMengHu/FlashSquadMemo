import 'dotenv/config';
import { db } from '../lib/db';
import { teams, members, questionBanks, questions, memberQuestionProgress } from '../lib/schema';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// --- 类型定义 (与之前相同) ---
type TeamSeed = {
  name: string;
  password: string;
};

type QuestionBankSeed = {
  key: string;
  name: string;
  description: string;
};

type QuestionSeed = {
  bankKey: string;
  content: string;
  answer: string;
};

// --- 数据库连接 (与之前相同) ---
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set in environment variables.");
}
const sql = neon(databaseUrl);
const dbForSeed = drizzle(sql);

// --- 主函数 ---
async function main() {
  console.log('🌱 Seeding started...');

  // --- 1. 读取 JSON 数据文件 ---
  console.log('⏳ Reading data from JSON files...');
  const teamsData: TeamSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teams.json'), 'utf-8'));
  const banksData: QuestionBankSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questionBanks.json'), 'utf-8'));
  const questionsData: QuestionSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questions.json'), 'utf-8'));
  console.log(`✅ Found ${teamsData.length} teams, ${banksData.length} question banks, and ${questionsData.length} questions.`);


  // --- 2. 清空所有表 ---
  console.log('🗑️  Clearing existing data...');
  await dbForSeed.delete(memberQuestionProgress);
  await dbForSeed.delete(questions);
  await dbForSeed.delete(members);
  await dbForSeed.delete(questionBanks);
  await dbForSeed.delete(teams);
  console.log('✅ Data cleared.');

  // --- 3. 插入题库 ---
  console.log('📚 Inserting question banks...');
  // [FIX]: 关键修复！Map 的值类型必须是 string，因为 ID 是 UUID
  const bankKeyToIdMap = new Map<string, string>();
  
  const createdBanks = await dbForSeed.insert(questionBanks).values(
    banksData.map(b => ({ name: b.name, description: b.description }))
  ).returning();
  
  // .returning() 返回的 createdBanks[i].id 是一个 UUID 字符串
  for (let i = 0; i < banksData.length; i++) {
    bankKeyToIdMap.set(banksData[i].key, createdBanks[i].id);
  }
  console.log(`✅ Created ${createdBanks.length} question banks.`);

  // --- 4. 插入题目 ---
  console.log('❓ Inserting questions...');
  const questionsToInsert = questionsData.map(q => {
    // [FIX]: bankId 现在正确地从 Map 中获取为 string 类型
    const bankId = bankKeyToIdMap.get(q.bankKey);
    if (!bankId) {
      throw new Error(`Invalid bankKey "${q.bankKey}" found in questions.json.`);
    }
    return {
      questionBankId: bankId, // 类型完全匹配，无需转换
      content: q.content,
      answer: q.answer,
    };
  });

  if (questionsToInsert.length > 0) {
    await dbForSeed.insert(questions).values(questionsToInsert);
    console.log(`✅ Inserted ${questionsToInsert.length} questions.`);
  }

  // --- 5. 插入团队和成员 ---
  console.log('👥 Inserting teams and members...');
  for (const team of teamsData) {
    const hashedPassword = await bcrypt.hash(team.password, 10);
    const [createdTeam] = await dbForSeed.insert(teams).values({
      name: team.name,
      passwordHash: hashedPassword,
    }).returning(); // createdTeam.id 是一个 UUID 字符串

    console.log(`⏳ Creating members for team: ${createdTeam.name}...`);

    const membersToInsert = createdBanks.map(bank => ({
      // [FIX]: createdTeam.id 和 bank.id 都已经是正确的 string (uuid) 类型
      teamId: createdTeam.id,
      assignedQuestionBankId: bank.id,
      name: `席位-${bank.name}`,
    }));

    if(membersToInsert.length > 0) {
        await dbForSeed.insert(members).values(membersToInsert);
        console.log(`✅ Created ${membersToInsert.length} member seats for team ${createdTeam.name}.`);
    }
  }

  // --- 6. (可选) 进度记录 ---
  console.log('⏩ Skipping progress generation for now.');
  
  console.log('\n✨ Seeding finished successfully! ✨');
}

main().catch((err) => {
  console.error('\n❌ An error occurred during seeding:');
  console.error(err);
  process.exit(1);
});
