"use client"

import { cn } from "@/lib/utils"
import { ClassItem } from "@/types/sport-app"
import { Button } from "@/components/ui/button"
import { toggleBooking } from "@/app/actions/booking"
import { useState, useEffect, useTransition } from "react"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"


interface ClassCardProps {
  classItem: ClassItem
  isBooked: boolean
  memberId: number 
  onBookingChange: (classId: string, isBooked: boolean, isOnWaitlist?: boolean) => void
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

// ------------------------------------
// ClassCard
// ------------------------------------

export function ClassCard({ classItem, isBooked, memberId, onBookingChange }: ClassCardProps) {

  const [isPending, startTransition]    = useTransition()
  const [hasPassed, setHasPassed]       = useState(false)

//  const [isOnWaitlist, setIsOnWaitlist] = useState(false)
  const [isOnWaitlist, setIsOnWaitlist] = useState(classItem.isWaitlisted || false)

  
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")

  const icon = classIcons[classItem.name] || classIcons.HIIT

  // Live interval time-expiration check runner hook

  useEffect(() => {

  function checkTimeExpiration() {

    try {

      if (!classItem || !classItem.time) {
        setHasPassed(false)
        return
      }

      let year: number, month: number, day: number;

      // 🟢 UNIVERSAL NORMALIZER: Force whatever format classItem.date is into a clean Date object
      
      const safeDateObject = classItem.date ? new Date(classItem.date) : new Date();

      if (isNaN(safeDateObject.getTime())) {

        // Safe Fallback if parsing fails: Use current live date variables
        const fallback = new Date()
        year = fallback.getFullYear()
        month = fallback.getMonth() + 1
        day = fallback.getDate()
      
      } else {
      
        // Extract accurate numeric parameters directly from our verified date object instance
        year = safeDateObject.getFullYear()
        month = safeDateObject.getMonth() + 1 // JavaScript months are 0-11, add 1 to normalize
        day = safeDateObject.getDate()
      
      }

      const timeStr = classItem.time.trim().toUpperCase()
      // console.log("⏱️ [ class-card.tsx -> ClassCard Verification Fixed ]", classItem.name, year, month, day, timeStr)

      // FIXED REGEX: Anchor set correctly to string end '$' instead of literal character '\$'
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/)

      if (!match) {
        setHasPassed(false)
        return
      }  

      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const modifier = match[3]

      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0

      // Create the precise combined timestamp milestone parameters
      const exactClassDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)
      
      // Update our reactive component layout status tracking variable
      setHasPassed(new Date() > exactClassDateTime)
    
    } catch (e) {

      console.error("Failed to parse combined class deadline time:", e)
    }
  }

    checkTimeExpiration()
    const interval = setInterval(checkTimeExpiration, 10000) // Re-evaluate every 10 seconds silently on screen
    return () => clearInterval(interval)
  }, [classItem.date, classItem.time, classItem.name])


  // 🟢 ADD THIS NEW SEPARATE HOOK DIRECTLY HERE:
  // This forces the card UI text to update whenever you switch browser tabs 
  // and Next.js pulls fresh waitlist data from your Redis/MySQL backend.

  useEffect(() => {
    setIsOnWaitlist(classItem.isWaitlisted || false)
  }, [classItem.isWaitlisted])


  // Core execution handler used for both standard booking and confirmed cancellation triggers
  const executeBookingToggle = () => {
  startTransition(async () => {
    console.log(" [class-card.tsx -> ClassCard ] -> memberId:", memberId)
    
    // Send the request to your server action 
    const result = await toggleBooking(classItem.classId, memberId)
    
    // 1. Handle standard Booking or Standard Cancellation Success
    if (result.success && result.isBooked !== undefined) {

      // 🟢 FIXED: Using local state variable 'isOnWaitlist' exclusively
      if (isOnWaitlist && !result.isBooked) {
        onBookingChange(classItem.classId, false, false) 
        setIsOnWaitlist(false) // Clear local waitlist state on cancellation
        return
      }
      
      // Otherwise, update regular standard booking flags
      onBookingChange(classItem.classId, result.isBooked, false)
      if (result.isBooked) {
        setShowSuccessDialog(true)
      }
    } 

    // 2. Intercept the Lua waitlist entry flag cleanly
    else if (!result.success && result.message === "WAITING_QUEUE") {
      onBookingChange(classItem.classId, false, true) 
      classItem.spots = 0 
    
      setErrorMessage("This class just filled up! You have been placed on the Waiting Queue.")
      setShowErrorDialog(true)

      setIsOnWaitlist(true)
    }
    
    // 3. Handle explicit Waitlist Cancellation Success
    else if (result.success && result.message === "CANCEL_WAITLIST_SUCCESSFUL") {
      onBookingChange(classItem.classId, false, false)
      setIsOnWaitlist(false) 
    }

    // 4. Standard runtime backend error catches
    else if (!result.success) {
      setErrorMessage(result.message || "Something went wrong.")
      setShowErrorDialog(true)
    }
  })
  }

  // handleButtonClick
  const handleButtonClick = () => {
  if (hasPassed) return

  // 🟢 FIXED: Evaluated against 'isOnWaitlist' local state variables
  if (isBooked || isOnWaitlist) {
      setShowCancelDialog(true)
  } else {
      executeBookingToggle()
  }
  }

