"use client"

import { useEffect, useState } from "react"
import { getBookedClasses } from "@/app/actions/booking"
import { getAccountProfile } from '@/app/actions/account' 
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
}

export function HomeScreen() {
  const [todayBookings, setTodayBookings] = useState<BookingItem[]>([])
  const [loading, setLoading] = useState(true)
  const { data: session } = useSession()

  const userId =
    session?.user?.email?.trim() ||
    session?.user?.name?.trim() ||
    "anonymous"

  useEffect(() => {
    async function fetchTodayBookings() {
      try {

        console.log ( "--------------userId " , userId )

        // ---------
        // Fetch the user's database profile securely from the server
        const profile = await getAccountProfile()

        // Extract the numeric memberId, default to 0 if not logged in
        const memberId = profile ? profile.memberId : 0

        // ---------
        const bookings = await getBookedClasses(memberId)
        
        // Filter for today's bookings
        const today = new Date().toISOString().split('T')[0]
        const todayOnly = bookings.filter((b: BookingItem) => b.date === today)
        setTodayBookings(todayOnly)
      } catch (error) {
        console.error("Error fetching bookings:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchTodayBookings()
  }, [userId])

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />
      
      {/* Header */}
      <header className="px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-primary">AIR FITNESS</span>
        </div>
        <button className="relative w-10 h-10 rounded-full bg-muted flex items-center justify-center">
          <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            34
          </span>
        </button>
      </header>

      {/* Promotional Banners */}
      <section className="px-5 mb-6">
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
          <div className="flex-shrink-0 w-[280px] h-[180px] rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 overflow-hidden">
            <div className="h-full flex flex-col justify-end p-4">
              <h3 className="text-lg font-bold text-foreground">Pilates Reformer</h3>
              <p className="text-sm text-muted-foreground">Improve posture, build strength</p>
            </div>
          </div>
          <div className="flex-shrink-0 w-[280px] h-[180px] rounded-2xl bg-gradient-to-br from-green-500/20 to-green-500/5 border border-green-500/20 overflow-hidden">
            <div className="h-full flex flex-col justify-end p-4">
              <h3 className="text-lg font-bold text-foreground">New Branch Opening</h3>
              <p className="text-sm text-muted-foreground">24-hour gym coming soon</p>
            </div>
          </div>
        </div>
      </section>

      {/* Today's Bookings */}
      <section className="px-5 pb-28">
        <h2 className="text-xl font-bold text-foreground mb-4">Today Booking</h2>
        
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : todayBookings.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No bookings for today</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayBookings.map((booking) => (
              <div key={booking.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-primary font-semibold">{booking.time}</p>
                    <h3 className="text-lg font-bold text-foreground uppercase">{booking.className}</h3>
                    <div className="mt-2 space-y-1">
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
          </div>
        )}
      </section>
    </div>
  )
}
