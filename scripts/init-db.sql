-- Create database if not exists
CREATE DATABASE IF NOT EXISTS sport_booking;
USE sport_booking;

-- Classes table to store available classes
CREATE TABLE IF NOT EXISTS classes (
  id VARCHAR(36) PRIMARY KEY,
  time VARCHAR(20) NOT NULL,
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
('0-1', '6:00 AM', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 8, 'blue', CURDATE(), 'Hong Kong'),
('0-2', '7:30 AM', 'Yoga', 'Room B2', 'Mike Chen', '60 min', 12, 'pink', CURDATE(), 'Hong Kong'),
('0-3', '9:00 AM', 'Pilates', 'Room C3', 'Emma Wilson', '50 min', 6, 'yellow', CURDATE(), 'Hong Kong'),
('0-4', '10:30 AM', 'Spinning', 'Room D1', 'James Lee', '45 min', 15, 'green', CURDATE(), 'Hong Kong'),
('0-5', '12:00 PM', 'Boxing', 'Room A2', 'Lisa Park', '60 min', 10, 'blue', CURDATE(), 'Hong Kong'),
('0-6', '2:00 PM', 'Strength', 'Room B1', 'David Kim', '55 min', 8, 'pink', CURDATE(), 'Hong Kong'),
('0-7', '4:00 PM', 'Yoga', 'Room C1', 'Amy Rodriguez', '60 min', 14, 'yellow', CURDATE(), 'Hong Kong'),
('0-8', '6:00 PM', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 5, 'green', CURDATE(), 'Hong Kong');

-- Insert sample classes for tomorrow
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('1-1', '7:00 AM', 'Yoga', 'Room B1', 'Amy Rodriguez', '60 min', 10, 'pink', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('1-2', '8:30 AM', 'Spinning', 'Room D1', 'James Lee', '45 min', 12, 'green', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('1-3', '10:00 AM', 'HIIT', 'Room A1', 'Sarah Johnson', '45 min', 8, 'blue', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('1-4', '11:30 AM', 'Pilates', 'Room C2', 'Emma Wilson', '50 min', 6, 'yellow', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('1-5', '1:00 PM', 'Boxing', 'Room A2', 'Lisa Park', '60 min', 14, 'blue', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong'),
('1-6', '5:00 PM', 'Strength', 'Room B1', 'David Kim', '55 min', 9, 'pink', DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'Hong Kong');

-- Kowloon location classes
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('kl-1', '7:00 AM', 'HIIT', 'Room K1', 'Tom Wong', '45 min', 10, 'blue', CURDATE(), 'Kowloon'),
('kl-2', '9:00 AM', 'Yoga', 'Room K2', 'Lisa Chan', '60 min', 15, 'pink', CURDATE(), 'Kowloon'),
('kl-3', '11:00 AM', 'Boxing', 'Room K1', 'Bruce Lam', '60 min', 8, 'green', CURDATE(), 'Kowloon');

-- Macau location classes  
INSERT INTO classes (id, time, name, room, instructor, duration, spots, color, date, location) VALUES
('mc-1', '8:00 AM', 'Spinning', 'Room M1', 'Alex Ho', '45 min', 12, 'green', CURDATE(), 'Macau'),
('mc-2', '10:00 AM', 'Pilates', 'Room M2', 'Jenny Liu', '50 min', 10, 'yellow', CURDATE(), 'Macau');
