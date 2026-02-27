import express from 'express';
import { aiModel } from '../../lib/gemini';
import { requireAuth, type AuthRequest } from '../auth/middlewares/requireAuth';
import { dashboardRepo } from '../dashboard/repositories/dashboard.repo';
import { expensesRepo } from '../expenses/repositories/expenses.repo';
import { ANALYSIS_PROMPT } from '../../lib/prompts';

const router = express.Router();

type ChatMessage = {
    role: 'user' | 'assistant'; 
    content: string
};

router.post('/chat', requireAuth, async (req, res) => {
    const userId = (req as AuthRequest).userId;
    const { message, history } = req.body as { message?: string; history?: ChatMessage[] };

    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Missing message' });
    }
    
    // Fetch user's current financial context
    const now = new Date();
    const fristDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth()+1, 0);
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}`;

    const [totalSpendingCents, categorySpendingRows, budgetsRows, upcomingRenewalsRows, expenseRows] = 
        await Promise.all([
            dashboardRepo.getTotalSpending(userId, fristDayOfMonth, lastDayOfMonth),
            dashboardRepo.getCategorySpending(userId, fristDayOfMonth, lastDayOfMonth),
            dashboardRepo.getBudgets(userId, currentMonth),
            dashboardRepo.getUpcomingRenewals(userId),
            expensesRepo.listByUser(userId, { sortBy: 'date', sortOrder: 'desc', limit: 500 }),
        ]);

    const categorySpending = categorySpendingRows
        .map((r) => `  - ${r.category}: $${(Number(r.total_cents) / 100).toFixed(2)}`)
        .join('\n');

    const budgetUsage = budgetsRows
        .map((b) => {
            const spent = categorySpendingRows.find((s) => s.category === b.budget_category);
            const spentCents = spent ? Number(spent.total_cents) : 0;
            const limitCents = Number(b.monthly_limit_cents);
            const pct = limitCents > 0 ? Math.round((spentCents / limitCents) * 100) : 0;
            const status = spentCents > limitCents ? 'OVER BUDGET' : spentCents > limitCents * 0.9 ? 'near limit' : 'on track';
            return `  - ${b.budget_category}: spent $${(spentCents / 100).toFixed(2)} of $${(limitCents / 100).toFixed(2)} limit (${pct}%, ${status})`;
        })
        .join('\n');

    const renewals = upcomingRenewalsRows
        .map((r) => `  - ${r.subscription_title}: $${(Number(r.subscription_amount_cents) / 100).toFixed(2)} due ${r.next_renewal_date} (${r.billing_cycle}, ${r.subscription_status})`)
        .join('\n');

    const expenseList = expenseRows
        .map((e) => `  - ${e.expense_date} | ${e.expense_title} | ${e.expense_category} | $${(Number(e.expense_amount_cents) / 100).toFixed(2)}${e.expense_note ? ` | note: ${e.expense_note}` : ''}`)
        .join('\n');

    const contextMessage = `[User's financial data — current month: ${currentMonth}]
                            Total spending this month: $${(totalSpendingCents / 100).toFixed(2)}
                            Spending by category:
                            ${categorySpending || '  (none)'}
                            Budget usage:
                            ${budgetUsage || '  (no budgets set)'}
                            Upcoming subscription renewals:
                            ${renewals || '  (none)'}
                            All individual expenses (all time, most recent first):
                            ${expenseList || '  (none)'}
                            ---
                            Use this data to give personalized, specific answers. Do not reveal raw IDs.`;
    
    // Map history to Gemini's format, prepending the financial context as the first user turn
    let chat_histories = [
        { role: 'user' as const, parts: [{ text: contextMessage }] },
        { role: 'model' as const, parts: [{ text: "Understood. I have your current financial data and am ready to help." }] },
        ...(history ?? []).map((m) => ({
            role: m.role === 'user' ? 'user' as const : 'model' as const,
            parts: [{ text: m.content }],
        })),
    ];

    // Gemini requires the first message in history to be from the 'user'
    if (chat_histories.length > 0 && chat_histories[0].role === 'model') {
        chat_histories = chat_histories.slice(1);
    }

    const chat = aiModel.startChat({
        history: chat_histories,
        generationConfig: {
            maxOutputTokens: 4096,
        },
    });

    try {
        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();   // Extract the text from the response

        return res.json({ reply: text });
    } catch (err) {
        console.error('Gemini error', err);
        return res.status(500).json({ error: 'AI request failed' })
    }
});

router.get('/prompts/analysis', requireAuth, (_req, res) => {
    res.json({ prompt: ANALYSIS_PROMPT });
});

export const aiRouter = router;