const isFull = classItem.spots <= 0

const buttonText = hasPassed 
    ? "Passed"
    : isPending
    ? "Processing..."
    : isBooked
    ? "Cancel Booking"
    : isOnWaitlist 
    ? "Cancel Waitlist"              
    : isFull
    ? "Join Waitlist" 
    : "Book Now"

return (
  <>
    <div className={cn(
      "rounded-2xl p-4 transition-all duration-200 hover:shadow-md hover:scale-[1.02]",
      colorClasses[classItem.color],
      hasPassed && "opacity-50 saturate-50 pointer-events-none select-none shadow-none scale-100 hover:scale-100 hover:shadow-none"
    )}>

      {/* iconColorClasses  */}
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
        
        {/* Right Info Section */}
        <div className="flex flex-col items-end gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">{classItem.duration}</span>

          <span className={cn(
            "text-xs font-semibold px-2 py-0.5 rounded-md", 
            isFull 
              ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" 
              : "text-muted-foreground bg-black/5 dark:bg-white/5"
          )}>
            {isFull 
              ? `0 / ${classItem.classSize} spots (Full)` 
              : `${classItem.spots} / ${classItem.classSize} available`}
          </span>

          {classItem.tokenCost !== undefined && (
            <span className="text-xs bg-white/80 dark:bg-black/20 px-2 py-0.5 rounded-full font-bold text-foreground">
              🪙 {classItem.tokenCost} {classItem.tokenCost === 1 ? "Token" : "Tokens"}
            </span>
          )}
        </div>
      </div>

      {/* Button CTA Action container block */}
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
              : isOnWaitlist // 🟢 FIXED: Turned red with active pointer triggers when waitlisted
              ? "bg-red-500 text-white hover:bg-red-600 cursor-pointer" 
              : isFull
              ? "bg-amber-500 text-white hover:bg-amber-600 cursor-pointer" 
              : "bg-foreground text-background hover:bg-foreground/90"
          )}
        >
          {buttonText}
        </Button>
      </div>

    </div>

    {/* 1. ERROR DIALOG POPUP */}
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

    {/* 2. CONFIRMED DETAILS POPUP */}
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

    {/* 3. CANCELLATION PROMPT POPUP */}
    <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground flex items-center gap-2">
            Cancel Registration?
          </DialogTitle>
          <DialogDescription className="pt-2">
            Are you sure you want to release your slot for <span className="font-semibold text-foreground">{classItem.name}</span> at {classItem.time}?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4 flex flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCancelDialog(false)} 
            className="w-full sm:w-auto rounded-xl"
          >
            Keep Spot
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









