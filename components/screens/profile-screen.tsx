"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { getAccountProfile, type AccountProfile } from "@/app/actions/account"
import { getMemberContracts, type Contract } from "@/app/actions/contract"

interface AccordionItemProps {
  icon: React.ReactNode
  title: string
  isOpen: boolean
  onToggle: () => void
  children?: React.ReactNode
}

function AccordionItem({ icon, title, isOpen, onToggle, children }: AccordionItemProps) {
  return (
    <div>
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
      {isOpen && children && (
        <div className="px-5 py-4 border-b border-border bg-muted/30">
          {children}
        </div>
      )}
    </div>
  )
}

function formatDateDDMMYYYY(dateStr: string | null): string {
  if (!dateStr) return "N/A"
  const [year, month, day] = dateStr.split("-")
  return `${day}/${month}/${year}`
}

function ContractStatusBadge({ status }: { status: Contract["contractStatus"] }) {
  const styles = {
    active: "bg-emerald-500/20 text-emerald-400",
    expired: "bg-zinc-500/20 text-zinc-400",
    canceled: "bg-red-500/20 text-red-400",
  }

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium uppercase ${styles[status]}`}>
      {status}
    </span>
  )
}

function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#3b5998] to-[#1e3a6e] rounded-2xl p-5 text-white relative overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-6">
        <div className="w-16 h-16 bg-white/10 rounded-xl" />
        <div className="h-6 w-40 bg-white/10 rounded" />
      </div>
      <div className="flex items-start gap-4 mb-6">
        <div className="w-20 h-20 bg-white/10 rounded-lg" />
        <div className="flex-1 space-y-2">
          <div className="h-6 w-32 bg-white/10 rounded" />
          <div className="h-5 w-16 bg-white/10 rounded" />
        </div>
      </div>
      <div className="flex justify-between">
        <div className="space-y-1">
          <div className="h-4 w-20 bg-white/10 rounded" />
          <div className="h-4 w-16 bg-white/10 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-16 bg-white/10 rounded" />
          <div className="h-4 w-12 bg-white/10 rounded" />
        </div>
        <div className="space-y-1">
          <div className="h-4 w-20 bg-white/10 rounded" />
          <div className="h-4 w-20 bg-white/10 rounded" />
        </div>
      </div>
    </div>
  )
}

export function ProfileScreen() {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [profileData, contractsData] = await Promise.all([
          getAccountProfile(),
          getMemberContracts(),
        ])
        setProfile(profileData)
        setContracts(contractsData)
      } catch (error) {
        console.error("Failed to fetch profile data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const toggleSection = (section: string) => {
    setOpenSection(openSection === section ? null : section)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Status Bar Spacer */}
      <div className="h-12 bg-background" />

      {/* e-Membership Card */}
      <section className="px-5 py-4">
        {loading ? (
          <ProfileSkeleton />
        ) : (
          <div className="bg-gradient-to-br from-[#3b5998] to-[#1e3a6e] rounded-2xl p-5 text-white relative overflow-hidden">
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

            <div className="flex items-start gap-4 mb-6">
              <div className="w-20 h-20 bg-white/10 border-2 border-amber-400 rounded-lg flex items-center justify-center">
                <svg className="w-12 h-12 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold">{profile?.username?.toUpperCase() || "---"}</h3>
                <p className="text-lg text-white/80">{profile?.memberId ?? "---"}</p>
              </div>
              <div className="w-16 h-20 bg-gray-300 rounded-lg overflow-hidden">
                <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-400" />
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex justify-between text-sm mb-4">
              <div>
                <p className="text-amber-400 font-medium uppercase">Membership</p>
                <p className="text-white/90">{"Level " + (profile?.memberLevel ?? "-")}</p>
              </div>
              <div>
                <p className="text-amber-400 font-medium uppercase">Token Remain</p>
                <p className="text-white/90 text-center">{profile?.tokenRemain ?? 0}</p>
              </div>
              <div>
                <p className="text-amber-400 font-medium uppercase">Expiry Date</p>
                <p className="text-white/90">{formatDateDDMMYYYY(profile?.expiryDate ?? null)}</p>
              </div>
            </div>

            {/* Member Since */}
            <div className="border-t border-white/10 pt-3">
              <p className="text-xs text-white/50">
                {"Member since " + formatDateDDMMYYYY(profile?.startDate ?? null)}
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Menu Items */}
      <section className="mt-2">
        {/* My Account */}
        <AccordionItem
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
          title="My account"
          isOpen={openSection === "account"}
          onToggle={() => toggleSection("account")}
        >
          {profile && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Username</span>
                <span className="text-foreground font-medium">{profile.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="text-foreground font-medium">{profile.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member ID</span>
                <span className="text-foreground font-medium">{profile.memberId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Level</span>
                <span className="text-foreground font-medium">{profile.memberLevel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Remain</span>
                <span className="text-foreground font-medium">{profile.tokenRemain}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Expiry Date</span>
                <span className="text-foreground font-medium">{formatDateDDMMYYYY(profile.expiryDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Member Since</span>
                <span className="text-foreground font-medium">{formatDateDDMMYYYY(profile.startDate)}</span>
              </div>
            </div>
          )}
        </AccordionItem>

        {/* Contracts */}
        <AccordionItem
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
          title="Contracts"
          isOpen={openSection === "contracts"}
          onToggle={() => toggleSection("contracts")}
        >
          {contracts.length === 0 ? (
            <p className="text-sm text-muted-foreground">No contracts found.</p>
          ) : (
            <div className="space-y-4">
              {contracts.map((contract) => (
                <div key={contract.id} className="rounded-lg border border-border bg-background p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-foreground">
                      {"Contract #" + contract.id}
                    </span>
                    <ContractStatusBadge status={contract.contractStatus} />
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Start Date</span>
                      <span className="text-foreground">{formatDateDDMMYYYY(contract.startDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Expiry Date</span>
                      <span className="text-foreground">{formatDateDDMMYYYY(contract.expiryDate)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Reminder Token</span>
                      <span className="text-foreground">{contract.reminderToken}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AccordionItem>

        {/* Settings */}
        <AccordionItem
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          title="Settings"
          isOpen={openSection === "settings"}
          onToggle={() => toggleSection("settings")}
        />
        
        {/* Logout Button */}
        <button
          onClick={async () => { 
            await signOut({ 
              callbackUrl: "/login", 
              redirect: true 
            })
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
