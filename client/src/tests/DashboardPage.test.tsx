/**
 * Frontend tests for DashboardPage
 * Note: recharts is mocked to avoid canvas/SVG issues in jsdom.
 */
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPage from '../pages/dashboard/DashboardPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('recharts', () => ({
  PieChart: ({ children }: { children: React.ReactNode }) => <div data-testid="pie-chart">{children}</div>,
  Pie: () => null,
  Cell: () => null,
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Legend: () => null,
  Tooltip: () => null,
}));

const mockApiFetch = vi.fn();
vi.mock('../api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const MOCK_SUMMARY = {
  totalSpending: 125.50,
  categorySpending: [
    { category: 'Food', amount: 75.00 },
    { category: 'Transportation', amount: 50.50 },
  ],
  budgetUsage: [
    { category: 'Food', limit: 200, spent: 75, percentage: 37, status: 'good' },
  ],
  upcomingRenewals: [
    {
      id: 'sub-1',
      title: 'Netflix',
      amount: 15.99,
      renewalDate: '2026-04-01',
      billingCycle: 'monthly',
      status: 'active',
    },
  ],
  currentMonth: '2026-03',
};

function makeOkResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

beforeEach(() => {
  mockApiFetch.mockClear();
  localStorage.setItem('token', 'test-token');
});

describe('DashboardPage rendering', () => {
  it('shows loading state initially', () => {
    mockApiFetch.mockResolvedValue(makeOkResponse(MOCK_SUMMARY));
    render(<DashboardPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    render(<DashboardPage />);
    await waitFor(() => screen.getByText(/failed|error/i));
  });

  it('renders total spending amount after load', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse(MOCK_SUMMARY));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText(/125/), { timeout: 3000 });
    expect(screen.getByText(/125/)).toBeInTheDocument();
  });

  it('renders upcoming renewal subscription name', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse(MOCK_SUMMARY));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText('Netflix'), { timeout: 3000 });
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('renders category spending section', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse(MOCK_SUMMARY));
    render(<DashboardPage />);
    await waitFor(() => screen.getAllByText(/^Food$/), { timeout: 3000 });
    expect(screen.getAllByText(/^Food$/).length).toBeGreaterThan(0);
  });

  it('shows $0.00 when no spending data', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse({
      ...MOCK_SUMMARY,
      totalSpending: 0,
      categorySpending: [],
      budgetUsage: [],
      upcomingRenewals: [],
    }));
    render(<DashboardPage />);
    await waitFor(() => screen.getByText(/\$0/), { timeout: 3000 });
    expect(screen.getByText(/\$0/)).toBeInTheDocument();
  });
});
