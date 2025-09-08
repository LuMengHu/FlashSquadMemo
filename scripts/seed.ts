// scripts/seed.ts

import 'dotenv/config';
import { db } from '../lib/db';
import { teams, members, questionBanks } from '../lib/schema';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // 清理旧数据，以防重复执行
  await db.delete(members);
  await db.delete(teams);
  await db.delete(questionBanks);
  console.log('🧹 Cleaned up old data.');

  // 1. 创建三个题库
  const [bank1, bank2, bank3] = await db.insert(questionBanks).values([
    { name: '题库一：基础知识' },
    { name: '题库二：进阶挑战' },
    { name: '题库三：终极冲刺' },
  ]).returning();
  console.log(`🏦 Created 3 question banks: ${bank1.name}, ${bank2.name}, ${bank3.name}`);


  // 2. 创建一个团队
  const passwordHash = await bcrypt.hash('123456', 10);
  const [team] = await db.insert(teams).values({
    name: '一号战队',
    passwordHash: passwordHash,
  }).returning();
  console.log(`🚀 Created team: ${team.name}`);


  // 3. 在该团队下创建三个成员，并分别关联到三个题库
  await db.insert(members).values([
    {
      name: '张三',
      teamId: team.id,
      assignedQuestionBankId: bank1.id, // 张三负责题库一
    },
    {
      name: '李四',
      teamId: team.id,
      assignedQuestionBankId: bank2.id, // 李四负责题库二
    },
    {
      name: '王五',
      teamId: team.id,
      assignedQuestionBankId: bank3.id, // 王五负责题库三
    },
  ]);
  console.log(`👨‍👩‍👧 Created 3 members (张三, 李四, 王五) in ${team.name} and assigned them to question banks.`);


  console.log('✅ Database seeded successfully!');
}

main().catch((error) => {
  console.error('❌ Error seeding database:', error);
  process.exit(1);
});
