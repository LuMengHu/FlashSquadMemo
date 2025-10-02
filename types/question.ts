// 这个文件将作为我们前端所有“题目”相关类型的d唯0一来源 

export interface Question {
  id: string; // 注意：我们的数据库 schema 使用的是 uuid (string)
  content: string;
  answer: string;
  metadata?: Record<string, any> | null;
  // 我们可以在这里添加未来可能需要的任何字段，比如 status, nextReviewAt 等
}
