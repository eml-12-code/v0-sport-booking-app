"use client"

import { useState, useEffect } from "react"
import { signOut } from "next-auth/react"
import { getAccountProfile, getMemberLogs, type AccountProfile, type TransactionLogItem } from "@/app/actions/account"
import { getMemberContracts, type Contract } from "@/app/actions/contract"
import { handleUserLogout } from "@/app/actions/auth-actions"
import { Button } from "@/components/ui/button"

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
        className="w-full flex items-center justify-between py-4 px-5 border-b border-border hover:bg-muted/10 transition-colors"
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
  try {
    const pureDate = dateStr.includes("T") ? dateStr.split("T")[0] : dateStr
    const parts = pureDate.split("-")
    if (parts.length !== 3) return dateStr
    const [year, month, day] = parts
    return `${day}/${month}/${year}`
  } catch {
    return "N/A"
  }
}

function formatTimeHHMM(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    return date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZoneName: "short"  })
  } catch {
    return "--:--"
  }
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

function ActionBadge({ action }: { action: string }) {
  const styles: Record<string, string> = {
    book: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    cancel: "bg-red-500/20 text-red-400 border border-red-500/30",
    topup: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    expire: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    refund: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    login: "bg-zinc-500/20 text-zinc-300 border border-zinc-500/30",
    logout: "bg-slate-500/20 text-slate-400 border border-slate-500/30",
  }
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${styles[action] || "bg-muted text-muted-foreground"}`}>
      {action}
    </span>
  )
}

function ProfileSkeleton() {
  return (
    <div className="bg-gradient-to-br from-[#3b5998] to-[#1e3a6e] rounded-2xl p-5 text-white relative overflow-hidden animate-pulse">
      <div className="flex items-center justify-between mb-6"><div className="w-16 h-16 bg-white/10 rounded-xl" /><div className="h-6 w-40 bg-white/10 rounded" /></div>
      <div className="flex items-start gap-4 mb-6"><div className="w-20 h-20 bg-white/10 rounded-lg" /><div className="flex-1 space-y-2"><div className="h-6 w-32 bg-white/10 rounded" /><div className="h-5 w-16 bg-white/10 rounded" /></div></div>
    </div>
  )
}


export function ProfileScreen() {
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [profile, setProfile] = useState<AccountProfile | null>(null)
  const [contracts, setContracts] = useState<Contract[]>([])
  const [logs, setLogs] = useState<TransactionLogItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        // Protect your application from freezing completely if a secondary array fails
        const [profileData, contractsData, logsData] = await Promise.all([
          getAccountProfile().catch(() => null),
          getMemberContracts().catch(() => []),
          getMemberLogs().catch(() => []),
        ])
        setProfile(profileData)
        setContracts(contractsData || [])
        setLogs(logsData || [])
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
    <div className="min-h-screen bg-background flex flex-col justify-between pb-28">
      <div>
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
              </div>

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
                <div className="flex justify-between"><span className="text-muted-foreground">Username</span><span className="text-foreground font-medium">{profile.username}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span className="text-foreground font-medium">{profile.email}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Member ID</span><span className="text-foreground font-medium">{profile.memberId}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Token Remain</span><span className="text-foreground font-medium">{profile.tokenRemain}</span></div>
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
                      <span className="text-sm font-medium text-foreground">{"Contract #" + contract.id}</span>
                      <ContractStatusBadge status={contract.contractStatus} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionItem>

          {/* Login History (Account Activity logs)                         */}
          {/* The Data Supplier: src/app/actions/account.ts (getMemberLogs) */}
          <AccordionItem
            icon={
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            title="Login History"
            isOpen={openSection === "history"}
            onToggle={() => toggleSection("history")}
          >
            {logs.length === 0 ? (
              <p className="text-sm text-muted-foreground py-2 text-center">No recent access history found.</p>
            ) : (
              /* 🔥 UPDATED: Set a explicit height box to fit exactly 5 items comfortably with smooth scrolling */
              <div className="h-[360px] overflow-y-auto space-y-2.5 pr-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                {logs
                  .filter((log) => log.action === "login" || log.action === "logout")
                  .map((log) => (
                  <div 
                    key={log.logId} 
                    className="flex flex-col gap-1 p-3 rounded-xl border border-border bg-background/50 text-xs shadow-sm hover:border-muted-foreground/30 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ActionBadge action={log.action} />
                        <span className="text-sm font-bold text-foreground capitalize">
                          {log.action === "login" || log.action === "logout" 
                            ? `${log.action} session verified` 
                            : log.className || "Token Adjustment"}
                        </span>
                      </div>
                      <span className="text-sm font-bold tracking-tight text-foreground bg-muted/60 px-2 py-0.5 rounded-md">
                        {formatDateDDMMYYYY(log.createdAt)} {formatTimeHHMM(log.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </AccordionItem>

        </section>
      </div>

      {/* Sign Out */}
      <div className="px-5 mt-6">
        <Button 
          variant="destructive" 
          onClick={async () => {
            await handleUserLogout() 
          }}
          className="w-full h-11 rounded-xl font-bold text-sm shadow-sm"
        >
          Sign Out
        </Button>
      </div>
    </div>
  )
}

