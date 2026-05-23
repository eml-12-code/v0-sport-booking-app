// ==================================================================================
// 1. PARENT LEVEL: ClassesScreen (app/page.tsx -> ClassesScreen)
// ==================================================================================
// [State Hooks]
//   ├─ selectedDate ─────┐ (e.g., Date Object: 2026-05-21)
//   └─ selectedLocation ─┼─► triggers fetchData() ──► Queries MySQL & Redis Cache
//                        │
//                        ▼ 
//          [Passes Down as React Props] ( class-list.tsx )
//            classes={classes}
//            bookedClasses={bookedClasses}
//            memberId={memberId}
//            selectedCalendarDate={selectedDate} ───┐
//                                                   │
//                                                   ▼
// ==================================================================================
// 2. INTERMEDIATE LEVEL: ClassList (components/class-list.tsx)
// ==================================================================================
//   Receives: Props from ClassesScreen
//   Formats: Selected Date Object ──► "2026-05-21" (fallbackDateString)
//   Loops: classes.map((classItem) => ...)
//            │
//            ▼ Injects date property into item payload object
//          [Passes Down as React Props]
//            classItem={{ ...classItem, date: "2026-05-21" }}
//            isBooked={true / false}
//            memberId={12}
//                                                   │
//                                                   ▼
// ==================================================================================
// 3. CHILD CARD COMPONENT: ClassCard (components/class-card.tsx)
// ==================================================================================
// [Internal Live Engine Tracking]
//   └─ useEffect (Interval running every 10 seconds)
//        └─ Evaluates: Live Time vs (classItem.date + classItem.time)
//             └─ IF passed ──► Blocks button click, applies grey variant CSS classes.
// 
// [User Interaction: Clicks "Book Now" / "Cancel Booking"]
//   │
//   ▼ Intercepts action flow using local state flags
//   ├─ If New Booking   ──► Sends execution straight to server action pipeline
//   └─ If Cancel Action ──► Renders <Dialog> Modal ──► User Clicks Confirm
//                                                                 │
//                                                                 ▼
// ==================================================================================
// 4. BACKEND PROCESSING: Server Action (app/actions/booking.ts)
// ==================================================================================
// Runs securely on the Server Node.js runtime environment:
//   1. redlock.acquire() ─────► Locks Class Row (Prevents double booking race hazards)
//   2. SQL Transaction ──────► Checks user token balance inside 'accounts' table
//   3. SQL Execution ────────► Deducts/Refunds tokens, updates 'classes' spots
//   4. SQL Logging ──────────► INSERTS confirmation row to 'transactions_log'
//   5. redis.del() ──────────► Wipes Redis cache matching target date + location
//   6. revalidatePath("/") ──► Flushes server layout page data stream caches
//   7. Return Result ────────► Sends { success: true, isBooked: true/false } back
//                                                                 │
//                                                                 ▼
// ==================================================================================
// 5. STATE SYNC UP RE-RENDER LOOP
// ==================================================================================
//   ClassCard receives server callback response payload:
//     └─ Triggers confirmation popup modal windows on layout surface.
//     └─ Calls onBookingChange() callback hook parameter.
//          │
//          ▼ Elevates state updates upward to parent
//        ClassesScreen.handleBookingChange() updates state arrays.
//          └─ Triggers reactive screen rendering, syncing all tab elements.




"use client"

