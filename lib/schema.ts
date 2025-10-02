import { relations } from 'drizzle-orm';
import {
  pgTable,
  uuid,
  varchar,
  timestamp,
  integer,
  text,
  pgEnum,
  real,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';

// ---------------- Tables ----------------

// 1. 团队表 (Teams)
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('team_name', { length: 256 }).notNull().unique(), // 增加 unique() 约束，确保团队名唯一
  passwordHash: varchar('password_hash', { length: 256 }).notNull(), // <-- 新增此行
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 2. 题库表 (Question Banks)
export const questionBanks = pgTable('question_banks', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade' })
    .notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// 3. 题目表 (Questions)
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionBankId: uuid('question_bank_id')
    .references(() => questionBanks.id, { onDelete: 'cascade' })
    .notNull(),
  content: text('question').notNull(),
  answer: text('answer').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  // 为 questionBankId 创建索引，可以加速查询
  return {
    questionBankIdIdx: index('question_bank_id_idx').on(table.questionBankId),
  }
});

// 4. 成员表 (Members)
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  teamId: uuid('team_id')
    .references(() => teams.id, { onDelete: 'cascade' })
    .notNull(),
  // 直接在这里关联成员和题库
  assignedQuestionBankId: uuid('assigned_question_bank_id')
    .references(() => questionBanks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    teamIdIdx: index('team_id_idx').on(table.teamId),
  }
});

// 定义学习状态的枚举类型，用于"错题本"
export const progressStatusEnum = pgEnum('progress_status', ['unanswered', 'correct', 'incorrect']);

// 5. 成员-题目 进度表 (Member-Question Progress)
// 这是整个系统的核心，用于实现"错题本"和"遗忘曲线"
export const memberQuestionProgress = pgTable('member_question_progress', {
  memberId: uuid('member_id')
    .references(() => members.id, { onDelete: 'cascade' })
    .notNull(),
  questionId: uuid('question_id')
    .references(() => questions.id, { onDelete: 'cascade' })
    .notNull(),
  
  // "错题本"相关字段
  status: progressStatusEnum('status').default('unanswered').notNull(),

  // "遗忘曲线" (Spaced Repetition) 相关字段
  lastReviewedAt: timestamp('last_reviewed_at'), // 上次复习时间
  nextReviewAt: timestamp('next_review_at'),   // 下次应复习时间
  interval: integer('interval').default(0),      // 复习间隔天数
  easeFactor: real('ease_factor').default(2.5),  // 熟悉度因子 (SM-2算法)
  correctStreak: integer('correct_streak').default(0).notNull(), 

}, (table) => {
  // 设置 memberId 和 questionId 的复合主键，确保唯一性
  return {
    pk: primaryKey({ columns: [table.memberId, table.questionId] }),
  }
});


// ---------------- Relations ----------------

// 定义表之间的关系，方便用ORM进行关联查询

export const teamsRelations = relations(teams, ({ many }) => ({
  members: many(members),
}));

export const membersRelations = relations(members, ({ one }) => ({
  team: one(teams, {
    fields: [members.teamId],
    references: [teams.id],
  }),
  assignedQuestionBank: one(questionBanks, {
    fields: [members.assignedQuestionBankId],
    references: [questionBanks.id],
  }),
}));

export const questionBanksRelations = relations(questionBanks, ({ many }) => ({
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one }) => ({
  questionBank: one(questionBanks, {
    fields: [questions.questionBankId],
    references: [questionBanks.id],
  }),
}));

export const memberQuestionProgressRelations = relations(memberQuestionProgress, ({ one }) => ({
  member: one(members, {
    fields: [memberQuestionProgress.memberId],
    references: [members.id],
  }),
  question: one(questions, {
    fields: [memberQuestionProgress.questionId],
    references: [questions.id],
  }),
}));
