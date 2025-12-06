-- ============================================
--  Inventory System - Database Schema
-- ============================================

-- Drop tables if they exist (optional, for clean reset)
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ============================================
--  Updated Users Table
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,

    -- User management
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN ('user', 'admin', 'manager')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    email_verified BOOLEAN NOT NULL DEFAULT false,

    -- Security
    verification_token VARCHAR(255),
    verification_token_expiry TIMESTAMP;
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    last_login TIMESTAMP,

    -- Timestamps
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT chk_email_format
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);


-- ============================================
--  Products Table
-- ============================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,

    -- Product identity
    name        VARCHAR(200) NOT NULL,
    sku         VARCHAR(50) UNIQUE,              -- optional internal code
    bar_code    VARCHAR(50) NOT NULL UNIQUE,     -- scanner code, must be unique

    -- Pricing & inventory
    price       NUMERIC(10,2) NOT NULL CHECK (price >= 0),
    cost_price  NUMERIC(10,2) CHECK (cost_price >= 0),
    quantity    INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    min_quantity INTEGER NOT NULL DEFAULT 10 CHECK (min_quantity >= 0),

    -- Categorization & description
    category    VARCHAR(100),
    description TEXT NOT NULL,

    -- Media
    image_url   TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'discontinued')),

    -- Timestamps / soft delete
    created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at  TIMESTAMP,

    -- Extra constraints
    CONSTRAINT chk_name_length
        CHECK (char_length(name) BETWEEN 2 AND 200),

    CONSTRAINT chk_price_greater_than_cost
        CHECK (price >= cost_price OR cost_price IS NULL)
);

-- Helpful indexes
CREATE INDEX idx_products_name     ON products(name);
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_status   ON products(status);

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_users_verification_token 
ON users(verification_token) 
WHERE verification_token IS NOT NULL;