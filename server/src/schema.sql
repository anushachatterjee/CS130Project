CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
    user_id UUID 
        PRIMARY KEY 
        DEFAULT gen_random_uuid(),
    username TEXT 
        UNIQUE 
        NOT NULL,
    password_hash TEXT 
        NOT NULL,
    created_at TIMESTAMPTZ 
        NOT NULL 
        DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
    expense_id UUID  
        PRIMARY KEY 
        DEFAULT gen_random_uuid(),
    user_id UUID 
        NOT NULL 
        REFERENCES users(user_id) 
            ON DELETE CASCADE,
    expense_title TEXT 
        NOT NULL,
    expense_category TEXT 
        NOT NULL 
        CHECK (expense_category IN ('Food','Housing','Transportation','Utilities','Entertainment','Healthcare','Other')),
    expense_amount_cents INT 
        NOT NULL
        CHECK (expense_amount_cents > 0),
    expense_date DATE 
        NOT NULL,
    expense_note TEXT,
    created_at TIMESTAMPTZ 
        NOT NULL 
        DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id UUID 
        PRIMARY KEY 
        DEFAULT gen_random_uuid(),
    user_id UUID  NOT NULL 
        REFERENCES users(user_id) 
            ON DELETE CASCADE,
    subscription_title TEXT 
        NOT NULL,
    subscription_category TEXT
        NOT NULL
        CHECK (subscription_category IN ('Food','Housing','Transportation','Utilities','Entertainment','Healthcare','Other')),
    subscription_amount_cents INT
        NOT NULL
        CHECK (subscription_amount_cents > 0),
    billing_cycle TEXT
        NOT NULL
        CHECK (billing_cycle IN ('weekly','bi-weekly','monthly','quarterly','yearly','none')),
    next_renewal_date DATE
        CHECK (
                (billing_cycle = 'none' AND next_renewal_date IS NULL)
                OR
                (billing_cycle <> 'none' AND next_renewal_date IS NOT NULL)
        ),
    subscription_status TEXT
        NOT NULL
        CHECK (subscription_status IN ('active','canceled','trial')),
    subscription_note TEXT,
    created_at TIMESTAMPTZ 
        NOT NULL 
        DEFAULT now()
);

CREATE TABLE IF NOT EXISTS budgets (
    budget_id UUID 
        PRIMARY KEY 
        DEFAULT gen_random_uuid(),
    user_id UUID 
        NOT NULL 
        REFERENCES users(user_id) 
            ON DELETE CASCADE,
    budget_category TEXT 
        NOT NULL 
        CHECK (budget_category IN ('Food','Housing','Transportation','Utilities','Entertainment','Healthcare','Other')),
    monthly_limit_cents INT 
        NOT NULL
        CHECK (monthly_limit_cents >= 0),
    budget_month TEXT -- YYYY-MM
        NOT NULL
        CHECK (budget_month ~ '^[0-9]{4}-(0[1-9]|1[0-2])$'),
    created_at TIMESTAMPTZ 
        NOT NULL 
        DEFAULT now(),
    
    UNIQUE (user_id, budget_category, budget_month)
);
