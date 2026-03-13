# FinTrack

A personal finance tracker built for CS 130. Track your expenses, manage subscriptions, set monthly budgets by category, and get AI-powered financial insights — all in one place.

## Features

- **Dashboard** — overview of spending, category breakdowns, and upcoming subscription renewals
- **Expenses** — add, edit, delete expenses with filtering by date, category, amount, and keyword search
- **Subscriptions** — track recurring payments with support for weekly, bi-weekly, monthly, quarterly, and yearly billing cycles. Auto-renewal runs daily.
- **Budgets** — set monthly spending limits per category and see how you're tracking against them with progress bars
- **AI Assistant** — chat with a Gemini-powered assistant that has context on your financial data and gives personalized advice

## Tech Stack

**Frontend:** React 19, TypeScript, Vite, React Router, Recharts

**Backend:** Node.js, Express 5, TypeScript, PostgreSQL, Zod validation

**Auth:** JWT tokens with bcrypt password hashing

**AI:** Google Gemini API

**Infra:** Docker (Postgres), GitHub Actions CI

## Getting Started

### Prerequisites

- Node.js 20+
- Docker

### Setup

1. Clone the repo

```bash
git clone https://github.com/anushachatterjee/CS130Project.git
cd CS130Project
```

2. Create a `.env.docker` file in the project root:

```
POSTGRES_USER=fintrack_user
POSTGRES_PASSWORD=fintrack_pass
POSTGRES_DB=fintrack
```

3. Create a `server/.env` file:

```
DATABASE_URL=postgresql://fintrack_user:fintrack_pass@localhost:5432/fintrack
JWT_SECRET=your-secret-key
PORT=4000
GEMINI_API_KEY=your-gemini-api-key
```

4. Start the database

```bash
docker compose up -d
```

5. Install dependencies and run the server

```bash
cd server
npm install
npm run dev
```

6. In a separate terminal, start the client

```bash
cd client
npm install
npm run dev
```

7. Open http://localhost:5173 in your browser

## Project Structure

```
├── client/                     # React frontend
│   └── src/
│       ├── pages/              # Dashboard, Expenses, Subscriptions, Budgets, Login
│       ├── components/         # AI Chat, shared components
│       ├── layouts/            # Sidebar navigation layout
│       ├── api.ts              # Fetch wrapper with auth headers
│       └── tests/              # Vitest + React Testing Library
├── server/                     # Express API
│   └── src/
│       ├── modules/            # auth, expenses, subscriptions, budgets, dashboard, ai
│       ├── lib/                # Gemini client, scheduler, prompt templates
│       ├── schema.sql          # Database tables
│       ├── seed.sql            # Sample data
│       └── tests/              # Jest + Supertest
└── docker-compose.yml          # Postgres container
```

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/dashboard/summary` | Dashboard stats |
| GET/POST/PATCH/DELETE | `/api/expenses` | Expense CRUD |
| GET/POST/PATCH/DELETE | `/api/subscriptions` | Subscription CRUD |
| GET/POST/PATCH/DELETE | `/api/budgets` | Budget CRUD |
| POST | `/api/ai/chat` | AI assistant |

## Running Tests

```bash
# backend
cd server && npm test

# frontend
cd client && npm test
```

## Team

- Anusha Chatterjee
- Jinying Zhang
- Yinan Qiu
- Jason Lin
