/**
 * Frontend tests for SubscriptionsPage
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SubscriptionsPage from '../pages/subscriptions/SubscriptionsPage';

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

const mockApiFetch = vi.fn();
vi.mock('../api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

const MOCK_SUBSCRIPTION = {
  subscription_id: 'sub-1',
  subscription_title: 'Netflix',
  subscription_category: 'Entertainment',
  subscription_amount: 15.99,
  billing_cycle: 'monthly',
  next_renewal_date: '2026-04-01',
  subscription_status: 'active',
  subscription_note: null,
};

function makeOkResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

beforeEach(() => {
  mockApiFetch.mockClear();
  localStorage.setItem('token', 'test-token');
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('SubscriptionsPage rendering', () => {
  it('shows loading state initially', () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<SubscriptionsPage />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('renders page heading after load', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByRole('heading', { level: 1 }), { timeout: 3000 });
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('renders subscriptions returned from API', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([MOCK_SUBSCRIPTION]));
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByText('Netflix'), { timeout: 3000 });
    expect(screen.getByText('Netflix')).toBeInTheDocument();
  });

  it('shows error message when fetch fails', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, json: async () => ({}) } as Response);
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByText(/failed/i));
    expect(screen.getByText(/failed/i)).toBeInTheDocument();
  });

  it('shows empty state when no subscriptions', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByText(/no subscriptions yet/i), { timeout: 3000 });
    expect(screen.queryByText('Netflix')).not.toBeInTheDocument();
  });
});

// ─── Add modal ────────────────────────────────────────────────────────────────

describe('Add Subscription modal', () => {
  it('opens modal when Add Subscription button is clicked', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByRole('button', { name: /add subscription/i }), { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: /add subscription/i }));
    expect(screen.getByRole('heading', { name: 'Add Subscription' })).toBeInTheDocument();
  });

  it('closes modal when Cancel is clicked', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse([]));
    render(<SubscriptionsPage />);
    await waitFor(() => screen.getByRole('button', { name: /add subscription/i }), { timeout: 3000 });
    fireEvent.click(screen.getByRole('button', { name: /add subscription/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('heading', { name: 'Add Subscription' })).not.toBeInTheDocument()
    );
  });

});
