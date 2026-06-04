"use client"

import { ClassCard } from "@/components/class-card"
import { ClassItem } from "@/types/sport-app"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface ClassListProps {
    classes: ClassItem[]
    bookedClasses: string[]
    memberId: number
    handleBookingChange: (classId: string, isBooked: boolean) => void
    selectedCalendarDate: Date 
}

export function ClassList({ 
    classes, 
    bookedClasses, 
    memberId, 
    handleBookingChange, 
    selectedCalendarDate 

}: ClassListProps) {
  
  const router = useRouter() // 💡 Added: Router instance to refresh data

  // 💡 Added: Polling effect that refreshes server data every 10 seconds

  useEffect(() => {
  
    const interval = setInterval(() => {

      console.log("🔄 [class-list.tsx -> Polling] Fetching fresh spots data from Redis/MySQL...")
      router.refresh() 

    }, 10000) // 10000ms = 10 seconds

    return () => clearInterval(interval) // Clean up interval on unmount
  
  }, [router])

  console.log("🎨 [class-list.tsx -> UI RENDER] Array items length arriving to ClassList:", classes?.length)

  const fallbackDateString = new Date(selectedCalendarDate || new Date())
    .toLocaleDateString("en-CA") // Generates reliable 'YYYY-MM-DD' strings

  if (!classes || classes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="flex flex-col items-center gap-3">
          <svg className="w-12 h-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-muted-foreground font-medium">No classes on this day</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4 mt-2">
        <h2 className="text-lg font-semibold text-foreground">
          {classes.length} Classes Available
        </h2>
        <button className="text-sm font-medium text-primary flex items-center gap-1">
          Filter
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {classes.map((classItem) => (
          <ClassCard
            key={classItem.classId}
            classItem={{
              ...classItem,
              // 🟢 FIXED: Safely applies the fallback string with full TypeScript type safety
              date: classItem.date || fallbackDateString 
            }}
            isBooked={bookedClasses.includes(classItem.classId)}
            memberId={memberId} 
            onBookingChange={handleBookingChange}
          />
        ))}
      </div>
    </>
  )
}


