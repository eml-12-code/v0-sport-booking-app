-- Migration: Add token_remain and expiry_date to accounts table
USE sport_booking;

-- Add token_remain column (numeric, default 0)
ALTER TABLE accounts ADD COLUMN token_remain DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Add expiry_date column (membership expiry date)
ALTER TABLE accounts ADD COLUMN expiry_date DATE DEFAULT NULL;
