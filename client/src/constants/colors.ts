// Shared color constants for categories and statuses across the app

export const CATEGORY_COLORS: Record<string, string> = {
  'Food': '#ff6b6b',
  'Housing': '#4ecdc4',
  'Transportation': '#45b7d1',
  'Utilities': '#ff9800',
  'Entertainment': '#a29bfe',
  'Healthcare': '#2ecc71',
  'Other': '#95a5a6',
};

// Status colors for subscriptions
export const STATUS_COLORS = {
  active: {
    background: '#d1fae5',
    text: '#065f46',
  },
  trial: {
    background: '#dbeafe',
    text: '#1e40af',
  },
  canceled: {
    background: '#fee2e2',
    text: '#991b1b',
  },
};
