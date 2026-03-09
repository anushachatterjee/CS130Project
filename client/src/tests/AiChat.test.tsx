/**
 * Frontend tests for AiChat component
 * Note: messages are sent via Enter keydown (not form submit).
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AiChat from '../components/AiChat';

vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <span>{children}</span>,
}));

const mockApiFetch = vi.fn();
vi.mock('../api', () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

function makeOkResponse(data: unknown) {
  return { ok: true, json: async () => data } as Response;
}

function sendMessage(input: HTMLElement, text: string) {
  fireEvent.change(input, { target: { value: text } });
  fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', keyCode: 13 });
}

beforeEach(() => {
  mockApiFetch.mockClear();
  localStorage.setItem('token', 'test-token');
});

describe('AiChat rendering', () => {
  it('renders the initial assistant greeting', () => {
    render(<AiChat />);
    expect(screen.getByText(/FinTrack assistant/i)).toBeInTheDocument();
  });

  it('renders the Analyze My Finances button', () => {
    render(<AiChat />);
    expect(screen.getByRole('button', { name: 'Analyze My Finances' })).toBeInTheDocument();
  });

  it('renders the message input', () => {
    render(<AiChat />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
});

describe('Sending messages', () => {
  it('shows Thinking… while waiting for reply', async () => {
    let resolveResponse!: (v: unknown) => void;
    mockApiFetch.mockReturnValue(
      new Promise((resolve) => { resolveResponse = resolve; })
    );

    render(<AiChat />);
    sendMessage(screen.getByRole('textbox'), 'How much did I spend?');

    await waitFor(() => expect(screen.getByText('Thinking…')).toBeInTheDocument());

    resolveResponse({ ok: true, json: async () => ({ reply: 'You spent $50.' }) });
  });

  it('displays user message and AI reply', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse({ reply: 'You spent $50 this month.' }));

    render(<AiChat />);
    sendMessage(screen.getByRole('textbox'), 'How much did I spend?');

    await waitFor(() => screen.getByText('How much did I spend?'));
    await waitFor(() => screen.getByText('You spent $50 this month.'));

    expect(screen.getByText('How much did I spend?')).toBeInTheDocument();
    expect(screen.getByText('You spent $50 this month.')).toBeInTheDocument();
  });

  it('clears input after sending', async () => {
    mockApiFetch.mockResolvedValue(makeOkResponse({ reply: 'OK' }));

    render(<AiChat />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    sendMessage(input, 'Hello');

    await waitFor(() => expect(input.value).toBe(''));
  });

  it('shows error message when AI request fails', async () => {
    mockApiFetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) } as Response);

    render(<AiChat />);
    sendMessage(screen.getByRole('textbox'), 'Hello');

    await waitFor(() => screen.getByText(/could not reach the AI service/i));
    expect(screen.getByText(/could not reach the AI service/i)).toBeInTheDocument();
  });
});

describe('Analyze My Finances button', () => {
  it('fetches analysis prompt and sends it', async () => {
    mockApiFetch
      .mockResolvedValueOnce(makeOkResponse({ prompt: 'Analyze my finances now.' }))
      .mockResolvedValueOnce(makeOkResponse({ reply: 'Here is your analysis.' }));

    render(<AiChat />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze My Finances' }));

    await waitFor(() => screen.getByText('Analyze My Finances'));
    await waitFor(() => screen.getByText('Here is your analysis.'));

    expect(mockApiFetch).toHaveBeenCalledWith('/ai/prompts/analysis');
  });
});
