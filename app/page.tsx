"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { BottomNav } from "@/components/bottom-nav"
import { HomeScreen } from "@/components/screens/home-screen"
import { ClassesScreen } from "@/components/screens/classes-screen"
import { BookingsScreen } from "@/components/screens/bookings-screen"
import { ProfileScreen } from "@/components/screens/profile-screen"
import { AdminScreen } from "@/components/screens/admin-screen"

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("classes")
  const { data: session } = useSession()
  const isUserAdmin = session?.user?.isAdmin === true
  console.log("🖥️ [Client Render] Checking browser state. Is Admin?", isUserAdmin)


  const renderScreen = () => {
    switch (activeTab) {
      case "home":
        return <HomeScreen />
      case "classes":
        return <ClassesScreen />
      case "bookings":
        return <BookingsScreen />
      case "profile":
        return <ProfileScreen />
      case "admin":
        return isUserAdmin ? <AdminScreen /> : <ClassesScreen />
      default:
        return <ClassesScreen />
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {renderScreen()}
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} isAdmin={isUserAdmin}/>
    </div>
  )
}
