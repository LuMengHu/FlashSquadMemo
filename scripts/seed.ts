// scripts/seed.ts (最终重构版)
import 'dotenv/config';
import { db as dbForSchema } from '../lib/db';
import { teams, members, questionBanks, questions, memberQuestionProgress } from '../lib/schema';
import bcrypt from 'bcryptjs';
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import path from 'path';
import { config } from 'dotenv'; // 1. 导入 config 函数

// 类型定义
type TeamSeed = { key: string; name: string; password: string; };
type QuestionBankSeed = { teamKey: string; key: string; name: string; description: string; mode?: 'standard' | 'poetry-pair'; };
type QuestionSeed = { content: string; answer: string; metadata?: Record<string, any>; bankKey?: string; };

config({ path: path.resolve(__dirname, '..', '.env') });

// 数据库连接
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is not set.");
const sql = neon(databaseUrl);
const dbForSeed = drizzle(sql);

async function main() {
  console.log('🌱 Seeding started...');

  // 1. 读取团队和题库元数据
  const teamsData: TeamSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/teams.json'), 'utf-8'));
  const banksData: QuestionBankSeed[] = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/questionBanks.json'), 'utf-8'));
  
  // --- [核心重构] ---
  // 2. 动态加载所有问题文件
  const questionsData: QuestionSeed[] = [];
  const questionsDir = path.join(__dirname, 'data/questions');
  try {
    const questionFiles = fs.readdirSync(questionsDir).filter(file => file.endsWith('.json'));

    for (const file of questionFiles) {
      const bankKey = path.basename(file, '.json'); // 文件名 (不含.json) 即是 bankKey
      const filePath = path.join(questionsDir, file);
      const fileContent: Omit<QuestionSeed, 'bankKey'>[] = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      
      const questionsWithBankKey = fileContent.map(q => ({
        ...q,
        bankKey: bankKey,
      }));
      
      questionsData.push(...questionsWithBankKey);
    }
  } catch (error) {
    console.error(`❌ Error reading questions directory: ${questionsDir}. Make sure it exists and contains JSON files.`);
    throw error;
  }
  // --- [核心重构结束] ---
  
  console.log(`✅ Found ${teamsData.length} teams, ${banksData.length} banks, and ${questionsData.length} questions from ${fs.readdirSync(questionsDir).length} files.`);

  // 3. 清空数据
  console.log('🗑️  Clearing existing data...');
  await dbForSeed.delete(memberQuestionProgress);
  await dbForSeed.delete(questions);
  await dbForSeed.delete(members);
  await dbForSeed.delete(questionBanks);
  await dbForSeed.delete(teams);
  console.log('✅ Data cleared.');

  // 4. 插入所有数据
  console.log('👥 Inserting all data...');
  
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
      mode: b.mode || 'standard',
    }));
  
    const createdBanks = await dbForSeed.insert(questionBanks).values(banksToInsert).returning();
    console.log(`    -> Created ${createdBanks.length} question banks for ${createdTeam.name}`);

    // C. 创建这些题库的题目
    const bankKeyToIdMap = new Map<string, string>();
    for (let i = 0; i < teamBanksSeed.length; i++) {
        bankKeyToIdMap.set(teamBanksSeed[i].key, createdBanks[i].id);
    }

    const bankKeysForTeam = teamBanksSeed.map(b => b.key);
    const questionsForTeamSeed = questionsData.filter(q => q.bankKey && bankKeysForTeam.includes(q.bankKey));
    
    if (questionsForTeamSeed.length > 0) {
        const questionsToInsert = questionsForTeamSeed.map(q => ({ 
          questionBankId: bankKeyToIdMap.get(q.bankKey!)!, 
          question: q.content, 
          answer: q.answer,
          metadata: q.metadata, // 插入 metadata
        }));
        const createdQuestions = await dbForSeed.insert(questions).values(questionsToInsert).returning();
        allCreatedQuestions.push(...createdQuestions);
        console.log(`      -> Inserted ${createdQuestions.length} questions for this team.`);
    }

    // D. 为该团队创建成员/席位
    const membersToInsert = createdBanks.map(bank => ({ 
      teamId: createdTeam.id, 
      name: bank.name, // 使用题库名作为席位名
      assignedQuestionBankId: bank.id, 
    }));
    if (membersToInsert.length > 0) {
        await dbForSeed.insert(members).values(membersToInsert);
        console.log(`    -> Created ${membersToInsert.length} member seats.`);
    }
  }

  // 5. 为所有成员和他们对应的题目创建初始进度记录
  console.log('📝 Creating initial progress records for all members...');
  const allMembers = await dbForSeed.select().from(members);
  const progressEntriesToInsert: (typeof memberQuestionProgress.$inferInsert)[] = [];

  for (const member of allMembers) {
    if (!member.assignedQuestionBankId) continue;
    const questionsForMember = allCreatedQuestions.filter(q => q.questionBankId === member.assignedQuestionBankId);
    for (const question of questionsForMember) {
      progressEntriesToInsert.push({
        memberId: member.id,
        questionId: question.id,
        status: 'unanswered',
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
