-- Inventory Management System

-- ============================================
-- 1. USERS TABLE (Authentication)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'user',
  email_verified BOOLEAN DEFAULT FALSE,
  verification_token VARCHAR(255),
  verification_token_expiry TIMESTAMP,
  reset_token VARCHAR(255),
  reset_token_expiry TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for faster name lookups and sorting
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Insert default category
INSERT INTO categories (name, description) 
VALUES ('Uncategorized', 'Products without a specific category')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(250) NOT NULL,
  sku VARCHAR(50) UNIQUE,
  bar_code VARCHAR(50) UNIQUE,
  price NUMERIC(10, 2) NOT NULL CHECK (price >= 0),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_quantity INTEGER NOT NULL DEFAULT 10 CHECK (min_quantity >= 0), 
  description TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_bar_code ON products(bar_code);
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_quantity ON products(quantity);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Composite index for search queries (name, sku, description)
CREATE INDEX IF NOT EXISTS idx_products_search 
ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(sku, '') || ' ' || description));

-- ============================================
-- 4. TRIGGERS - Auto-update timestamps
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categories table
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
CREATE TRIGGER update_categories_updated_at
BEFORE UPDATE ON categories
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger for products table
DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Activity_LOGS TABLE
-- ============================================
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action_type VARCHAR(50) NOT NULL, -- e.g., 'CREATE', 'DELETE', 'UPDATE'
    description TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for sorting timeline
CREATE INDEX idx_logs_created_at ON activity_logs(created_at DESC);
