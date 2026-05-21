"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { toggleBooking } from "@/app/actions/booking"
import { useState, useTransition, useMemo } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"

export interface ClassItem {
  classId: string
  time: string
  date: string
  name: string
  room: string
  instructor: string
  duration: string
  spots: number
  color: "blue" | "pink" | "yellow" | "green"
}

interface ClassCardProps {
  classItem: ClassItem
  isBooked: boolean
  memberId: number 
  onBookingChange: (classId: string, isBooked: boolean) => void
}

const colorClasses = {
  blue: "bg-card-blue",
  pink: "bg-card-pink",
  yellow: "bg-card-yellow",
  green: "bg-card-green",
}

const iconColorClasses = {
  blue: "text-blue-600",
  pink: "text-pink-600",
  yellow: "text-amber-600",
  green: "text-emerald-600",
}

const classIcons: Record<string, JSX.Element> = {
  HIIT: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  Yoga: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  ),
  Pilates: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
  Spinning: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  Boxing: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  Strength: (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  ),
}

export function ClassCard({ classItem, isBooked, memberId, onBookingChange }: ClassCardProps) {

  const [isPending, startTransition] = useTransition()
  
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false) // New state for cancel confirmation
  const [errorMessage, setErrorMessage] = useState("")

  const icon = classIcons[classItem.name] || classIcons.HIIT

  const hasPassed = useMemo(() => {
    try {

      const [year, month, day] = classItem.date.split("-").map(Number)
      const timeStr = classItem.time.trim().toUpperCase()
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/)


      console.log ( "Class-Card ", year," ", month," ", day , " ",timeStr, " ", match )
      
      if (!match) return false

      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const modifier = match[3]

      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0


      const exactClassDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)

      return new Date() > exactClassDateTime
    } catch (e) {
      console.error("Failed to parse combined class deadline time:", e)
      return false
    }
  }, [classItem.time])

  // Core execution handler used for both standard booking and confirmed cancellation triggers
  const executeBookingToggle = () => {
    startTransition(async () => {
      console.log(" ClassCard ->", memberId, "<")
      const result = await toggleBooking(classItem.classId, memberId)
      
      if (result.success && result.isBooked !== undefined) {
        onBookingChange(classItem.classId, result.isBooked)
        if (result.isBooked) {
          setShowSuccessDialog(true)
        }
      } else if (!result.success) {
        setErrorMessage(result.message || "Something went wrong.")
        setShowErrorDialog(true)
      }
    })
  }

  const handleButtonClick = () => {
    if (hasPassed) return

    if (isBooked) {
      // If booked, intercept with confirmation modal instead of booking instantly
      setShowCancelDialog(true)
    } else {
      // If not booked, execute transaction directly
      executeBookingToggle()
    }
  }

  const buttonText = hasPassed 
    ? "Passed" 
    : isPending 
      ? "Processing..." 
      : isBooked 
        ? "Cancel Booking" 
        : "Book Now"

  return (
    <>
      <div className={cn(
        "rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
        colorClasses[classItem.color]
      )}>
        <div className="flex items-start justify-between">
          <div className="flex gap-3">
            <div className={cn(
              "w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center",
              iconColorClasses[classItem.color]
            )}>
              {icon}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground">{classItem.time}</span>
              <h3 className="text-base font-bold text-foreground">
                {classItem.name} {isBooked && !hasPassed && "✓"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {classItem.room} • {classItem.instructor}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-xs font-medium text-muted-foreground">{classItem.duration}</span>
            <span className="text-xs text-muted-foreground">{classItem.spots} spots</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-black/5">
          <Button
            onClick={handleButtonClick}
            disabled={isPending || hasPassed} 
            className={cn(
              "w-full h-9 rounded-xl font-semibold text-sm transition-colors",
              hasPassed
                ? "!bg-gray-400 !text-white opacity-100 cursor-not-allowed pointer-events-none" 
                : isBooked 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-foreground text-background hover:bg-foreground/90"
            )}
          >
            {buttonText}
          </Button>
        </div>
      </div>

      {/* 1. ERROR POPUP */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600 flex items-center gap-2">
              ⚠️ Booking Failed
            </DialogTitle>
            <DialogDescription className="pt-2 text-base text-foreground font-medium">
              {errorMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowErrorDialog(false)} className="w-full sm:w-auto rounded-xl">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2. CONFIRMED BOOKING DETAILS POPUP */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-emerald-600 flex items-center gap-2">
              🎉 Booking Confirmed!
            </DialogTitle>
            <DialogDescription className="pt-4">
              Your spot has been reserved successfully. Here are your class details:
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-muted/40 p-4 rounded-xl space-y-2.5 my-2 border border-border">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Class Name:</span>
              <span className="font-bold text-foreground">{classItem.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Time:</span>
              <span className="font-semibold text-foreground">{classItem.time} ({classItem.duration})</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Instructor:</span>
              <span className="font-medium text-foreground">{classItem.instructor}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Room:</span>
              <span className="font-medium text-foreground">{classItem.room}</span>
            </div>
          </div>

          <DialogFooter className="mt-2">
            <Button 
              onClick={() => setShowSuccessDialog(false)} 
              className="w-full rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              Great, thanks!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 3. CANCELLATION CONFIRMATION PROMPT POPUP */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              Cancel Booking?
            </DialogTitle>
            <DialogDescription className="pt-2">
              Are you sure you want to cancel your booking for <span className="font-semibold text-foreground">{classItem.name}</span> at {classItem.time}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)} 
              className="w-full sm:w-auto rounded-xl"
            >
              Keep Booking
            </Button>
            <Button 
              onClick={() => {
                setShowCancelDialog(false)
                executeBookingToggle()
              }} 
              className="w-full sm:w-auto rounded-xl bg-red-500 hover:bg-red-600 text-white"
            >
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}


