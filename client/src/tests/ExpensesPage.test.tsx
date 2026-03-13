/**
 * Frontend tests for ExpensesPage
 * Key focus: verifying the useEffect infinite loop fix —
 * fetchExpenses should be called exactly once on mount, not repeatedly.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

const MOCK_EXPENSE = {
  expense_id: '1',
  user_id: 'u1',
  expense_title: 'Coffee',
  expense_category: 'Food',
  expense_amount_cents: 450,
  expense_date: '2026-03-01',
  expense_note: null,
  created_at: '2026-03-01T10:00:00Z',
};

// ─── Edit expense ─────────────────────────────────────────────────────────────

describe('Edit expense', () => {
  it('opens modal pre-filled with expense data and calls PATCH on submit', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeOkResponse([MOCK_EXPENSE]))  // initial fetch
      .mockResolvedValueOnce(makeOkResponse({}))              // PATCH
      .mockResolvedValueOnce(makeOkResponse([]));             // refresh fetch

    render(<ExpensesPage />);
    await waitFor(() => screen.getByText('Coffee'));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));

    expect(screen.getByRole('heading', { name: 'Edit Expense' })).toBeInTheDocument();
    expect((screen.getByLabelText(/^Name/i) as HTMLInputElement).value).toBe('Coffee');

    fireEvent.click(screen.getByRole('button', { name: 'Update Expense' }));

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/expenses/1',
        expect.objectContaining({ method: 'PATCH' })
      )
    );
  });
});

// ─── Delete expense ───────────────────────────────────────────────────────────

describe('Delete expense', () => {
  it('shows confirm dialog and calls DELETE on confirmation', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeOkResponse([MOCK_EXPENSE]))  // initial fetch
      .mockResolvedValueOnce(makeOkResponse({}))              // DELETE
      .mockResolvedValueOnce(makeOkResponse([]));             // refresh fetch

    render(<ExpensesPage />);
    await waitFor(() => screen.getByText('Coffee'));

    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('heading', { name: 'Confirm Deletion' })).toBeInTheDocument();

    // Confirm dialog has two Delete buttons total (table row + dialog); click the dialog one
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete' })[1]);

    await waitFor(() =>
      expect(mockApiFetch).toHaveBeenCalledWith(
        '/expenses/1',
        expect.objectContaining({ method: 'DELETE' })
      )
    );
  });
});

// ─── Filter expenses ──────────────────────────────────────────────────────────

describe('Filter expenses', () => {
  it('re-fetches with category param when category filter is changed', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));

    render(<ExpensesPage />);
    await waitFor(() => screen.getByRole('button', { name: /show filters/i }));

    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));

    // Category select has "All" as the default displayed value
    fireEvent.change(screen.getByDisplayValue('All'), { target: { value: 'Food' } });

    await waitFor(() => {
      const calls = mockApiFetch.mock.calls as [string, ...unknown[]][];
      expect(calls.some(([url]) => url.includes('category=Food'))).toBe(true);
    });
  });

  it('re-fetches with date range params when a date preset is selected', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));

    render(<ExpensesPage />);
    await waitFor(() => screen.getByRole('button', { name: /show filters/i }));

    fireEvent.click(screen.getByRole('button', { name: /show filters/i }));
    fireEvent.click(screen.getByRole('button', { name: 'This Month' }));

    await waitFor(() => {
      const calls = mockApiFetch.mock.calls as [string, ...unknown[]][];
      expect(calls.some(([url]) => url.includes('from='))).toBe(true);
    });
  });
});
