/**
 * Frontend tests for LoginPage
 * Tests UI rendering, tab switching, form submission, and error display.
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginPage from '../pages/auth/LoginPage';

// Mock react-router-dom
const mockNavigate = vi.fn();
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

beforeEach(() => {
  mockNavigate.mockClear();
  localStorage.clear();
  vi.restoreAllMocks();
});

// ─── Rendering ────────────────────────────────────────────────────────────────

describe('LoginPage rendering', () => {
  it('renders the FinTrack logo and tagline', () => {
    render(<LoginPage />);
    expect(screen.getByText('FinTrack')).toBeInTheDocument();
    expect(screen.getByText(/Track your finances/i)).toBeInTheDocument();
  });

  it('renders Login tab as active by default', () => {
    render(<LoginPage />);
    const loginTab = screen.getByRole('button', { name: 'Login' });
    expect(loginTab).toHaveClass('active');
  });

  it('renders username and password inputs', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('shows "Log In" submit button by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });
});

// ─── Tab switching ────────────────────────────────────────────────────────────

describe('Tab switching', () => {
  it('switches to Register mode when Register tab is clicked', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Register' })[0]);
    expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
  });

  it('Register tab becomes active after click', () => {
    render(<LoginPage />);
    const registerTab = screen.getAllByRole('button', { name: 'Register' })[0];
    fireEvent.click(registerTab);
    expect(registerTab).toHaveClass('active');
  });

  it('clears error when switching tabs', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid username or password' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    );

    // Switch tab — error should clear
    fireEvent.click(screen.getAllByRole('button', { name: 'Register' })[0]);
    expect(screen.queryByText('Invalid username or password')).not.toBeInTheDocument();
  });
});

// ─── Form submission ──────────────────────────────────────────────────────────

describe('Form submission', () => {
  it('shows loading state while submitting', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'abc', user_id: '1' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log In' }));

    expect(screen.getByText('Please wait...')).toBeInTheDocument();
  });

  it('saves token to localStorage and navigates on successful login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'my-token', user_id: '123' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1!' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
    expect(localStorage.getItem('token')).toBe('my-token');
  });

  it('displays error message on failed login', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid username or password' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrongpass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(screen.getByText('Invalid username or password')).toBeInTheDocument()
    );
  });

  it('shows connection error when fetch throws', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));

    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'alice' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() =>
      expect(screen.getByText('Unable to connect to server')).toBeInTheDocument()
    );
  });
});

// ─── Registration ─────────────────────────────────────────────────────────────

describe('Registration', () => {
  it('registers a new account, saves token, and navigates on success', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: 'reg-token', user_id: '42' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Register' })[0]);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'Password1!' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/dashboard'));
    expect(localStorage.getItem('token')).toBe('reg-token');
  });

  it('shows server error message when registration is rejected', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Password must be at least 8 characters' }),
    } as Response);

    render(<LoginPage />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Register' })[0]);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'short' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Create Account' }));

    await waitFor(() =>
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument()
    );
  });
});
