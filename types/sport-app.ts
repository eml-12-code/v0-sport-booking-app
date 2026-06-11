
export interface ClassItem {
  classId: string
  time: string  // E.g., "10:00 AM" or "14:30"
  date: string  // E.g., "2026-05-22"
  name: string
  room: string
  instructor: string
  duration: string
  spots: number
  classSize: number
  color: "blue" | "pink" | "yellow" | "green"
  tokenCost: number
  isWaitlisted?: boolean
}
