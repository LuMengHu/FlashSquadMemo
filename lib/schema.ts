// lib/schema.ts (最终修正版)
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
  jsonb,
} from 'drizzle-orm/pg-core';

// ... (Teams 表定义不变) ...
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('team_name', { length: 256 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 256 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ... (QuestionBanks 表定义不变) ...
export const questionBanks = pgTable('question_banks', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 256 }).notNull(),
  description: text('description'),
  mode: text('mode', { enum: ['standard', 'poetry-pair'] }).default('standard').notNull(), 
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// 3. 题目表 (Questions)
export const questions = pgTable('questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  questionBankId: uuid('question_bank_id').references(() => questionBanks.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(), // <-- [核心修正] 将列名从 'content' 改回 'question'
  answer: text('answer').notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => {
  return {
    questionBankIdIdx: index('question_bank_id_idx').on(table.questionBankId),
  }
});

// ... (Members 和 MemberQuestionProgress 表定义不变) ...
export const members = pgTable('members', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 256 }).notNull(),
  teamId: uuid('team_id').references(() => teams.id, { onDelete: 'cascade' }).notNull(),
  assignedQuestionBankId: uuid('assigned_question_bank_id').references(() => questionBanks.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => { return { teamIdIdx: index('team_id_idx').on(table.teamId) } });
export const progressStatusEnum = pgEnum('progress_status', ['unanswered', 'correct', 'incorrect']);
export const memberQuestionProgress = pgTable('member_question_progress', {
  memberId: uuid('member_id').references(() => members.id, { onDelete: 'cascade' }).notNull(),
  questionId: uuid('question_id').references(() => questions.id, { onDelete: 'cascade' }).notNull(),
  status: progressStatusEnum('status').default('unanswered').notNull(),
  lastReviewedAt: timestamp('last_reviewed_at'),
  nextReviewAt: timestamp('next_review_at'),
  interval: integer('interval').default(0),
  easeFactor: real('ease_factor').default(2.5),
  correctStreak: integer('correct_streak').default(0).notNull(), 
}, (table) => { return { pk: primaryKey({ columns: [table.memberId, table.questionId] }) } });


// ... (Relations 部分保持不变) ...
export const teamsRelations = relations(teams, ({ many }) => ({ members: many(members) }));
export const membersRelations = relations(members, ({ one }) => ({ team: one(teams, { fields: [members.teamId], references: [teams.id] }), assignedQuestionBank: one(questionBanks, { fields: [members.assignedQuestionBankId], references: [questionBanks.id] }) }));
export const questionBanksRelations = relations(questionBanks, ({ many }) => ({ questions: many(questions) }));
export const questionsRelations = relations(questions, ({ one }) => ({ questionBank: one(questionBanks, { fields: [questions.questionBankId], references: [questionBanks.id] }) }));
export const memberQuestionProgressRelations = relations(memberQuestionProgress, ({ one }) => ({ member: one(members, { fields: [memberQuestionProgress.memberId], references: [members.id] }), question: one(questions, { fields: [memberQuestionProgress.questionId], references: [questions.id] }) }));

