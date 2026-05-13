-- =============================================================
-- Schema Updates for Sport Booking App
-- Run this script against your MySQL database before deploying
-- =============================================================

-- 1. Add new columns to accounts table
ALTER TABLE accounts
  ADD COLUMN token_remain DECIMAL(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN expiry_date DATE DEFAULT NULL;

-- 2. Add UNIQUE constraints to prevent duplicate sign-ups at DB level
ALTER TABLE accounts
  ADD UNIQUE INDEX uq_accounts_email (email),
  ADD UNIQUE INDEX uq_accounts_username (username);

-- 3. Create contracts table for per-member contract tracking
CREATE TABLE IF NOT EXISTS contracts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  member_id INT NOT NULL,
  contract_status ENUM('active', 'expired', 'canceled') NOT NULL DEFAULT 'active',
  reminder_token DECIMAL(10,2) NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_contracts_member FOREIGN KEY (member_id) REFERENCES accounts(user_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_contracts_member (member_id),
  INDEX idx_contracts_status (contract_status)
);
