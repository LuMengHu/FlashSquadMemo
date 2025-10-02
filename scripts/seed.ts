// scripts/seed.ts (完整替换)
import 'dotenv/config';
import { db } from '../lib/db';
import { teams, members, questionBanks, questions, memberQuestionProgress } from '../lib/schema';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';

// 类型定义
type TeamSeed = { key: string; name: string; password: string; };
type QuestionBankSeed = { teamKey: string; key: string; name: string; description: string; mode?: 'standard' | 'poetry-pair'; };
type QuestionSeed = { bankKey: string; content: string; answer: string; };

// 数据库连接
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
const sql = neon(databaseUrl);
const dbForSeed = drizzle(sql);

async function main() {
  console.log('🌱 Seeding started...');

  // 1. 读取数据文件
  const teamsData: TeamSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teams.json'), 'utf-8'));
  const banksData: QuestionBankSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questionBanks.json'), 'utf-8'));
  const questionsData: QuestionSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questions.json'), 'utf-8'));
  console.log(`✅ Found ${teamsData.length} teams, ${banksData.length} banks, ${questionsData.length} questions.`);

  // 2. 清空数据
  console.log('🗑️  Clearing existing data...');
  await dbForSeed.delete(memberQuestionProgress);
  await dbForSeed.delete(questions);
  await dbForSeed.delete(members);
  await dbForSeed.delete(questionBanks);
  await dbForSeed.delete(teams);
  console.log('✅ Data cleared.');

  // 3. 插入所有数据
  console.log('👥 Inserting all data...');
  
  // 用于存储所有创建的题目，方便后续关联
  const allCreatedQuestions: (typeof questions.$inferSelect)[] = [];

  for (const teamSeed of teamsData) {
    // A. 创建团队
    const hashedPassword = await bcrypt.hash(teamSeed.password, 10);
    const [createdTeam] = await dbForSeed.insert(teams).values({ name: teamSeed.name, passwordHash: hashedPassword }).returning();
    console.log(`  -> Created team: ${createdTeam.name}`);

    // B. 创建该团队的题库
    const teamBanksSeed = banksData.filter(b => b.teamKey === teamSeed.key);
    if (teamBanksSeed.length === 0) continue;
    const banksToInsert = teamBanksSeed.map(b => ({
    teamId: createdTeam.id,
    name: b.name,
    description: b.description,
    mode: b.mode || 'standard', // 如果 JSON 中没有提供 mode，则默认为 'standard'
  }));
  
  const createdBanks = await dbForSeed.insert(questionBanks).values(banksToInsert).returning();
    console.log(`    -> Created ${createdBanks.length} question banks for ${createdTeam.name}`);

    // C. 创建这些题库的题目
    const bankKeyToIdMap = new Map<string, string>();
    for (let i = 0; i < teamBanksSeed.length; i++) {
        bankKeyToIdMap.set(teamBanksSeed[i].key, createdBanks[i].id);
    }
    const bankKeysForTeam = teamBanksSeed.map(b => b.key);
    const questionsForTeamSeed = questionsData.filter(q => bankKeysForTeam.includes(q.bankKey));
    if (questionsForTeamSeed.length > 0) {
        const questionsToInsert = questionsForTeamSeed.map(q => ({ questionBankId: bankKeyToIdMap.get(q.bankKey)!, content: q.content, answer: q.answer }));
        const createdQuestions = await dbForSeed.insert(questions).values(questionsToInsert).returning();
        allCreatedQuestions.push(...createdQuestions); // 存储起来
        console.log(`      -> Inserted ${createdQuestions.length} questions.`);
    }

    // D. 为该团队创建成员/席位
    const membersToInsert = createdBanks.map(bank => ({ teamId: createdTeam.id, assignedQuestionBankId: bank.id, name: `${bank.name}` }));
    if(membersToInsert.length > 0) {
        await dbForSeed.insert(members).values(membersToInsert);
        console.log(`    -> Created ${membersToInsert.length} member seats.`);
    }
  }

  // --- [核心修正] 4. 为所有成员和他们对应的题目创建初始进度记录 ---
  console.log('📝 Creating initial progress records for all members...');
  const allMembers = await dbForSeed.select().from(members);
  
  const progressEntriesToInsert: (typeof memberQuestionProgress.$inferInsert)[] = [];

  for (const member of allMembers) {
    // 找出这位成员被分配的题库下的所有题目
    const questionsForMember = allCreatedQuestions.filter(q => q.questionBankId === member.assignedQuestionBankId);
    
    for (const question of questionsForMember) {
      progressEntriesToInsert.push({
        memberId: member.id,
        questionId: question.id,
        status: 'unanswered', // 默认状态为'unanswered'
      });
    }
  }

  if (progressEntriesToInsert.length > 0) {
    await dbForSeed.insert(memberQuestionProgress).values(progressEntriesToInsert);
    console.log(`✅ Created ${progressEntriesToInsert.length} initial progress records.`);
  } else {
    console.log('🟡 No progress records to create.');
  }

  console.log('\n✨ Seeding finished successfully! ✨');
}

main().catch((err) => {
  console.error('\n❌ An error occurred during seeding:', err);
  process.exit(1);
});
