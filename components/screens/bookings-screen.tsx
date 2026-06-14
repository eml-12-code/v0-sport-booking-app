"use client"

import { useEffect, useState } from "react"
import { getBookedClasses } from "@/app/actions/booking"
import { useSession } from "next-auth/react"
import { getAccountProfile } from "@/app/actions/account"


interface BookingItem {
  id: string
  classId: string
  className: string
  time: string
  room: string
  instructor: string
  date: string
  location: string
  spots: number
  status: string // 🟢 ADDED: Tracking status field
}

// ------------------------------------------------------------------


function isBookingItem(value: unknown): value is BookingItem {

  if (!value || typeof value !== "object") return false
  
  const candidate = value as any
  
  const finalId = candidate.id || candidate.bookingId;
  const finalStatus = candidate.status || "upcoming";

  const checkId = typeof finalId === "string" && finalId !== "undefined";
  const checkClassId = typeof candidate.classId === "string";
  const checkClassName = typeof candidate.className === "string";
  const checkTime = typeof candidate.time === "string";
  const checkRoom = typeof candidate.room === "string";
  const checkInstructor = typeof candidate.instructor === "string";

  const checkLocation = typeof candidate.location === "string";
  const checkSpots = typeof candidate.spots === "number";
  const checkDate = typeof candidate.date === "string";

  // Normalize parameters back inside our object reference variables 
  if (checkId && !candidate.id) candidate.id = finalId;
  if (!candidate.status) candidate.status = finalStatus;

  return (
    checkId && checkClassId && checkClassName && checkTime && 
    checkRoom && checkInstructor && checkDate && checkLocation && checkSpots
  )
}

// ------------------------------------------------------------------


type TabType = "upcoming" | "waiting" | "completed" | "cancelled"

export function BookingsScreen() {
  const [bookings, setBookings] = useState<BookingItem[]>([])
  const { data: session } = useSession()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>("upcoming")

  const userId =
    session?.user?.email?.trim() ||
    session?.user?.name?.trim() ||
    "anonymous"

  console.log ( " [bookings-screen.tsx --> BookingsScreen ] --> userId " , userId )

// ------------------------------------------------------------------------


useEffect(() => {
  async function fetchBookings() {
    try {
      setLoading(true)
      console.log("💻 [ bookings-screen -> fetchBookings ] D - CLIENT] Hook fired. Fetching profile details...")
      
      const profile = await getAccountProfile()
      const memberId = profile ? profile.memberId : 0
      
      const rawData = await getBookedClasses(memberId)
      console.log( "💻 [ bookings-screen -> fetchBookings ] ")
      console.table ( rawData )

      const validatedData = rawData.filter(isBookingItem)

      console.log(`💻 [TRACE G - CLIENT] Validation complete. Accepted items passing TypeGuard: ${validatedData.length}`)

      setBookings(validatedData)
    } catch (error) {
      console.error("💻 [TRACE ERROR - CLIENT] Fetching execution error:", error)
    } finally {
      setLoading(false)
    }
  }
  fetchBookings()
}, [userId])

// ------------------------------------------------------------------------

  const tabs: { id: TabType; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ]

// ------------------------------------------------------------
// Filter bookings based on active tab

  const filteredBookings = bookings.filter((booking) => {


    const currentStatus = booking.status.trim().toLowerCase()

    const todayStr = new Date().toLocaleDateString("en-CA") // Outputs exactly "2026-06-12"
    const classDateStr = booking.date // Example: "2026-06-12"

    const isPastClass = classDateStr < todayStr

    // if (booking.classId === "HK-10" || classDateStr.includes("06-12") || classDateStr.includes("2026-06-12")) {
    //  console.log("⚡ [FILTER DEBUG] Evaluating item:", {
    //    className: booking.className,
    //    classId: booking.classId,
    //    classDateStr: classDateStr,
    //    todayStr: todayStr,
    //    currentStatus: currentStatus,
    //    activeTab: activeTab,
    //    isPastClass: isPastClass,
    //    matchesUpcomingCondition: (currentStatus === "confirmed" && !isPastClass)
    //  });
    //}

    if (activeTab === "upcoming") {
      return booking.status === "confirmed" && !isPastClass
    }

    if (activeTab === "waiting") {
      return booking.status === "waiting" && !isPastClass
    }

    if (activeTab === "completed") {
      // Classes that are past or manually marked as completed by your database query engine
      return isPastClass || booking.status === "completed"
    }

    if (activeTab === "cancelled") {
      return booking.status === "cancelled"
    }

    return false
  })

  // ------------------------------------------------------------
  const formatDate = (dateStr: string) => {

    // splits "2026-06-12" into ["2026", "06", "12"]

    const parts = dateStr.split("-")
    if (parts.length !== 3) return dateStr
    
    // Returns formatted string as "12-06-2026"
    return `${parts[2]}-${parts[1]}-${parts[0]}`
  }
// ------------------------------------------------------------
  

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 py-3 flex items-center justify-between bg-background">
        <h1 className="text-2xl font-bold text-[#333333]">Bookings</h1>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* 🟢 FIXED: Rounded Pill Tab Selectors to match visual blueprint design mockup */}
      <div className="px-5 py-3 flex gap-2 overflow-x-auto no-scrollbar bg-background border-b border-muted">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2 text-sm font-semibold rounded-full transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? "bg-[#2A52BE] text-white shadow-sm"
                : "bg-[#F1F3F5] text-muted-foreground hover:bg-[#E9ECEF]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings Stream Canvas List */}
      <main className="px-5 py-5 pb-28 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-[#2A52BE] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-16 bg-background rounded-2xl border border-dashed border-muted">
            <p className="text-muted-foreground font-medium">No {activeTab} bookings found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="relative bg-background border border-muted/80 rounded-2xl p-4 pl-6 shadow-sm overflow-hidden"
              >
                {/* 🟢 FIXED: Left Margin Colored Border Strip matched dynamically to active tab */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  activeTab === "upcoming" ? "bg-[#2A52BE]" :
                  activeTab === "waiting" ? "bg-amber-500" :
                  activeTab === "completed" ? "bg-emerald-600" : "bg-red-500"
                }`} />

                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatDate(booking.date)} • {booking.time}</span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#212529] tracking-tight uppercase pt-0.5">
                      {booking.className}
                    </h3>

                    <div className="pt-2 space-y-1 text-xs text-muted-foreground font-medium">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span>{booking.location} - {booking.room}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{booking.instructor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m10 2V2M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        <span>Group Class</span>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ))}
            <p className="text-center text-muted-foreground text-xs font-semibold py-4 uppercase tracking-wider">
              End of Bookings
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

