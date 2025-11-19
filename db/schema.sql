-- ============================================
--  Inventory System - Database Schema
-- ============================================

-- Drop tables if they exist (optional, for clean reset)
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- ============================================
--  Users Table
-- ============================================

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
--  Products Table
-- ============================================

CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    price NUMERIC(10,2) NOT NULL,
    quantity INTEGER NOT NULL,
    description TEXT NOT NULL,
    bar_code TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);