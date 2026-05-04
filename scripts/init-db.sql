-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sport_booking;
USE sport_booking;

-- Classes table to store available classes
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  time TIME NOT NULL,
  name VARCHAR(100) NOT NULL,
  room VARCHAR(50) NOT NULL,
  instructor VARCHAR(100) NOT NULL,
  duration VARCHAR(20) NOT NULL,
  spots INT NOT NULL,
  color ENUM('blue', 'pink', 'yellow', 'green') NOT NULL,
  date DATE NOT NULL,
  location VARCHAR(100) NOT NULL DEFAULT 'Hong Kong',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bookings table to store user bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  class_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(100) NOT NULL DEFAULT 'anonymous',
  booked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('confirmed', 'cancelled') DEFAULT 'confirmed',
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_booking (class_id, user_id, status)
);

-- Insert sample classes for today
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('HK-1', '06:00:00', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 8, 'blue', CURDATE(), 'Hong Kong'),
('HK-2', '07:30:00', 'Yoga', 'Room B2', 'Mike Chen', '60 min', 12, 'pink', CURDATE(), 'Hong Kong'),
('HK-3', '09:00:00', 'Pilates', 'Room C3', 'Emma Wilson', '50 min', 6, 'yellow', CURDATE(), 'Hong Kong'),
('HK-4', '10:30:00', 'Spinning', 'Room D1', 'James Lee', '45 min', 1, 'green', CURDATE(), 'Hong Kong'),
('HK-5', '12:00:00', 'Boxing', 'Room A2', 'Lisa Park', '60 min', 10, 'blue', CURDATE(), 'Hong Kong'),
('HK-6', '14:00:00', 'Strength', 'Room B1', 'David Kim', '55 min', 8, 'pink', CURDATE(), 'Hong Kong'),
('HK-7', '16:00:00', 'Yoga', 'Room C1', 'Amy Rodriguez', '60 min', 14, 'yellow', CURDATE(), 'Hong Kong'),
('HK-8', '18:00:00', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 5, 'green', CURDATE(), 'Hong Kong');

-- Insert sample classes for tomorrow
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('HK-21', '07:00:00', 'Yoga', 'Room B1', 'Amy Rodriguez', '60 min', 10, 'pink', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('HK-22', '08:30:00', 'Spinning', 'Room D1', 'James Lee', '45 min', 12, 'green', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('HK-23', '10:00:00', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 8, 'blue', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('HK-24', '11:30:00', 'Pilates', 'Room C2', 'Emma Wilson', '50 min', 6, 'yellow', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('HK-25', '13:00:00', 'Boxing', 'Room A2', 'Lisa Park', '60 min', 14, 'blue', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('HK-26', '17:00:00', 'Strength', 'Room B1', 'David Kim', '55 min', 9, 'pink', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong');

-- Insert sample classes for tomorrow
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('HK-11', '07:00:00', 'Yoga', 'Room B1', 'Amy Rodriguez', '60 min', 10, 'pink', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong'),
('HK-12', '08:30:00', 'Spinning', 'Room D1', 'James Lee', '45 min', 12, 'green', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong'),
('HK-13', '10:00:00', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 8, 'blue', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong'),
('HK-14', '11:30:00', 'Pilates', 'Room C2', 'Emma Wilson', '50 min', 6, 'yellow', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong'),
('HK-15', '13:00:00', 'Boxing', 'Room A2', 'Lisa Park', '60 min', 14, 'blue', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong'),
('HK-16', '17:00:00', 'Strength', 'Room B1', 'David Kim', '55 min', 9, 'pink', DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'Hong Kong');

-- Kowloon location classes
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('kl-1', '07:00:00', 'HIIT', 'Room K1', 'Tom Wong', '45 min', 10, 'blue', CURDATE(), 'Kowloon'),
('kl-2', '09:00:00', 'Yoga', 'Room K2', 'Lisa Chan', '60 min', 15, 'pink', CURDATE(), 'Kowloon'),
('kl-3', '11:00:00', 'Boxing', 'Room K1', 'Bruce Lam', '60 min', 8, 'green', CURDATE(), 'Kowloon');

-- Macau location classes  
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('mc-1', '08:00:00', 'Spinning', 'Room M1', 'Alex Ho', '45 min', 12, 'green', CURDATE(), 'Macau'),
('mc-2', '10:00:00', 'Pilates', 'Room M2', 'Jenny Liu', '50 min', 10, 'yellow', CURDATE(), 'Macau');
