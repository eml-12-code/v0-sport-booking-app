"use client"

import { useEffect } from "react"
import { useSession } from "next-auth/react"
import { logCookieSessionIfValid } from "@/app/actions/auth-actions"

export function SessionLogger() {
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === "authenticated" && session) {
      console.log("🍪 [Global Session Monitor] Valid session detected, executing HKT database log...")
      logCookieSessionIfValid()
    }
  }, [status, session])

  return null // This component runs purely in the background without rendering UI elements
}


