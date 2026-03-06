-- Insert a test user (password: "password123")
-- The password hash is generated using bcrypt with 10 rounds
INSERT INTO users (user_id, username, password_hash)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'testuser',
  '$2b$10$5ZeAA8NRARKYFH1cFIydsu/MLoEw4MVyxKr.qU2PmnI5TaqMYXZXS'
)
ON CONFLICT (user_id) DO NOTHING;

-- Insert some sample subscriptions for testing
INSERT INTO subscriptions (
  user_id,
  subscription_title,
  subscription_category,
  subscription_amount_cents,
  billing_cycle,
  next_renewal_date,
  subscription_status,
  subscription_note
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Netflix',
    'Entertainment',
    1599,
    'monthly',
    CURRENT_DATE + INTERVAL '15 days',
    'active',
    'Premium plan with 4K streaming'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Spotify',
    'Entertainment',
    999,
    'monthly',
    CURRENT_DATE + INTERVAL '20 days',
    'trial',
    'Premium individual plan'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Adobe Creative Cloud',
    'Other',
    5499,
    'monthly',
    CURRENT_DATE + INTERVAL '5 days',
    'canceled',
    'All apps subscription'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Car Insurance',
    'Transportation',
    15000,
    'quarterly',
    CURRENT_DATE + INTERVAL '25 days',
    'active',
    'Progressive auto insurance'
  )
ON CONFLICT DO NOTHING;

-- Insert sample expenses for the current month
INSERT INTO expenses (
  user_id,
  expense_title,
  expense_category,
  expense_amount_cents,
  expense_date,
  expense_note
) VALUES
  -- Food expenses
  (
    '00000000-0000-0000-0000-000000000000',
    'Grocery Shopping',
    'Food',
    8500,
    CURRENT_DATE - INTERVAL '2 days',
    'Weekly groceries at Whole Foods'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Restaurant Dinner',
    'Food',
    6200,
    CURRENT_DATE - INTERVAL '5 days',
    'Dinner with friends'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Coffee Shop',
    'Food',
    1800,
    CURRENT_DATE - INTERVAL '1 day',
    'Morning coffee'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Lunch Takeout',
    'Food',
    2500,
    CURRENT_DATE,
    'Thai food delivery'
  ),
  -- Housing expenses
  (
    '00000000-0000-0000-0000-000000000000',
    'Monthly Rent',
    'Housing',
    180000,
    DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 day',
    'Apartment rent payment'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Internet Bill',
    'Utilities',
    7999,
    CURRENT_DATE - INTERVAL '10 days',
    'Spectrum internet'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Electricity',
    'Utilities',
    12500,
    CURRENT_DATE - INTERVAL '8 days',
    'Monthly electricity bill'
  ),
  -- Transportation
  (
    '00000000-0000-0000-0000-000000000000',
    'Gas',
    'Transportation',
    5500,
    CURRENT_DATE - INTERVAL '3 days',
    'Shell gas station'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Uber Ride',
    'Transportation',
    2800,
    CURRENT_DATE - INTERVAL '6 days',
    'Ride to airport'
  ),
  -- Entertainment
  (
    '00000000-0000-0000-0000-000000000000',
    'Movie Tickets',
    'Entertainment',
    3200,
    CURRENT_DATE - INTERVAL '7 days',
    'AMC theater'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Concert Tickets',
    'Entertainment',
    8500,
    CURRENT_DATE - INTERVAL '12 days',
    'Live music event'
  ),
  -- Other
  (
    '00000000-0000-0000-0000-000000000000',
    'New Headphones',
    'Other',
    15999,
    CURRENT_DATE - INTERVAL '15 days',
    'Sony WH-1000XM5'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Gym Membership',
    'Other',
    4999,
    CURRENT_DATE - INTERVAL '4 days',
    'Monthly gym fee'
  )
ON CONFLICT DO NOTHING;

-- Insert sample budgets for the current month
INSERT INTO budgets (
  user_id,
  budget_category,
  monthly_limit_cents,
  budget_month
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Food',
    50000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Housing',
    200000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Transportation',
    20000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Utilities',
    15000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Entertainment',
    30000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Other',
    25000,
    TO_CHAR(CURRENT_DATE, 'YYYY-MM')
  )
