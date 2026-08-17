-- Completes the remaining SRS Could-Have / lower-priority features:
-- blog (FR-PUBLIC-23..26, FR-ADMIN-17), testimonials (FR-PUBLIC-17/18,
-- FR-ADMIN-18), public returns chart data (FR-PUBLIC-10/11, FR-ADMIN-19),
-- and the global monthly return rate (FR-ADMIN-13).

CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    slug VARCHAR(220) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_published BOOLEAN DEFAULT FALSE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    rating SMALLINT CHECK (rating BETWEEN 1 AND 5) DEFAULT 5,
    is_visible BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    month SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12),
    year SMALLINT NOT NULL,
    return_pct NUMERIC(5,2) NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (month, year)
);

-- Single-row settings table (id is always 1) — holds the global monthly
-- return rate Investment Heads see as the default when processing payouts.
CREATE TABLE IF NOT EXISTS platform_settings (
    id SMALLINT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    global_return_pct NUMERIC(5,2) NOT NULL DEFAULT 2.00,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
INSERT INTO platform_settings (id, global_return_pct)
VALUES (1, 2.00)
ON CONFLICT (id) DO NOTHING;
