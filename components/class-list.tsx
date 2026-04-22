"use client"

import { useState, useEffect, useCallback } from "react"
import { ClassCard, type ClassItem } from "@/components/class-card"
import { getClasses, getBookedClasses } from "@/app/actions/booking"

interface ClassListProps {
  selectedDate: Date
  selectedLocation: string
}

export function ClassList({ selectedDate, selectedLocation }: ClassListProps) {
  const [classes, setClasses] = useState<ClassItem[]>([])
  const [bookedClasses, setBookedClasses] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const [classesData, bookedData] = await Promise.all([
        getClasses(selectedDate, selectedLocation),
        getBookedClasses()
      ])
      setClasses(classesData)
      setBookedClasses(bookedData)
    } catch (error) {
      console.error("Error fetching data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [selectedDate, selectedLocation])

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
      <div className="text-center py-8">
        <p className="text-muted-foreground">No classes available for this date and location.</p>
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
            key={classItem.id}
            classItem={classItem}
            isBooked={bookedClasses.includes(classItem.id)}
            onBookingChange={handleBookingChange}
          />
        ))}
      </div>
    </>
  )
}
