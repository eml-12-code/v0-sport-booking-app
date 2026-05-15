"use client"

import { useState } from "react"
import { DatePicker } from "@/components/date-picker"
import { ClassList } from "@/components/class-list"
import { useSession } from "next-auth/react"

const locations = ["Hong Kong", "Kowloon", "Macau"] as const

// Helper to get time-based greeting
const getGreeting = (): string => {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

export function ClassesScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)
  const { data: session } = useSession()

  const userDisplayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    ""
    console.log ( "ClassesScreen --> ")

  return (
    <>
      {/* Status Bar Spacer for iPhone */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 pb-2">
        {/* Location Selector */}
        <div className="relative mb-3">
          <button
            onClick={() => setIsLocationOpen(!isLocationOpen)}
            className="flex items-center gap-2 text-lg font-semibold text-primary"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {selectedLocation}
            <svg className={`w-5 h-5 transition-transform ${isLocationOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {isLocationOpen && (
            <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[140px]">
              {locations.map((location) => (
                <button
                  key={location}
                  onClick={() => {
                    setSelectedLocation(location)
                    setIsLocationOpen(false)
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-muted transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    selectedLocation === location ? "text-primary font-medium" : "text-foreground"
                  }`}
                >
                  {location}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">
              {userDisplayName ? `${getGreeting()}, ${userDisplayName}` : getGreeting()}
            </p>
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
        <ClassList selectedDate={selectedDate} selectedLocation={selectedLocation} />
      </main>
    </>
  )
}