ON CONFLICT (user_id, budget_category, budget_month) DO NOTHING;

-- ============================================
-- March 2026 Test Data
-- ============================================

-- Insert March 2026 expenses for testuser
INSERT INTO expenses (
  user_id,
  expense_title,
  expense_category,
  expense_amount_cents,
  expense_date,
  expense_note
) VALUES
  -- Food expenses
  (
    '00000000-0000-0000-0000-000000000000',
    'Grocery Shopping',
    'Food',
    9200,
    '2026-03-02',
    'Weekly groceries at Trader Joes'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Restaurant Lunch',
    'Food',
    4500,
    '2026-03-05',
    'Lunch at Italian restaurant'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Coffee & Pastries',
    'Food',
    2100,
    '2026-03-03',
    'Morning coffee and croissant'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Dinner with Friends',
    'Food',
    7800,
    '2026-03-08',
    'Dinner at steakhouse'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Fast Food',
    'Food',
    1500,
    '2026-03-10',
    'Quick lunch'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Grocery Shopping',
    'Food',
    8700,
    '2026-03-12',
    'Weekly groceries'
  ),

  -- Housing expenses
  (
    '00000000-0000-0000-0000-000000000000',
    'Monthly Rent',
    'Housing',
    180000,
    '2026-03-01',
    'March rent payment'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Internet Bill',
    'Utilities',
    7999,
    '2026-03-15',
    'Monthly internet bill'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Electricity',
    'Utilities',
    11200,
    '2026-03-10',
    'March electricity bill'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Water Bill',
    'Utilities',
    4500,
    '2026-03-08',
    'Monthly water bill'
  ),

  -- Transportation
  (
    '00000000-0000-0000-0000-000000000000',
    'Gas',
    'Transportation',
    6200,
    '2026-03-04',
    'Gas station fill-up'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Gas',
    'Transportation',
    5800,
    '2026-03-11',
    'Gas station fill-up'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Uber Rides',
    'Transportation',
    3400,
    '2026-03-06',
    'Multiple rides'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Parking Fee',
    'Transportation',
    2000,
    '2026-03-09',
    'Downtown parking'
  ),

  -- Entertainment
  (
    '00000000-0000-0000-0000-000000000000',
    'Movie Tickets',
    'Entertainment',
    3500,
    '2026-03-07',
    'Movie night'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Netflix Subscription',
    'Entertainment',
    1599,
    '2026-03-01',
    'Monthly Netflix payment'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Spotify Subscription',
    'Entertainment',
    999,
    '2026-03-01',
    'Monthly Spotify payment'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Game Purchase',
    'Entertainment',
    5999,
    '2026-03-14',
    'New video game'
  ),

  -- Healthcare
  (
    '00000000-0000-0000-0000-000000000000',
    'Pharmacy',
    'Healthcare',
    3200,
    '2026-03-05',
    'Prescription refill'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Doctor Visit',
    'Healthcare',
    15000,
    '2026-03-12',
    'Annual checkup copay'
  ),

  -- Other
  (
    '00000000-0000-0000-0000-000000000000',
    'Gym Membership',
    'Other',
    4999,
    '2026-03-01',
    'Monthly gym membership'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Haircut',
    'Other',
    3500,
    '2026-03-13',
    'Haircut and styling'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Books',
    'Other',
    4200,
    '2026-03-09',
    'Two books from bookstore'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Phone Bill',
    'Utilities',
    6500,
    '2026-03-15',
    'Monthly phone bill'
  )
ON CONFLICT DO NOTHING;

-- Insert March 2026 budgets
INSERT INTO budgets (
  user_id,
  budget_category,
  monthly_limit_cents,
  budget_month
) VALUES
  (
    '00000000-0000-0000-0000-000000000000',
    'Food',
    50000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Housing',
    200000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Transportation',
    20000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Utilities',
    25000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Entertainment',
    30000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Healthcare',
    20000,
    '2026-03'
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'Other',
    25000,
    '2026-03'
  )
ON CONFLICT (user_id, budget_category, budget_month) DO NOTHING;
