# Flash Squad Memo

一个专为问答竞赛团队设计的现代化记忆与模拟训练工具。本项目旨在通过科学的记忆方法和真实的竞赛模拟，帮助团队成员高效、系统地掌握题库知识。

![Vercel Deployment](https://img.shields.io/badge/Vercel-Deployed-brightgreen?style=for-the-badge&logo=vercel)![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)


## ✨ 项目核心功能 (Core Features)

* **团队隔离与安全访问**: 每个团队拥有独立的题库和成员系统，通过团队名称和密码进行安全访问。
* **个性化学习路径**: 系统为每个“席位”（成员）独立跟踪学习进度，确保个性化的复习体验。
* **科学记忆法 (间隔重复)**: 内置“复习模式”，基于遗忘曲线理论，智能安排错题和易忘题的复习计划，最大化记忆效率。
* **真实竞赛模拟**: “抢答模式”模拟真实比赛的紧张氛围，训练团队的反应速度和协作能力。
* **动态题库模块**: 支持多种题库模式（如`标准问答`、`诗词配对`），前端可根据题库类型动态渲染不同的答题组件，具备高度可扩展性。
* **流畅的交互体验**: 采用乐观 UI (Optimistic UI) 更新策略，在提交答案时提供即时反馈，极大提升了用户体验。

## 🛠️ 技术栈 (Tech Stack)

| 分类             | 技术                                                                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **框架**         | [**Next.js**](https://nextjs.org/) (App Router)                                                                                                                               |
| **语言**         | [**TypeScript**](https://www.typescriptlang.org/)                                                                                                                             |
| **数据库**       | [**Vercel Postgres**](https://vercel.com/storage/postgres) (基于 Neon)                                                                                                              |
| **ORM**          | [**Drizzle ORM**](https://orm.drizzle.team/)                                                                                                                                  |
| **样式**         | [**Tailwind CSS**](https://tailwindcss.com/)                                                                                                                                  |
| **认证**         | **Custom JWT Authentication**                                                                                                                                                 |
| **部署**         | [**Vercel**](https://vercel.com/)                                                                                                                                             |

## 🏛️ 架构与核心概念 (Architecture & Core Concepts)

1. **数据模型核心**:
   
   * **`Team -> Member -> QuestionBank`**: 这是一个核心设计。一个 `Team`（团队）包含多个 `Member`（席位）。每个 `Member` 被指派一个特定的 `QuestionBank`（题库）。这种结构保证了数据的隔离性和管理的灵活性。
   * **`member_question_progress`**: 这是实现间隔重复的关键。该表记录了每个成员对每道题目的学习状态（`status`）和下一次最佳复习时间（`nextReviewAt`），是实现个性化复习功能的数据基础。
2. **动态渲染**:
   
   * `question_banks` 表中的 `mode` 字段（如 `'standard'`, `'poetry-pair'`）是前端渲染的“开关”。应用会根据此字段动态加载相应的 React 组件，使得新增题库类型变得非常容易，无需修改核心答题逻辑。
3. **数据初始化**:
   
   * 项目的所有基础数据（团队、题库、题目）都通过 `scripts/data/` 目录下的 JSON 文件进行管理，实现了数据与代码的分离。
   * `scripts/seed.ts` 脚本负责读取这些 JSON 文件，并将数据填充到数据库中，极大地方便了开发、测试和数据重置。

## 🚀 本地开发指南 (Getting Started)

请按照以下步骤在你的本地环境中运行此项目。

### 1. 先决条件

* [Node.js](https://nodejs.org/) (建议 v18.0 或更高版本)
* [pnpm](https://pnpm.io/) (推荐使用，或使用 `npm`/`yarn`)
* 一个可用的 Postgres 数据库 (例如，通过 [Neon](https://neon.tech/) 创建一个免费的数据库)

### 2. 安装与配置

**1. 克隆仓库**

```bash
git clone https://github.com/your-username/flash-squad-memo.git
cd flash-squad-memo
```

**2. 安装依赖**

```bash
pnpm install
```

**3. 配置环境变量**
复制 `.env.example` 文件并重命名为 `.env`。

```bash
cp .env.example .env
```

然后，编辑 `.env` 文件，填入你的配置信息：

```env
# 从你的 Postgres 数据库提供商（如 Neon）获取
POSTGRES_URL="postgres://user:password@host:port/dbname?sslmode=require"

# 用于签发和验证 JWT 的密钥，请使用一个长而随机的字符串
JWT_SECRET="YOUR_SUPER_SECRET_RANDOM_STRING"
```

**4. 数据库同步与数据填充**
以下命令将根据 Drizzle 的 schema 定义同步你的数据库表结构，并填充初始数据。

```bash
# 同步数据库表结构
pnpm drizzle:push

# 填充初始数据（团队、题库、题目等）
pnpm seed
```

> **注意**: 运行 `pnpm seed` 会清空相关表格并重新插入 `scripts/data/` 中的数据。

### 3. 运行开发服务器

```bash
pnpm dev
```

现在，在浏览器中打开 [http://localhost:3000](http://localhost:3000) 即可看到正在运行的应用。

## 📜 可用脚本 (Available Scripts)

* `pnpm dev`: 启动开发服务器。
* `pnpm build`: 构建生产版本的应用。
* `pnpm start`: 启动生产服务器。
* `pnpm lint`: 运行 ESLint 检查代码规范。
* `pnpm drizzle:push`: 将 Drizzle schema 推送到数据库，同步表结构。
* `pnpm seed`: 清空并使用 JSON 文件中的数据填充数据库。

## 部署 (Deployment)

本项目已针对 [Vercel](https://vercel.com/) 进行了优化，可以实现零配置部署。

1. 将你的代码推送到 GitHub 仓库。
2. 在 Vercel 上，选择 "Import Project" 并连接到你的 GitHub 仓库。
3. 在 "Environment Variables" 配置页面，添加你在 `.env` 文件中使用的 `POSTGRES_URL` 和 `JWT_SECRET`。
4. 点击 "Deploy"。Vercel 将自动完成构建和部署。之后每次推送到主分支都会触发自动更新。

---

