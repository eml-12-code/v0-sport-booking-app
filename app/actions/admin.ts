'use server'

import pool from '@/lib/db'
import { RowDataPacket } from 'mysql2'
import * as XLSX from 'xlsx'
// import { randomUUID } from 'crypto'
import crypto from 'crypto';


// Required columns in the uploaded Excel file
const REQUIRED_COLUMNS = ['name', 'time', 'date', 'room', 'instructor', 'duration', 'class_size', 'color', 'location'] as const

const VALID_COLORS = ['blue', 'pink', 'yellow', 'green'] as const

export interface UploadResult {
  success: boolean
  inserted: number
  updated: number
  total: number
  errors: string[]
}

export interface ParsedRow {
  name: string
  time: string
  date: string
  room: string
  instructor: string
  duration: string
  class_size: number
  color: string
  location: string
  token_cost: number
}

/**
 * Parse and upload an Excel file to upsert into the classes table.
 * Matches existing rows by (date, time, location, room) composite key.
 * Auto-generates UUIDs for new rows.
 */
export async function uploadClassSchedule(formData: FormData): Promise<UploadResult> {
  const file = formData.get('file') as File | null

  if (!file) {
    return { success: false, inserted: 0, updated: 0, total: 0, errors: ['No file provided'] }
  }

  // Read file buffer
  const buffer = Buffer.from(await file.arrayBuffer())
  const workbook = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = workbook.SheetNames[0]

  if (!sheetName) {
    return { success: false, inserted: 0, updated: 0, total: 0, errors: ['Excel file has no sheets'] }
  }

  const sheet = workbook.Sheets[sheetName]
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet)

  if (rawRows.length === 0) {
    return { success: false, inserted: 0, updated: 0, total: 0, errors: ['Sheet is empty'] }
  }

  // Validate required columns exist (case-insensitive header matching)
  const firstRow = rawRows[0]
  const headers = Object.keys(firstRow).map((h) => h.toLowerCase().trim())
  const missingColumns = REQUIRED_COLUMNS.filter((col) => !headers.includes(col))

  if (missingColumns.length > 0) {
    return {
      success: false,
      inserted: 0,
      updated: 0,
      total: rawRows.length,
      errors: [`Missing required columns: ${missingColumns.join(', ')}`],
    }
  }

  // Parse and validate each row
  const parsedRows: ParsedRow[] = []
  const errors: string[] = []

  for (let i = 0; i < rawRows.length; i++) {
    const raw = rawRows[i]
    const rowNum = i + 2 // Excel row number (1-indexed + header)

    // Normalize keys to lowercase
    const row: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(raw)) {
      row[key.toLowerCase().trim()] = value
    }

    const name = String(row.name || '').trim()
    const time = String(row.time || '').trim()
    const date = String(row.date || '').trim()
    const room = String(row.room || '').trim()
    const instructor = String(row.instructor || '').trim()
    const duration = String(row.duration || '').trim()
    const class_size = Number(row.class_size)
    const color = String(row.color || '').trim().toLowerCase()
    const location = String(row.location || '').trim()
    const tokenCost = row.token_cost !== undefined ? Number(row.token_cost) : 1.0

    // Validate required fields
    if (!name || !time || !date || !room || !instructor || !duration || !location) {
      errors.push(`Row ${rowNum}: Missing required field(s)`)
      continue
    }

    if (isNaN(class_size) || class_size < 0) {
      errors.push(`Row ${rowNum}: Invalid class size value "${row.class_size}"`)
      continue
    }

    if (!VALID_COLORS.includes(color as (typeof VALID_COLORS)[number])) {
      errors.push(`Row ${rowNum}: Invalid color "${color}". Must be one of: ${VALID_COLORS.join(', ')}`)
      continue
    }

    

    if (isNaN(tokenCost) || tokenCost < 0) {
      errors.push(`Row ${rowNum}: Invalid token_cost "${row.token_cost}"`)
      continue
    }

    // Normalize date: handle Excel serial numbers and common formats
    let normalizedDate: string
    if (typeof raw[Object.keys(raw).find((k) => k.toLowerCase().trim() === 'date')!] === 'number') {
      // Excel serial date number
      const excelDate = XLSX.SSF.parse_date_code(
        raw[Object.keys(raw).find((k) => k.toLowerCase().trim() === 'date')!] as number
      )
      normalizedDate = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
    } else {
      // Try to parse as date string
      const parsed = new Date(date)
      if (isNaN(parsed.getTime())) {
        errors.push(`Row ${rowNum}: Invalid date "${date}"`)
        continue
      }
      normalizedDate = parsed.toISOString().split('T')[0]
    }

    // Normalize time: convert to HH:MM:SS format for MySQL TIME column
    let normalizedTime: string
    if (typeof raw[Object.keys(raw).find((k) => k.toLowerCase().trim() === 'time')!] === 'number') {
      // Excel serial time fraction (e.g. 0.25 = 06:00:00)
      const totalSeconds = Math.round(
        (raw[Object.keys(raw).find((k) => k.toLowerCase().trim() === 'time')!] as number) * 86400
      )
      const h = Math.floor(totalSeconds / 3600)
      const m = Math.floor((totalSeconds % 3600) / 60)
      const s = totalSeconds % 60
      normalizedTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    } else {
      // Accept HH:MM, HH:MM:SS, or h:mm AM/PM
      const timeStr = time.toUpperCase()
      const ampmMatch = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
      if (ampmMatch) {
        let hours = parseInt(ampmMatch[1])
        const mins = ampmMatch[2]
        const period = ampmMatch[3].toUpperCase()
        if (period === 'PM' && hours !== 12) hours += 12
        if (period === 'AM' && hours === 12) hours = 0
        normalizedTime = `${String(hours).padStart(2, '0')}:${mins}:00`
      } else if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
        normalizedTime = time.length <= 5 ? `${time}:00` : time
        // Pad hours
        const parts = normalizedTime.split(':')
        normalizedTime = `${parts[0].padStart(2, '0')}:${parts[1]}:${parts[2]}`
      } else {
        errors.push(`Row ${rowNum}: Invalid time format "${time}"`)
        continue
      }
    }

    parsedRows.push({
      name,
      time: normalizedTime,
      date: normalizedDate,
      room,
      instructor,
      duration,
      class_size,
      color,
      location,
      token_cost: tokenCost,
    })
  }

  if (parsedRows.length === 0) {
    return { success: false, inserted: 0, updated: 0, total: rawRows.length, errors }
  }

  // Insert into database
  let inserted = 0
  let updated = 0
  const connection = await pool.getConnection()

  try {
    await connection.beginTransaction()

    for (const row of parsedRows) {
      // Check if a class already exists with same (date, time, location, room)
      const [existing] = await connection.execute<RowDataPacket[]>(
        `SELECT class_id FROM classes WHERE date = ? AND time = ? AND location = ? AND room = ?`,
        [row.date, row.time, row.location, row.room]
      )
      
      if (existing.length > 0) {
        // UPDATE existing row

        console.log( "Update " , existing[0].class_id )
        await connection.execute(
          `UPDATE classes 
           SET name = ?, instructor = ?, duration = ?, spots = ?, color = ?, token_cost = ?, class_size = ?
           WHERE class_id = ?`,
          [row.name, row.instructor, row.duration, row.class_size, row.color, row.token_cost, row.class_size, existing[0].class_id]
        )
        updated++
      } else {

        // 1. Generate a 6-character hex string
        const id = crypto.randomBytes(4).toString('hex');

        // 2. Split into two groups of 4
        const groupedHex = `${id.substring(0, 4)}-${id.substring(4)}`;

        await connection.execute(
          `INSERT INTO classes (class_id, time, name, room, instructor, duration, spots, color, date, location, token_cost,  class_size, created_at)
                        VALUES (?       , ?   ,    ?,    ?,          ?,        ?,     ?,     ?,    ?,        ?,          ?,  ?,   NOW()     )`,
          [groupedHex, row.time, row.name, row.room, row.instructor, row.duration, row.class_size, row.color, row.date, row.location,  row.class_size,row.token_cost ]
        )
        console.log( "Insert " , groupedHex )
        inserted++
      }

    }

    await connection.commit()
  } catch (error) {
    console.log ( "Error ", error.message )
    await connection.rollback()
    const msg = error instanceof Error ? error.message : 'Unknown database error'
    errors.push(`Database error:  ${msg}`)
    return { success: false, inserted: 0, updated: 0, total: rawRows.length, errors }
  } finally {
    connection.release()
  }

  return {
    success: true,
    inserted,
    updated,
    total: rawRows.length,
    errors,
  }
}
