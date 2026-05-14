"use client"

import { useState, useEffect, useCallback } from "react"
import { ClassCard, type ClassItem } from "@/components/class-card"
import { getClasses, getBookedClasses } from "@/app/actions/booking"
import { useSession } from "next-auth/react"

interface ClassListProps {
  selectedDate: Date
  selectedLocation: string
}

export function ClassList({ selectedDate, selectedLocation }: ClassListProps) {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [bookedClasses, setBookedClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { data: session } = useSession()

  const userId =
    session?.user?.email?.trim() ||
    session?.user?.name?.trim() ||
    "anonymous"

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [classesData, bookedData] = await Promise.all([
        getClasses(selectedDate, selectedLocation),
        getBookedClasses(userId)
      ])
      setClasses(classesData)
      setBookedClasses(bookedData.map((booking) => booking.classId))
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, selectedLocation, userId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleBookingChange = (classId: string, isBooked: boolean) => {
    if (isBooked) {
      setBookedClasses((prev) => [...prev, classId])
    } else {
      setBookedClasses((prev) => prev.filter((id) => id !== classId))
    }
    // Refresh to get updated spots
    fetchData()
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-2xl p-4 bg-muted animate-pulse h-32" />
        ))}
      </div>
    )
  }

  if (classes.length === 0) {
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
            classItem={classItem}
            isBooked={bookedClasses.includes(classItem.classId)}
            userId={userId}
            onBookingChange={handleBookingChange}
          />
        ))}
      </div>
    </>
  )
}
