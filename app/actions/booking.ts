'use server'

import pool from '@/lib/db'
import { RowDataPacket, ResultSetHeader } from 'mysql2'

export interface ClassItem {
  id: string
  time: string
  name: string
  room: string
  instructor: string
  duration: string
  spots: number
  color: 'blue' | 'pink' | 'yellow' | 'green'
}

export interface BookingResult {
  success: boolean
  message: string
  isBooked?: boolean
}

// Get classes for a specific date and location
export async function getClasses(date: Date, location: string): Promise<ClassItem[]> {
  try {
    const formattedDate = date.toISOString().split('T')[0]
    
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT id, DATE_FORMAT(time, '%l:%i %p') as time, name, room, instructor, duration, spots, color 
       FROM classes 
       WHERE date = ? AND location = ?
       ORDER BY time`,
      [formattedDate, location]
    )
    
    return rows as ClassItem[]
  } catch (error) {
    console.error('Error fetching classes:', error)
    return []
  }
}

// Get user's booked class IDs
export async function getBookedClasses(userId: string = 'anonymous'): Promise<string[]> {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT class_id FROM bookings WHERE user_id = ? AND status = 'confirmed'`,
      [userId]
    )
    
    return rows.map((row) => row.class_id)
  } catch (error) {
    console.error('Error fetching booked classes:', error)
    return []
  }
}

// Toggle booking for a class
export async function toggleBooking(classId: string, userId: string = 'anonymous'): Promise<BookingResult> {
  try {
    // Check if already booked
    const [existing] = await pool.execute<RowDataPacket[]>(
      `SELECT id FROM bookings WHERE class_id = ? AND user_id = ? AND status = 'confirmed'`,
      [classId, userId]
    )
    
    if (existing.length > 0) {
      // Cancel booking
      await pool.execute<ResultSetHeader>(
        `UPDATE bookings SET status = 'cancelled' WHERE class_id = ? AND user_id = ? AND status = 'confirmed'`,
        [classId, userId]
      )
      
      // Restore spot
      await pool.execute<ResultSetHeader>(
        `UPDATE classes SET spots = spots + 1 WHERE id = ?`,
        [classId]
      )
      
      return { success: true, message: 'Booking cancelled', isBooked: false }
    } else {
      // Check available spots
      const [classInfo] = await pool.execute<RowDataPacket[]>(
        `SELECT spots FROM classes WHERE id = ?`,
        [classId]
      )
      
      if (classInfo.length === 0) {
        return { success: false, message: 'Class not found' }
      }
      
      if (classInfo[0].spots <= 0) {
        return { success: false, message: 'No spots available' }
      }
      
      // Create booking
      await pool.execute<ResultSetHeader>(
        `INSERT INTO bookings (class_id, user_id, status) VALUES (?, ?, 'confirmed')
         ON DUPLICATE KEY UPDATE status = 'confirmed', booked_at = CURRENT_TIMESTAMP`,
        [classId, userId]
      )
      
      // Decrease available spots
      await pool.execute<ResultSetHeader>(
        `UPDATE classes SET spots = spots - 1 WHERE id = ?`,
        [classId]
      )
      
      return { success: true, message: 'Class booked successfully', isBooked: true }
    }
  } catch (error) {
    console.error('Error toggling booking:', error)
    return { success: false, message: 'Failed to process booking' }
  }
}
