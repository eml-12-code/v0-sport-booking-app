"use client"

import { useEffect, useState } from "react"
import { getBookedClasses } from "@/app/actions/booking"
import { useSession } from "next-auth/react"


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
}

function isBookingItem(value: unknown): value is BookingItem {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<BookingItem>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.classId === "string" &&
    typeof candidate.className === "string" &&
    typeof candidate.time === "string" &&
    typeof candidate.room === "string" &&
    typeof candidate.instructor === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.location === "string" &&
    typeof candidate.spots === "number"
  )
}

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

  console.log ( "--------------userId " , userId )

  useEffect(() => {
    async function fetchBookings() {
      try {

        console.log ( "--------------userId " , userId )

        // ---------
        // Fetch the user's database profile securely from the server
        const profile = await getAccountProfile()

        // Extract the numeric memberId, default to 0 if not logged in
        const memberId = profile ? profile.memberId : 0

        // ---------
        const data = await getBookedClasses(memberId)

        setBookings(data.filter(isBookingItem))
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchBookings()
  }, [userId])

  const tabs: { id: TabType; label: string }[] = [
    { id: "upcoming", label: "Upcoming" },
    { id: "waiting", label: "Waiting" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ]

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter((booking) => {
    const bookingDate = new Date(booking.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (activeTab === "upcoming") {
      return bookingDate >= today
    }
    if (activeTab === "completed") {
      return bookingDate < today
    }
    // waiting and cancelled would need additional fields in the database
    return false
  })

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).replace(/\//g, "-")
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between border-b border-border">
        <h1 className="text-xl font-bold text-foreground">Bookings</h1>
        <button className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
      </header>

      {/* Tabs */}
      <div className="px-5 py-3 flex gap-6 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      <main className="px-5 py-4 pb-28">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No {activeTab} bookings</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="bg-card rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-primary font-semibold">
                      {formatDate(booking.date)} | {booking.time}
                    </p>
                    <h3 className="text-lg font-bold text-foreground uppercase mt-1">
                      {booking.className}
                    </h3>
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {booking.location} - {booking.room}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {booking.instructor}
                      </div>

                      {/* --- INSERT Seat Info  --- */}

                      <div className="flex items-center gap-2 text-sm">
                        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <span className={booking.spots <= 3 ? "text-orange-500 font-bold" : "text-muted-foreground"}>
                          {booking.spots} spots remaining
                        </span>
                      </div>

                      {/* --- END OF INSERT --- */}


                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2m10 2V2M3 10h18M5 22h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                        Group Class
                      </div>
                    </div>
                  </div>
                  <div className="text-primary">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-center text-muted-foreground text-sm py-4">End of bookings</p>
          </div>
        )}
      </main>
    </div>
  )
}
