-- Migration: Change time column from VARCHAR to TIME
USE sport_booking;

-- First, update existing data to TIME format
-- Convert '6:00 AM' format to '06:00:00' TIME format
UPDATE classes SET time = STR_TO_DATE(time, '%l:%i %p') WHERE time LIKE '%AM' OR time LIKE '%PM';

-- Alter the column type from VARCHAR to TIME
ALTER TABLE classes MODIFY COLUMN time TIME NOT NULL;
