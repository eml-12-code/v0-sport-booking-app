"use client"

import { useState, useMemo } from "react"
import { DatePicker } from "@/components/date-picker"
import { ClassCard, type ClassItem } from "@/components/class-card"
import { BottomNav } from "@/components/bottom-nav"

// Helper to get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

// Helper to get date key for a date (offset from today)
const getDateKey = (date: Date): number => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const target = new Date(date)
  target.setHours(0, 0, 0, 0)
  const diffTime = target.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// Classes organized by day offset (0 = today, 1 = tomorrow, etc.)
const classesByDate: Record<number, ClassItem[]> = {
  0: [ // Today
    { id: "0-1", time: "6:00 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 8, color: "blue" },
    { id: "0-2", time: "7:30 AM", name: "Yoga", room: "Room B2", instructor: "Mike Chen", duration: "60 min", spots: 12, color: "pink" },
    { id: "0-3", time: "9:00 AM", name: "Pilates", room: "Room C3", instructor: "Emma Wilson", duration: "50 min", spots: 6, color: "yellow" },
    { id: "0-4", time: "10:30 AM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 15, color: "green" },
    { id: "0-5", time: "12:00 PM", name: "Boxing", room: "Room A2", instructor: "Lisa Park", duration: "60 min", spots: 10, color: "blue" },
    { id: "0-6", time: "2:00 PM", name: "Strength", room: "Room B1", instructor: "David Kim", duration: "55 min", spots: 8, color: "pink" },
    { id: "0-7", time: "4:00 PM", name: "Yoga", room: "Room C1", instructor: "Amy Rodriguez", duration: "60 min", spots: 14, color: "yellow" },
    { id: "0-8", time: "6:00 PM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 5, color: "green" },
  ],
  1: [ // Tomorrow
    { id: "1-1", time: "7:00 AM", name: "Yoga", room: "Room B1", instructor: "Amy Rodriguez", duration: "60 min", spots: 10, color: "pink" },
    { id: "1-2", time: "8:30 AM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 12, color: "green" },
    { id: "1-3", time: "10:00 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 8, color: "blue" },
    { id: "1-4", time: "11:30 AM", name: "Pilates", room: "Room C2", instructor: "Emma Wilson", duration: "50 min", spots: 6, color: "yellow" },
    { id: "1-5", time: "1:00 PM", name: "Boxing", room: "Room A2", instructor: "Lisa Park", duration: "60 min", spots: 14, color: "blue" },
    { id: "1-6", time: "5:00 PM", name: "Strength", room: "Room B1", instructor: "David Kim", duration: "55 min", spots: 9, color: "pink" },
  ],
  2: [ // Day after tomorrow
    { id: "2-1", time: "6:30 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 10, color: "blue" },
    { id: "2-2", time: "8:00 AM", name: "Yoga", room: "Room B2", instructor: "Mike Chen", duration: "60 min", spots: 15, color: "pink" },
    { id: "2-3", time: "10:00 AM", name: "Boxing", room: "Room A2", instructor: "Lisa Park", duration: "60 min", spots: 8, color: "green" },
    { id: "2-4", time: "12:00 PM", name: "Pilates", room: "Room C3", instructor: "Emma Wilson", duration: "50 min", spots: 7, color: "yellow" },
    { id: "2-5", time: "3:00 PM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 18, color: "green" },
  ],
  3: [ // +3 days
    { id: "3-1", time: "7:00 AM", name: "Strength", room: "Room B1", instructor: "David Kim", duration: "55 min", spots: 6, color: "pink" },
    { id: "3-2", time: "9:00 AM", name: "Yoga", room: "Room B2", instructor: "Amy Rodriguez", duration: "60 min", spots: 12, color: "yellow" },
    { id: "3-3", time: "11:00 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 10, color: "blue" },
    { id: "3-4", time: "2:00 PM", name: "Pilates", room: "Room C1", instructor: "Emma Wilson", duration: "50 min", spots: 8, color: "yellow" },
  ],
  4: [ // +4 days
    { id: "4-1", time: "6:00 AM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 20, color: "green" },
    { id: "4-2", time: "8:00 AM", name: "Boxing", room: "Room A2", instructor: "Lisa Park", duration: "60 min", spots: 12, color: "blue" },
    { id: "4-3", time: "10:30 AM", name: "Yoga", room: "Room B1", instructor: "Mike Chen", duration: "60 min", spots: 14, color: "pink" },
    { id: "4-4", time: "1:00 PM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 8, color: "blue" },
    { id: "4-5", time: "4:00 PM", name: "Strength", room: "Room B2", instructor: "David Kim", duration: "55 min", spots: 10, color: "green" },
    { id: "4-6", time: "6:30 PM", name: "Pilates", room: "Room C3", instructor: "Emma Wilson", duration: "50 min", spots: 6, color: "yellow" },
  ],
  5: [ // +5 days
    { id: "5-1", time: "7:30 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 9, color: "blue" },
    { id: "5-2", time: "9:30 AM", name: "Pilates", room: "Room C2", instructor: "Emma Wilson", duration: "50 min", spots: 8, color: "yellow" },
    { id: "5-3", time: "12:00 PM", name: "Yoga", room: "Room B1", instructor: "Amy Rodriguez", duration: "60 min", spots: 16, color: "pink" },
  ],
  6: [ // +6 days
    { id: "6-1", time: "8:00 AM", name: "Yoga", room: "Room B2", instructor: "Mike Chen", duration: "60 min", spots: 18, color: "pink" },
    { id: "6-2", time: "10:00 AM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 15, color: "green" },
    { id: "6-3", time: "11:30 AM", name: "Boxing", room: "Room A2", instructor: "Lisa Park", duration: "60 min", spots: 10, color: "blue" },
    { id: "6-4", time: "2:00 PM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 7, color: "green" },
    { id: "6-5", time: "4:30 PM", name: "Strength", room: "Room B1", instructor: "David Kim", duration: "55 min", spots: 11, color: "pink" },
  ],
}

// Default classes for dates without specific schedule
const defaultClasses: ClassItem[] = [
  { id: "d-1", time: "8:00 AM", name: "Yoga", room: "Room B1", instructor: "Mike Chen", duration: "60 min", spots: 12, color: "pink" },
  { id: "d-2", time: "10:00 AM", name: "HIIT", room: "Room A1", instructor: "Sarah Johnson", duration: "45 min", spots: 10, color: "blue" },
  { id: "d-3", time: "12:00 PM", name: "Pilates", room: "Room C2", instructor: "Emma Wilson", duration: "50 min", spots: 8, color: "yellow" },
  { id: "d-4", time: "3:00 PM", name: "Spinning", room: "Room D1", instructor: "James Lee", duration: "45 min", spots: 14, color: "green" },
]

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("classes")
  const [bookedClasses, setBookedClasses] = useState<string[]>([])

  // Get classes for the selected date
  const currentClasses = useMemo(() => {
    const dayOffset = getDateKey(selectedDate)
    return classesByDate[dayOffset] || defaultClasses
  }, [selectedDate])

  const handleBook = (id: string) => {
    if (bookedClasses.includes(id)) {
      setBookedClasses(bookedClasses.filter((c) => c !== id))
    } else {
      setBookedClasses([...bookedClasses, id])
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer for iPhone */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 pb-2">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">{getGreeting()}</p>
            <h1 className="text-2xl font-bold text-foreground">Find Your Class</h1>
          </div>
          <button className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center">
            <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
        </div>
        
        {/* Date Picker */}
        <DatePicker selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      </header>

      {/* Main Content */}
      <main className="px-5 pb-28">
        <div className="flex items-center justify-between mb-4 mt-2">
          <h2 className="text-lg font-semibold text-foreground">
            {currentClasses.length} Classes Available
          </h2>
          <button className="text-sm font-medium text-primary flex items-center gap-1">
            Filter
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
          </button>
        </div>

        {/* Class List */}
        <div className="flex flex-col gap-3">
          {currentClasses.map((classItem) => (
            <ClassCard
              key={classItem.id}
              classItem={{
                ...classItem,
                name: bookedClasses.includes(classItem.id) 
                  ? `${classItem.name} ✓` 
                  : classItem.name
              }}
              onBook={handleBook}
            />
          ))}
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}
