"use client"

import { useState } from "react"
import { DatePicker } from "@/components/date-picker"
import { ClassCard, type ClassItem } from "@/components/class-card"
import { BottomNav } from "@/components/bottom-nav"

const mockClasses: ClassItem[] = [
  {
    id: "1",
    time: "6:00 AM",
    name: "HIIT",
    room: "Room A1",
    instructor: "Sarah Johnson",
    duration: "45 min",
    spots: 8,
    color: "blue",
  },
  {
    id: "2",
    time: "7:30 AM",
    name: "Yoga",
    room: "Room B2",
    instructor: "Mike Chen",
    duration: "60 min",
    spots: 12,
    color: "pink",
  },
  {
    id: "3",
    time: "9:00 AM",
    name: "Pilates",
    room: "Room C3",
    instructor: "Emma Wilson",
    duration: "50 min",
    spots: 6,
    color: "yellow",
  },
  {
    id: "4",
    time: "10:30 AM",
    name: "Spinning",
    room: "Room D1",
    instructor: "James Lee",
    duration: "45 min",
    spots: 15,
    color: "green",
  },
  {
    id: "5",
    time: "12:00 PM",
    name: "Boxing",
    room: "Room A2",
    instructor: "Lisa Park",
    duration: "60 min",
    spots: 10,
    color: "blue",
  },
  {
    id: "6",
    time: "2:00 PM",
    name: "Strength",
    room: "Room B1",
    instructor: "David Kim",
    duration: "55 min",
    spots: 8,
    color: "pink",
  },
  {
    id: "7",
    time: "4:00 PM",
    name: "Yoga",
    room: "Room C1",
    instructor: "Amy Rodriguez",
    duration: "60 min",
    spots: 14,
    color: "yellow",
  },
  {
    id: "8",
    time: "6:00 PM",
    name: "HIIT",
    room: "Room A1",
    instructor: "Sarah Johnson",
    duration: "45 min",
    spots: 5,
    color: "green",
  },
]

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [activeTab, setActiveTab] = useState("classes")
  const [bookedClasses, setBookedClasses] = useState<string[]>([])

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
            <p className="text-sm text-muted-foreground">Good morning</p>
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
            {mockClasses.length} Classes Available
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
          {mockClasses.map((classItem) => (
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
