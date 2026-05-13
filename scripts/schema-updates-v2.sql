-- ============================================================
-- Schema Updates V2: token_cost + transactions_log
-- Run this AFTER schema-updates.sql (which adds token_remain
-- and expiry_date to accounts, plus the contracts table).
-- ============================================================

-- 1. Add per-class token cost (default 1 token per booking)
ALTER TABLE classes
  ADD COLUMN token_cost DECIMAL(10,2) NOT NULL DEFAULT 1.00;

-- 2. Create transactions_log to record every booking/cancellation
CREATE TABLE IF NOT EXISTS transactions_log (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     VARCHAR(100) NOT NULL,
  class_id    VARCHAR(36)  NOT NULL,
  action      ENUM('book', 'cancel') NOT NULL,
  token_amount        DECIMAL(10,2) NOT NULL,  -- positive = deducted, negative = refunded
  token_balance_after DECIMAL(10,2) NOT NULL,  -- snapshot after the transaction
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_txlog_user  (user_id),
  INDEX idx_txlog_class (class_id)
);