import { useState, useEffect, useCallback, useRef } from "react" 
import { DatePicker } from "@/components/date-picker"
import { ClassList } from "@/components/class-list"
import { useSession } from "next-auth/react"
import { getAccountProfile } from "@/app/actions/account"
import { getClasses, getBookedClasses } from "@/app/actions/booking"

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

  // 🟢 FIXED: Target index [0] explicitly to store a clean single string configuration item
  const [selectedLocation, setSelectedLocation] = useState<string>(locations[0])
  const [isLocationOpen, setIsLocationOpen] = useState(false)

  const { data: session, status } = useSession()

  const [classes, setClasses] = useState([])
  const [bookedClasses, setBookedClasses] = useState<string[]>([])
  const [memberId, setMemberId] = useState<number>(0)
  const [isLoading, setIsLoading] = useState(true)

  // Mutable reference tracking variable to safely pass array context blocks
  const classesRef = useRef(classes)

  // Orchestrator function to sync profiles and classes
  const fetchData = useCallback(async () => {
    if (status === 'loading') return

    // Show visual loader frame only if the active viewport state has no card arrays rendered yet
    if (classesRef.current.length === 0) {
      setIsLoading(true)
    }

    try {
      console.log("🔍 [Trace 1] Starting fetchData loop...")
      const profile = await getAccountProfile()
      const currentMemberId = profile ? profile.memberId : 0
      setMemberId(currentMemberId)

      console.log("🔍 [Trace 2] Profile loaded. Member ID:", currentMemberId)
      console.log("🔍 [Trace 3] Querying MySQL for Date:", selectedDate, "Location:", selectedLocation)

      const [classesData, bookedData] = await Promise.all([
        getClasses(selectedDate || new Date(), selectedLocation),
        getBookedClasses(currentMemberId)
      ])

      console.log("🔍 [Trace 4] MySQL Classes Data Received:", classesData)
      console.log("🔍 [Trace 5] MySQL Booked IDs Received:", bookedData)

      setBookedClasses(bookedData.map((b) => b.classId))
      setClasses(classesData || [])
      classesRef.current = classesData || [] // Updates reference variable silently without re-renders
      
      console.log("🔍 [Trace 6] React States updated successfully.")
    } catch (error) {
      console.error("❌ CRASH inside fetchData loop orchestrator:", error)
    } {
      setIsLoading(false)
    }
  }, [selectedDate, selectedLocation, status]) // Optimized dependency array to protect runtime loop states

  // Smart polling effect loop with auto-shutdown safety parameters
  useEffect(() => {
    fetchData()

  // Inside your useEffect hook block in classes-screen.tsx -> Replace isClassExpired with this:

  const isClassExpired = (cls: any) => {
    try {
      if (!cls || !cls.time) return false;

      let year: number, month: number, day: number;

      // 🟢 UNIVERSAL NORMALIZER: Convert whatever format cls.date is into a clean Date object
      const safeDateObject = cls.date ? new Date(cls.date) : new Date();

      if (isNaN(safeDateObject.getTime())) {
        const fallback = new Date()
        year = fallback.getFullYear()
        month = fallback.getMonth() + 1
        day = fallback.getDate()
      } else {
        year = safeDateObject.getFullYear()
        month = safeDateObject.getMonth() + 1
        day = safeDateObject.getDate()
      }

      const timeStr = cls.time.trim().toUpperCase()
      const match = timeStr.match(/^(\d+):(\d+)\s*(AM|PM)?$/)
      if (!match) return false

      let hours = parseInt(match[1], 10)
      const minutes = parseInt(match[2], 10)
      const modifier = match[3]

      if (modifier === 'PM' && hours !== 12) hours += 12
      if (modifier === 'AM' && hours === 12) hours = 0

      const exactClassDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0)
      return new Date() > exactClassDateTime
    } catch (e) {
      console.error("❌ Polling pre-check parser error:", e)
      return false
    }
  }

    const syncInterval = setInterval(() => {
      const currentOnScreenClasses = classesRef.current

      if (currentOnScreenClasses && currentOnScreenClasses.length > 0) {
        const hasActiveFutureClasses = currentOnScreenClasses.some((cls: any) => !isClassExpired(cls))

        if (!hasActiveFutureClasses) {
          console.log("⏹️ [Live Sync Stopped] All classes on screen have passed. Clearing polling thread interval.")
          clearInterval(syncInterval)
          return
        }
      }

      console.log("🔄 [Live Sync Check] Future classes active on view layer. Syncing spot parameters...")
      fetchData()
    }, 5000)

    return () => clearInterval(syncInterval)
  }, [fetchData, status])

  const handleBookingChange = async (classId: string, isBooked: boolean) => {
    setBookedClasses((prev) =>
      isBooked ? [...prev, classId] : prev.filter((id) => id !== classId)
    )
    await fetchData()
  }

  const userDisplayName =
    session?.user?.name?.trim() ||
    session?.user?.email?.split("@")[0]?.trim() ||
    ""
  console.log("ClassesScreen --> Rendering view grid canvas surface layers")

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
        {isLoading ? (
          <div className="text-center py-10 text-muted-foreground text-sm">Loading classes...</div>
        ) : (
          <ClassList 
            classes={classes}
            bookedClasses={bookedClasses}
            memberId={memberId}
            handleBookingChange={handleBookingChange} 
            selectedCalendarDate={selectedDate} 
          />
        )}
      </main>
    </>
  )
}

