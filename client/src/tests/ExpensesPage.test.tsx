/**
 * Frontend tests for ExpensesPage
 * Key focus: verifying the useEffect infinite loop fix —
 * fetchExpenses should be called exactly once on mount, not repeatedly.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExpensesPage from '../pages/expenses/ExpensesPage';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

// Mock apiFetch
const mockApiFetch = vi.fn();
vi.mock('../api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function makeOkResponse(data: unknown) {
  return {
    ok: true,
    json: async () => data,
  } as Response;
}

beforeEach(() => {
  mockApiFetch.mockClear();
  localStorage.setItem('token', 'test-token');
});

// ─── Infinite loop fix ────────────────────────────────────────────────────────

describe('useEffect fetch behavior', () => {
  it('calls apiFetch exactly once on mount (no infinite loop)', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));

    render(<ExpensesPage />);

    // Wait for the initial fetch to complete
    await waitFor(() => expect(mockApiFetch).toHaveBeenCalled());

    // Wait a bit more to confirm it doesn't keep firing
    await new Promise((r) => setTimeout(r, 200));

    expect(mockApiFetch).toHaveBeenCalledTimes(1);
  });
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('ExpensesPage rendering', () => {
  it('shows loading state initially', () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<ExpensesPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders the page heading', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<ExpensesPage />);
    await waitFor(() => screen.getByText('Expenses'));
    expect(screen.getByText('Expenses')).toBeInTheDocument();
  });

  it('renders the Add Expense button', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<ExpensesPage />);
    await waitFor(() => screen.getByText('+ Add Expense'));
    expect(screen.getByText('+ Add Expense')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    render(<ExpensesPage />);
    await waitFor(() => screen.getByText(/failed/i));
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it('renders expenses from API response', async () => {
    mockApiFetch.mockResolvedValue(
      makeOkResponse([
        {
          expense_id: '1',
          user_id: 'u1',
          expense_title: 'Coffee',
          expense_category: 'Food',
          expense_amount_cents: 450,
          expense_date: '2026-03-01',
          expense_note: null,
          created_at: '2026-03-01T10:00:00Z',
        },
      ])
    );

    render(<ExpensesPage />);
    await waitFor(() => screen.getByText('Coffee'));
    expect(screen.getByText('Coffee')).toBeInTheDocument();
  });
});
