"use client"

import { useState } from "react"

interface AccordionItemProps {
  icon: React.ReactNode
  title: string
  isOpen: boolean
  onToggle: () => void
}

function AccordionItem({ icon, title, isOpen, onToggle }: AccordionItemProps) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-4 px-5 border-b border-border"
    >
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground">{icon}</span>
        <span className="text-foreground font-medium">{title}</span>
      </div>
      <svg
        className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
      </svg>
    </button>
  )
}

export function ProfileScreen() {
  const [openSection, setOpenSection] = useState<string | null>(null)

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />

      {/* e-Membership Card */}
      <section className="px-5 py-4">
        <div className="bg-gradient-to-br from-[#3b5998] to-[#1e3a6e] rounded-2xl p-5 text-white relative overflow-hidden">
          {/* Logo */}
          <div className="flex items-center justify-between mb-6">
            <div className="w-16 h-16 bg-[#1a4b8c] rounded-xl flex items-center justify-center">
              <div className="text-center">
                <svg className="w-8 h-8 text-white mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-[8px] font-bold">AIR FITNESS</span>
              </div>
            </div>
            <h2 className="text-xl font-semibold">e-Membership Card</h2>
          </div>

          {/* QR Code and User Info */}
          <div className="flex items-start gap-4 mb-6">
            <div className="w-20 h-20 bg-white/10 border-2 border-amber-400 rounded-lg flex items-center justify-center">
              <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold">LEUNG XXXXX...</h3>
              <p className="text-lg text-white/80">9001</p>
            </div>
            <div className="w-16 h-20 bg-gray-300 rounded-lg overflow-hidden">
              <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400" />
            </div>
          </div>

          {/* Membership Details */}
          <div className="flex justify-between text-sm">
            <div>
              <p className="text-amber-400 font-medium">MEMBERSHIP</p>
              <p className="text-white/90">CONTRACT</p>
            </div>
            <div>
              <p className="text-amber-400 font-medium">BRANCH</p>
              <p className="text-white/90">TSUEN WAN CLUB</p>
            </div>
            <div>
              <p className="text-amber-400 font-medium">EXPIRY DATE</p>
              <p className="text-white/90">28/09/2024</p>
            </div>
          </div>
        </div>
      </section>

      {/* Menu Items */}
      <section className="mt-2">
        <AccordionItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          title="My account"
          isOpen={openSection === "account"}
          onToggle={() => toggleSection("account")}
        />
        <AccordionItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          title="Settings"
          isOpen={openSection === "settings"}
          onToggle={() => toggleSection("settings")}
        />
        <AccordionItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          title="Legal"
          isOpen={openSection === "legal"}
          onToggle={() => toggleSection("legal")}
        />
        <AccordionItem
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          }
          title="Feedback"
          isOpen={openSection === "feedback"}
          onToggle={() => toggleSection("feedback")}
        />
        
        {/* Logout Button */}
        <button
          onClick={() => {
            // Handle logout logic here
            console.log("Logout clicked")
          }}
          className="w-full flex items-center gap-3 py-4 px-5 border-b border-border"
        >
          <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          <span className="text-red-500 font-medium">Logout</span>
        </button>
      </section>

      {/* Version */}
      <section className="px-5 py-6 mt-4 flex items-center justify-end pb-28">
        <span className="text-muted-foreground text-sm">v1.7.3</span>
      </section>
    </div>
  )
}
